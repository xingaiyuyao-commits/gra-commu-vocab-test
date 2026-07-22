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

  const failed = results.filter((c) => !c).length;
  console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
