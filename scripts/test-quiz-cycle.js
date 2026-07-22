// 単語テスト週次サイクルの検証。使い方: node scripts/test-quiz-cycle.js
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { io } = require("socket.io-client");

const PORT = 3198;
const URL = `http://localhost:${PORT}`;
const CYCLE_FILE = path.join(__dirname, "..", "quiz-cycle.json");
const connect = () => io(URL, { transports: ["websocket"] });
const results = [];
const check = (cond, msg) => { results.push(cond); console.log((cond ? "ok:" : "FAIL:"), msg); };

function startServer() {
  const server = spawn("node", [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "inherit"],
  });
  return new Promise((res) => {
    server.stdout.on("data", (d) => { if (d.toString().includes("Server running")) res(server); });
  });
}

async function main() {
  // --- シナリオ1: 初期状態（quiz-cycle.jsonが無い場合） ---
  fs.rmSync(CYCLE_FILE, { force: true });
  let server = await startServer();
  try {
    const initial = await fetch(`${URL}/api/quiz-cycle`).then((r) => r.json());
    check(initial.week === 1 && Array.isArray(initial.history) && initial.history.length === 0,
      `ファイルが無い時は week=1, history=[] (実際: ${JSON.stringify(initial)})`);
  } finally {
    server.kill();
  }

  // --- シナリオ2: 既存ファイルから週番号を計算 ---
  fs.writeFileSync(CYCLE_FILE, JSON.stringify({
    count: 3,
    history: [
      { category: "clacel", seriesIndex: 0, label: "Clacel 2.0 Series 1" },
      { category: "ielts", seriesIndex: 1, label: "IELTS Series 2" },
      { category: "toeic", seriesIndex: 2, label: "TOEIC Series 3" },
    ],
  }));
  server = await startServer();
  try {
    const status = await fetch(`${URL}/api/quiz-cycle`).then((r) => r.json());
    check(status.week === 4, `count=3 のとき week=4 (実際: ${status.week})`);
    check(status.history.length === 3, `historyが3件そのまま返る (実際: ${status.history.length}件)`);
  } finally {
    server.kill();
    fs.rmSync(CYCLE_FILE, { force: true });
  }

  // --- シナリオ3: 通常週の完了で履歴に1件追加され、週が進む ---
  fs.rmSync(CYCLE_FILE, { force: true });
  server = await startServer();
  try {
    const host = connect();
    const guest = connect();
    const created = await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト" }, res));
    const joined = await new Promise((res) => guest.emit("quiz:joinRoom", { roomCode: created.roomCode, name: "参加者" }, res));
    check(joined.roomCode === created.roomCode, "参加者がロビーに入れる（シナリオ3準備）");

    const startedP = new Promise((res) => host.once("quiz:started", res));
    host.emit("quiz:startGame", { category: "clacel", seriesIndex: 0 });
    const started = await startedP;
    check(started.total === started.questions.length, `total が questions.length と一致 (実際: total=${started.total}, len=${started.questions.length})`);

    const resultsP = new Promise((res) => host.once("quiz:results", res));
    host.emit("quiz:submit", { answers: ["", "", "", "", ""] });
    guest.emit("quiz:submit", { answers: ["", "", "", "", ""] });
    await resultsP;

    const guestAck = await new Promise((res) => {
      guest.timeout(500).emit("quiz:completeSession", (err) => res(err ? "timeout" : "acked"));
    });
    check(guestAck === "timeout", "参加者（非ホスト）がcompleteSessionを呼んでも無視される（ackが来ない）");

    const done = await new Promise((res) => host.emit("quiz:completeSession", res));
    check(done.week === 2, `完了後 week=2 になる (実際: ${done.week})`);
    check(done.history.length === 1 && done.history[0].category === "clacel" && done.history[0].seriesIndex === 0,
      `historyに実施したシリーズが記録される (実際: ${JSON.stringify(done.history)})`);

    const status3 = await fetch(`${URL}/api/quiz-cycle`).then((r) => r.json());
    check(status3.week === 2, "GET /api/quiz-cycle にも反映される");

    host.disconnect(); guest.disconnect();
  } finally {
    server.kill();
    fs.rmSync(CYCLE_FILE, { force: true });
  }

  // --- シナリオ4: 週4の完了でhistoryがクリアされる ---
  fs.writeFileSync(CYCLE_FILE, JSON.stringify({
    count: 3,
    history: [
      { category: "clacel", seriesIndex: 0, label: "Clacel 2.0 Series 1" },
      { category: "ielts", seriesIndex: 1, label: "IELTS Series 2" },
      { category: "toeic", seriesIndex: 2, label: "TOEIC Series 3" },
    ],
  }));
  server = await startServer();
  try {
    const host = connect();
    const created = await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト" }, res));
    const startedP = new Promise((res) => host.once("quiz:started", res));
    host.emit("quiz:startGame", { category: "toeic", seriesIndex: 4 });
    await startedP;
    const resultsP = new Promise((res) => host.once("quiz:results", res));
    host.emit("quiz:submit", { answers: ["", "", "", "", ""] });
    await resultsP;
    const done4 = await new Promise((res) => host.emit("quiz:completeSession", res));
    check(done4.week === 1, `週4完了後 week=1 に戻る (実際: ${done4.week})`);
    check(done4.history.length === 0, `週4完了後 historyがクリアされる (実際: ${done4.history.length}件)`);
    host.disconnect();
  } finally {
    server.kill();
    fs.rmSync(CYCLE_FILE, { force: true });
  }

  // --- シナリオ5: completeSessionを同じホストが2回呼んでも週は1度しか進まない ---
  fs.rmSync(CYCLE_FILE, { force: true });
  server = await startServer();
  try {
    const host = connect();
    const created = await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト" }, res));
    const startedP = new Promise((res) => host.once("quiz:started", res));
    host.emit("quiz:startGame", { category: "clacel", seriesIndex: 0 });
    await startedP;
    const resultsP = new Promise((res) => host.once("quiz:results", res));
    host.emit("quiz:submit", { answers: ["", "", "", "", ""] });
    await resultsP;

    const done5 = await new Promise((res) => host.emit("quiz:completeSession", res));
    check(done5.week === 2, `1回目のcompleteSessionは成功し week=2 になる (実際: ${done5.week})`);

    const secondAck = await new Promise((res) => {
      host.timeout(500).emit("quiz:completeSession", (err) => res(err ? "timeout" : "acked"));
    });
    check(secondAck === "timeout", "同じホストが2回目のcompleteSessionを呼んでも無視される（ackが来ない）");

    const status5 = await fetch(`${URL}/api/quiz-cycle`).then((r) => r.json());
    check(status5.week === 2, `2回目呼び出し後もweekは1回目の結果のまま (実際: ${status5.week})`);

    host.disconnect();
  } finally {
    server.kill();
    fs.rmSync(CYCLE_FILE, { force: true });
  }

  const failed = results.filter((c) => !c).length;
  console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
