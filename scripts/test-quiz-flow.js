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

    const created = await new Promise((res) => host.emit("quiz:createRoom", { category: "ielts", name: "ホスト" }, res));
    check(!!(created.roomCode && created.isHost && created.category === "ielts"), "ルーム作成でルームコードとホスト権が返る");

    const joined = await new Promise((res) => guest.emit("quiz:joinRoom", { roomCode: created.roomCode, name: "参加者" }, res));
    check(joined.roomCode === created.roomCode && joined.isHost === false, "ルームコードで同じロビーに入れる");

    const bad = await new Promise((res) => guest.emit("quiz:createRoom", { category: "bogus", name: "誰か" }, res));
    check(!!bad.error, "不正なカテゴリはエラー");

    const notFound = await new Promise((res) => guest.emit("quiz:joinRoom", { roomCode: "ZZZZ", name: "誰か" }, res));
    check(!!notFound.error, "存在しないルームコードはエラー");

    const startedBoth = Promise.all([
      new Promise((res) => host.once("quiz:started", res)),
      new Promise((res) => guest.once("quiz:started", res)),
    ]);
    host.emit("quiz:startGame", { seriesIndex: 0 });
    const [qh, qg] = await startedBoth;
    check(qh.questions.length === 20 && qh.total === 20, "20問配布される");
    check(typeof qh.endsAt === "number" && qh.endsAt > Date.now(), "制限時間の終了時刻が届く");
    check(JSON.stringify(qh.questions) === JSON.stringify(qg.questions), "全員に同じ問題が配られる");
    check(!("answer" in qh.questions[0]), "配布した問題に答えが含まれない");
    check(qh.setLabel === "IELTS Day 1", "セット名が届く");

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
    guest.emit("quiz:submit", { answers: Array(20).fill("") });
    const [rh] = await resultsBoth;
    check(rh.perfect.length === 1 && rh.perfect[0].name === "ホスト", "大文字・空白混じりでも正解扱いで満点者に入る");
    check(rh.others.length === 1 && rh.others[0].name === "参加者" && rh.others[0].score === 0, "空欄は0点でその他の参加者に入る");
    check(rh.review.length === 20 && rh.review.every((r) => r.answer && r.sentence.includes("___")), "答え合わせ用の正答が届く");

    // 再戦: ロビーに戻れる
    const backP = new Promise((res) => host.once("quiz:backToLobby", res));
    host.emit("quiz:playAgain");
    await backP;
    check(true, "playAgainでロビーに戻る");
    host.disconnect(); guest.disconnect();

    // --- シナリオ2: プレイ中の切断で残りメンバーだけで結果発表 ---
    const h2 = connect();
    const g2 = connect();
    const c2 = await new Promise((res) => h2.emit("quiz:createRoom", { category: "toeic", name: "A" }, res));
    await new Promise((res) => g2.emit("quiz:joinRoom", { roomCode: c2.roomCode, name: "B" }, res));
    const started2 = new Promise((res) => h2.once("quiz:started", res));
    h2.emit("quiz:startGame", { seriesIndex: 2 });
    await started2;
    const results2 = new Promise((res) => h2.once("quiz:results", res));
    h2.emit("quiz:submit", { answers: Array(20).fill("x") });
    g2.emit("quiz:leave"); // 未提出のまま明示的に退出（単なる切断＝リロードとは区別される）
    const r2 = await results2;
    const combined2 = [...r2.perfect, ...r2.others];
    check(combined2.length === 1 && combined2[0].name === "A", "未提出者の退出後、残りだけで結果発表");
    h2.disconnect(); g2.disconnect();

    // --- シナリオ3: プレイ中にリロード（切断→同じplayerIdで再接続）しても続きから復帰できる ---
    const h3 = connect();
    const g3 = connect();
    const guestPlayerId = "test-guest-" + Math.random().toString(36).slice(2);
    const c3 = await new Promise((res) => h3.emit("quiz:createRoom", { category: "clacel", name: "A" }, res));
    await new Promise((res) => g3.emit("quiz:joinRoom", { roomCode: c3.roomCode, name: "B", playerId: guestPlayerId }, res));
    const started3 = new Promise((res) => h3.once("quiz:started", res));
    h3.emit("quiz:startGame", { seriesIndex: 0 });
    await started3;

    g3.disconnect(); // ページリロードを模した瞬断
    const g3b = connect();
    const rejoin = await new Promise((res) =>
      g3b.emit("quiz:rejoin", { roomCode: c3.roomCode, playerId: guestPlayerId }, res)
    );
    check(rejoin.ok === true, "同じplayerIdでの再接続はrejoin成功を返す");
    check(rejoin.phase === "playing" && rejoin.submitted === false, "再接続時にプレイ中であることが分かる");
    check(Array.isArray(rejoin.questions) && rejoin.questions.length === 20, "再接続時に問題一式を再送してくれる");
    check(typeof rejoin.endsAt === "number" && rejoin.endsAt > Date.now(), "再接続時に残り時間の終了時刻も届く");

    // 再接続後も通常どおり提出できる
    const resultsBoth3 = Promise.all([
      new Promise((res) => h3.once("quiz:results", res)),
      new Promise((res) => g3b.once("quiz:results", res)),
    ]);
    h3.emit("quiz:submit", { answers: Array(20).fill("x") });
    g3b.emit("quiz:submit", { answers: Array(20).fill("y") });
    await resultsBoth3;
    check(true, "再接続後も提出でき結果発表まで進む");
    h3.disconnect(); g3b.disconnect();

    // --- シナリオ4: ホストが未提出者を残したままquiz:forceFinishで結果発表へ進められる ---
    const h4 = connect();
    const g4 = connect();
    const c4 = await new Promise((res) => h4.emit("quiz:createRoom", { category: "clacel", name: "A" }, res));
    await new Promise((res) => g4.emit("quiz:joinRoom", { roomCode: c4.roomCode, name: "B" }, res));
    const started4 = new Promise((res) => h4.once("quiz:started", res));
    h4.emit("quiz:startGame", { seriesIndex: 0 });
    const q4 = await started4;
    check(
      typeof q4.questions[0].sentenceJa === "string" && q4.questions[0].sentenceJa.length > 0,
      "配布される設問に例文の日本語訳(sentenceJa)が含まれる"
    );

    // ホスト以外からのforceFinishは無視される
    g4.emit("quiz:forceFinish");
    const guestAttempt = await Promise.race([
      new Promise((res) => h4.once("quiz:results", () => res("fired"))),
      new Promise((res) => setTimeout(() => res("not-fired"), 300)),
    ]);
    check(guestAttempt === "not-fired", "ホスト以外のquiz:forceFinishは無視される");

    // ホストのみ提出し、参加者は未提出のままforceFinishで結果発表へ進める
    const results4 = Promise.all([
      new Promise((res) => h4.once("quiz:results", res)),
      new Promise((res) => g4.once("quiz:results", res)),
    ]);
    h4.emit("quiz:submit", { answers: Array(20).fill("x") });
    h4.emit("quiz:forceFinish");
    const [r4h] = await results4;
    const combined4 = [...r4h.perfect, ...r4h.others];
    check(combined4.length === 2, "forceFinish後は未提出者も含めて全員分の結果が出る");
    const guestResult4 = combined4.find((e) => e.name === "B");
    check(!!guestResult4 && guestResult4.score === 0, "未提出のままforceFinishされた参加者は0点になる");
    h4.disconnect(); g4.disconnect();
  } finally {
    server.kill();
  }
  const failed = results.filter((c) => !c).length;
  console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
