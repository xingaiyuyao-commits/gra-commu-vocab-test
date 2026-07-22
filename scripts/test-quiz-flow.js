// 単語テストのサーバーフロー検証。使い方: node scripts/test-quiz-flow.js
const { spawn } = require("child_process");
const path = require("path");
const { io } = require("socket.io-client");
const WORDTESTS = require("../wordtests");

const PORT = 3199;
const URL = `http://localhost:${PORT}`;
const connect = () => io(URL, { transports: ["websocket"] });
const results = [];
const check = (cond, msg) => { results.push(cond); console.log((cond ? "ok:" : "FAIL:"), msg); };

async function main() {
  const server = spawn("node", [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise((res) => server.stdout.on("data", (d) => { if (d.toString().includes("Server running")) res(); }));

  try {
    // --- シナリオ1: 2人で通しプレイ（正解/不正解・順位・答え合わせ） ---
    const host = connect();
    const guest = connect();

    const created = await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト" }, res));
    check(!!(created.roomCode && created.isHost), "ルーム作成でコードとホスト権が返る");

    const joined = await new Promise((res) => guest.emit("quiz:joinRoom", { roomCode: created.roomCode, name: "参加者" }, res));
    check(joined.roomCode === created.roomCode && joined.isHost === false, "参加者がロビーに入れる");

    const bad = await new Promise((res) => guest.emit("quiz:joinRoom", { roomCode: "XXXX", name: "誰か" }, res));
    check(!!bad.error, "存在しないルームコードはエラー");

    const startedBoth = Promise.all([
      new Promise((res) => host.once("quiz:started", res)),
      new Promise((res) => guest.once("quiz:started", res)),
    ]);
    host.emit("quiz:startGame", { category: "ielts", seriesIndex: 0 });
    const [qh, qg] = await startedBoth;
    check(qh.questions.length === 5 && qh.total === 5, "5問配布される");
    check(JSON.stringify(qh.questions) === JSON.stringify(qg.questions), "全員に同じ問題が配られる");
    check(!("answer" in qh.questions[0]), "配布した問題に答えが含まれない");
    check(qh.setLabel === "IELTS Series 1", "セット名が届く");

    // 正答は問題文からデータを引いて求める（ホストは全問正解、参加者は全問空欄）
    const items = WORDTESTS.ielts.series[0].items;
    const correctAnswers = qh.questions.map((q) => items.find((it) => it.sentence === q.sentence).answer);

    const resultsBoth = Promise.all([
      new Promise((res) => host.once("quiz:results", res)),
      new Promise((res) => guest.once("quiz:results", res)),
    ]);
    const progressP = new Promise((res) => guest.once("quiz:submitProgress", res));
    host.emit("quiz:submit", { answers: correctAnswers.map((a) => "  " + a.toUpperCase() + " ") });
    const prog = await progressP;
    check(prog.submitted === 1 && prog.total === 2, "提出状況 1/2 が配信される");
    guest.emit("quiz:submit", { answers: ["", "", "", "", ""] });
    const [rh] = await resultsBoth;
    check(rh.perfect.length === 1 && rh.perfect[0].name === "ホスト", "大文字・空白混じりでも正解扱いで満点者に入る");
    check(rh.others.length === 1 && rh.others[0].name === "参加者" && rh.others[0].score === 0, "空欄は0点でその他の参加者に入る");
    check(rh.review.length === 5 && rh.review.every((r) => r.answer && r.sentence.includes("___")), "答え合わせ用の正答が届く");

    // 再戦: ロビーに戻れる
    const backP = new Promise((res) => host.once("quiz:backToLobby", res));
    host.emit("quiz:playAgain");
    await backP;
    check(true, "playAgainでロビーに戻る");
    host.disconnect(); guest.disconnect();

    // --- シナリオ2: プレイ中の切断で残りメンバーだけで結果発表 ---
    const h2 = connect();
    const g2 = connect();
    const c2 = await new Promise((res) => h2.emit("quiz:createRoom", { name: "A" }, res));
    await new Promise((res) => g2.emit("quiz:joinRoom", { roomCode: c2.roomCode, name: "B" }, res));
    const started2 = new Promise((res) => h2.once("quiz:started", res));
    h2.emit("quiz:startGame", { category: "toeic", seriesIndex: 2 });
    await started2;
    const results2 = new Promise((res) => h2.once("quiz:results", res));
    h2.emit("quiz:submit", { answers: ["a", "b", "c", "d", "e"] });
    g2.disconnect(); // 未提出のまま離脱
    const r2 = await results2;
    const combined2 = [...r2.perfect, ...r2.others];
    check(combined2.length === 1 && combined2[0].name === "A", "未提出者の切断後、残りだけで結果発表");
    h2.disconnect();
  } finally {
    server.kill();
  }
  const failed = results.filter((c) => !c).length;
  console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
