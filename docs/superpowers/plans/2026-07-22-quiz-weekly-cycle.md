# 単語テスト週次サイクル Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 単語テストに「週1〜3は1シリーズ、週4は3週分の復習」という月次サイクルを追加し、サイト全体で共有される週番号・履歴を管理する。

**Architecture:** `highscore.json`と同じパターンで`quiz-cycle.json`にサイクル状態（`count`・`history`）を永続化する。サーバーに`GET /api/quiz-cycle`・`quiz:completeSession`・`quiz:startReview`を追加し、クライアント（`index.html`のバナー、`quiz.html`のロビー/結果画面）がその状態を参照して表示を出し分ける。

**Tech Stack:** Node.js + Express + Socket.IO 4（既存のまま）。サーバーテストは`node`直実行のスクリプト（`socket.io-client`・組み込み`fetch`を使用）。

**Spec:** `docs/superpowers/specs/2026-07-22-quiz-weekly-cycle-design.md`

## Global Constraints

- サイクル状態はルームに紐づかない、サイト全体で共有される単一の値（`quiz-cycle.json`）
- 週番号は `week = (count % 4) + 1`。`count % 4 === 3`（＝週4）の完了時のみ履歴をクリアする
- 週の進行はホストが結果画面で明示的に押す「今週分を完了する」ボタンのみがトリガー（自動進行なし）
- ロビー・結果画面のサイクル関連UIは常に**ホストにのみ**表示する
- 既存のコインタワー/並べ替えバトル/単語テストの既存イベント・UIには触らない（`total: QUIZ_QUESTION_COUNT`の動的化以外）
- コミットメッセージは日本語・既存スタイルに合わせる

---

### Task 1: `quiz-cycle.json`永続化＋`GET /api/quiz-cycle`

**Files:**
- Modify: `server.js`（9〜26行目付近のhighscoreヘルパーの直後）
- Test: `scripts/test-quiz-cycle.js`（新規作成。Task 2・3でも追記していく）

**Interfaces:**
- Consumes: なし
- Produces:
  - `loadQuizCycle()` → `{ count: number, history: Array<{category, seriesIndex, label}> }`（サーバー内部関数。Task 2・3が使う）
  - `saveQuizCycle(cycle)` → ファイルへ書き込み（サーバー内部関数）
  - `quizCycleWeek(count)` → `number`（1〜4。サーバー内部関数）
  - `GET /api/quiz-cycle` → `{ week: number, history: Array<{category, seriesIndex, label}> }`

- [ ] **Step 1: テストスクリプトの雛形と最初のテストを書く**

`scripts/test-quiz-cycle.js`を新規作成:

```js
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
```

- [ ] **Step 2: 失敗することを確認**

Run: `node scripts/test-quiz-cycle.js`
Expected: FAIL（`/api/quiz-cycle`が存在せず404、`week`が`undefined`になりcheckが false）

- [ ] **Step 3: `server.js`に永続化ヘルパーとエンドポイントを実装**

`server.js`の26行目（`saveHighscore`関数の閉じカッコの直後、`const app = express();`の直前）に追記:

```js

const QUIZ_CYCLE_FILE = path.join(__dirname, "quiz-cycle.json");

function loadQuizCycle() {
  try {
    const c = JSON.parse(fs.readFileSync(QUIZ_CYCLE_FILE, "utf8"));
    return { count: c.count || 0, history: Array.isArray(c.history) ? c.history : [] };
  } catch {
    return { count: 0, history: [] };
  }
}

function saveQuizCycle(cycle) {
  try {
    fs.writeFileSync(QUIZ_CYCLE_FILE, JSON.stringify(cycle));
  } catch (e) {
    console.error("quiz-cycle save failed:", e.message);
  }
}

function quizCycleWeek(count) {
  return (count % 4) + 1;
}
```

`app.use(express.static(...))`の行（32行目付近）の直後に追記:

```js

app.get("/api/quiz-cycle", (req, res) => {
  const cycle = loadQuizCycle();
  res.json({ week: quizCycleWeek(cycle.count), history: cycle.history });
});
```

- [ ] **Step 4: テストを通す**

Run: `node scripts/test-quiz-cycle.js`
Expected: 全行`ok:`で`ALL PASS`、exit 0

- [ ] **Step 5: Commit**

```bash
git add server.js scripts/test-quiz-cycle.js
git commit -m "単語テスト週次サイクル: quiz-cycle.json永続化とAPIを追加"
```

---

### Task 2: `quiz:completeSession`（週を進める・履歴記録・total動的化）

**Files:**
- Modify: `server.js`（`quiz:startGame`ハンドラ・`quizMaybeFinish`関数・`quiz:*`イベント群の末尾）
- Modify: `scripts/test-quiz-cycle.js`（シナリオ追加）

**Interfaces:**
- Consumes: `loadQuizCycle()` / `saveQuizCycle()` / `quizCycleWeek()`（Task 1）
- Produces: `quiz:completeSession(cb)` → ホストが呼ぶと`cb({ week, history })`が返る。非ホスト・`phase !== "finished"`時は無視

- [ ] **Step 1: 失敗するテストシナリオを追記**

`scripts/test-quiz-cycle.js`の`main()`内、`const failed = ...`の直前に追記:

```js

  // --- シナリオ3: 通常週の完了で履歴に1件追加され、週が進む ---
  fs.rmSync(CYCLE_FILE, { force: true });
  server = await startServer();
  try {
    const host = connect();
    const guest = connect();
    await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト" }, res));
    const created = await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト2" }, res));
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

    const guestComplete = await new Promise((res) => guest.emit("quiz:completeSession", res));
    check(guestComplete === undefined, "参加者（非ホスト）がcompleteSessionを呼んでも無視される");

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
```

- [ ] **Step 2: 失敗することを確認**

Run: `node scripts/test-quiz-cycle.js`
Expected: FAIL（`quiz:completeSession`が未実装のためコールバックが呼ばれずタイムアウト、または`total`不一致でFAIL行が出る）

- [ ] **Step 3: `server.js`に実装を追加**

`quiz:startGame`ハンドラ（569〜588行目付近）を以下に置き換え（`room.questions = ...`の下に3行追加、`total: QUIZ_QUESTION_COUNT`を`total: room.questions.length`に変更）:

```js
  socket.on("quiz:startGame", ({ category, seriesIndex }) => {
    const roomCode = socket.data.quizRoomCode;
    const room = quizRooms[roomCode];
    if (!room || room.host !== socket.id || room.phase !== "lobby") return;
    const cat = WORDTESTS[category];
    const series = cat && cat.series[Number(seriesIndex)];
    if (!series) return;
    room.questions = shuffle(series.items).slice(0, QUIZ_QUESTION_COUNT);
    room.lastCategory = category;
    room.lastSeriesIndex = Number(seriesIndex);
    room.lastLabel = `${cat.label} ${series.name}`;
    room.phase = "playing";
    room.startedAt = Date.now();
    for (const p of Object.values(room.players)) {
      p.submittedAt = null;
      p.score = 0;
    }
    io.to(roomCode).emit("quiz:started", {
      setLabel: room.lastLabel,
      total: room.questions.length,
      questions: room.questions.map((q) => ({ sentence: q.sentence, hint: q.hint, ja: q.ja })),
    });
  });
```

`quizMaybeFinish`関数（527〜546行目付近）の`total: QUIZ_QUESTION_COUNT`を`total: room.questions.length`に変更:

```js
function quizMaybeFinish(roomCode) {
  const room = quizRooms[roomCode];
  if (!room || room.phase !== "playing") return;
  const players = Object.values(room.players);
  if (players.length === 0 || !players.every((p) => p.submittedAt !== null)) return;
  room.phase = "finished";
  const ranking = Object.entries(room.players)
    .map(([id, p]) => ({
      id,
      name: p.name,
      score: p.score,
      total: room.questions.length,
      timeMs: p.submittedAt - room.startedAt,
    }))
    .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs);
  io.to(roomCode).emit("quiz:results", {
    ranking,
    review: room.questions.map((q) => ({ sentence: q.sentence, answer: q.answer, ja: q.ja })),
  });
}
```

`quiz:playAgain`ハンドラ（610〜622行目付近）の直後、`socket.on("disconnect", ...)`の直前に追記:

```js

  socket.on("quiz:completeSession", (cb) => {
    const roomCode = socket.data.quizRoomCode;
    const room = quizRooms[roomCode];
    if (!room || room.host !== socket.id || room.phase !== "finished") return;
    const cycle = loadQuizCycle();
    const wasWeek4 = cycle.count % 4 === 3;
    if (wasWeek4) {
      cycle.history = [];
    } else if (room.lastCategory) {
      cycle.history.push({
        category: room.lastCategory,
        seriesIndex: room.lastSeriesIndex,
        label: room.lastLabel,
      });
    }
    cycle.count += 1;
    saveQuizCycle(cycle);
    if (typeof cb === "function") cb({ week: quizCycleWeek(cycle.count), history: cycle.history });
  });
```

- [ ] **Step 4: テストを通す**

Run: `node scripts/test-quiz-cycle.js`
Expected: 全行`ok:`で`ALL PASS`、exit 0

- [ ] **Step 5: 既存の単語テストフローが壊れていないことを確認**

Run: `node scripts/test-quiz-flow.js`
Expected: `ALL PASS`（`total`を動的化した変更で既存テストが壊れていないこと）

- [ ] **Step 6: Commit**

```bash
git add server.js scripts/test-quiz-cycle.js
git commit -m "単語テスト週次サイクル: quiz:completeSessionで週を進める処理を追加"
```

---

### Task 3: `quiz:startReview`（復習テストの問題プール生成・配信）

**Files:**
- Modify: `server.js`（`WORDTESTS`定数の直後に`REVIEW_QUESTION_COUNT`と`buildReviewPool`を追加、`quiz:startGame`の直後に`quiz:startReview`ハンドラを追加）
- Modify: `scripts/test-quiz-cycle.js`（シナリオ追加）

**Interfaces:**
- Consumes: `WORDTESTS`（`wordtests.js`）、`shuffle()`（既存）
- Produces: `quiz:startReview(cb)` → 成功時は全員に`quiz:started`（`setLabel`は`"復習テスト: <ラベル1> / <ラベル2> / ..."`、`questions`は複数シリーズから均等に抽出）。プールが作れない場合のみ`cb({ error })`

- [ ] **Step 1: 失敗するテストシナリオを追記**

`scripts/test-quiz-cycle.js`の`main()`内、`const failed = ...`の直前に追記:

```js

  // --- シナリオ5: 復習テストが3シリーズから均等に抽出される ---
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
    const cbResult = await new Promise((res) => host.emit("quiz:startReview", res));
    const started = await startedP;
    check(cbResult === undefined, "成功時はcompleteSessionのコールバックは呼ばれない（fire-and-forget）");
    check(started.questions.length === 20, `復習テストは20問 (実際: ${started.questions.length})`);
    check(started.total === 20, "totalも20と一致");
    check(started.setLabel.includes("Clacel") && started.setLabel.includes("IELTS") && started.setLabel.includes("TOEIC"),
      `setLabelに3シリーズ名が含まれる (実際: ${started.setLabel})`);
    const clacelS1 = require("../wordtests-clacel").series[0].items.map((it) => it.sentence);
    const ieltsS2 = require("../wordtests-ielts").series[1].items.map((it) => it.sentence);
    const toeicS3 = require("../wordtests-toeic").series[2].items.map((it) => it.sentence);
    const allowed = new Set([...clacelS1, ...ieltsS2, ...toeicS3]);
    check(started.questions.every((q) => allowed.has(q.sentence)), "出題は3シリーズの範囲内のみ");
    host.disconnect();
  } finally {
    server.kill();
    fs.rmSync(CYCLE_FILE, { force: true });
  }

  // --- シナリオ6: 履歴が空の場合はエラーを返す ---
  fs.rmSync(CYCLE_FILE, { force: true });
  server = await startServer();
  try {
    const host = connect();
    await new Promise((res) => host.emit("quiz:createRoom", { name: "ホスト" }, res));
    const err = await new Promise((res) => host.emit("quiz:startReview", res));
    check(!!(err && err.error), `historyが空ならエラーを返す (実際: ${JSON.stringify(err)})`);
    host.disconnect();
  } finally {
    server.kill();
    fs.rmSync(CYCLE_FILE, { force: true });
  }
```

- [ ] **Step 2: 失敗することを確認**

Run: `node scripts/test-quiz-cycle.js`
Expected: FAIL（`quiz:startReview`が未実装のため`quiz:started`が届かずタイムアウト）

- [ ] **Step 3: `server.js`に実装を追加**

`const QUIZ_QUESTION_COUNT = 5;`（500行目付近）の直後に追記:

```js
const REVIEW_QUESTION_COUNT = 20;

function buildReviewPool(history) {
  const seriesList = history
    .map(({ category, seriesIndex }) => {
      const cat = WORDTESTS[category];
      const series = cat && cat.series[Number(seriesIndex)];
      return series ? { label: `${cat.label} ${series.name}`, items: shuffle(series.items) } : null;
    })
    .filter(Boolean);
  if (seriesList.length === 0) return null;

  const pool = [];
  let cursor = 0;
  while (pool.length < REVIEW_QUESTION_COUNT) {
    const available = seriesList.some((s) => s.items.length > 0);
    if (!available) break;
    const s = seriesList[cursor % seriesList.length];
    cursor++;
    if (s.items.length > 0) pool.push(s.items.shift());
  }
  return { pool: shuffle(pool), labels: seriesList.map((s) => s.label) };
}
```

`quiz:startGame`ハンドラの直後（Task 2で編集した箇所のすぐ下）に追記:

```js

  socket.on("quiz:startReview", (cb) => {
    const roomCode = socket.data.quizRoomCode;
    const room = quizRooms[roomCode];
    if (!room || room.host !== socket.id || room.phase !== "lobby") return;
    const cycle = loadQuizCycle();
    const built = buildReviewPool(cycle.history);
    if (!built) return typeof cb === "function" && cb({ error: "復習用の問題が見つかりません" });
    room.questions = built.pool;
    room.lastCategory = null;
    room.lastSeriesIndex = null;
    room.lastLabel = `復習テスト: ${built.labels.join(" / ")}`;
    room.phase = "playing";
    room.startedAt = Date.now();
    for (const p of Object.values(room.players)) {
      p.submittedAt = null;
      p.score = 0;
    }
    io.to(roomCode).emit("quiz:started", {
      setLabel: room.lastLabel,
      total: room.questions.length,
      questions: room.questions.map((q) => ({ sentence: q.sentence, hint: q.hint, ja: q.ja })),
    });
  });
```

- [ ] **Step 4: テストを通す**

Run: `node scripts/test-quiz-cycle.js`
Expected: 全行`ok:`で`ALL PASS`、exit 0

- [ ] **Step 5: Commit**

```bash
git add server.js scripts/test-quiz-cycle.js
git commit -m "単語テスト週次サイクル: quiz:startReviewで復習テストを配信"
```

---

### Task 4: トップページのバナー表示

**Files:**
- Modify: `public/index.html`

**Interfaces:**
- Consumes: `GET /api/quiz-cycle`（Task 1）
- Produces: ページ読み込み時に表示されるバナー（他タスクへの影響なし）

- [ ] **Step 1: バナー要素とスタイルを追加**

`public/index.html`の`<div class="grid">`の直前（73行目付近）に追記:

```html
    <p class="cycle-banner" id="cycle-banner" style="display:none;"></p>
```

`</style>`の直前（67行目付近）にスタイルを追記:

```css
  .cycle-banner {
    text-align: center;
    background: var(--accent);
    border: 1px solid var(--border);
    border-radius: .5rem;
    padding: 8px 12px;
    font-size: .875rem;
    margin-bottom: 16px;
  }
```

`</body>`の直前にスクリプトを追記:

```html
<script>
  fetch("/api/quiz-cycle")
    .then((r) => r.json())
    .then(({ week }) => {
      const el = document.getElementById("cycle-banner");
      if (!el) return;
      el.textContent = week === 4
        ? "📅 第4週（復習週）：3週分の単語まとめテスト"
        : `📅 第${week}週：単語テスト＋任意で🪙🧩🔥のどれか1つ`;
      el.style.display = "block";
    })
    .catch(() => {});
</script>
```

- [ ] **Step 2: サーバーを起動してブラウザで確認**

Run: `PORT=3100 node server.js`（バックグラウンド起動。既に起動中なら不要）

ブラウザで`http://localhost:3100/`を開き、確認する項目:
1. グリッドの上に「📅 第◯週：単語テスト＋任意で🪙🧩🔥のどれか1つ」（または第4週なら復習週の文言）が表示される
2. `quiz-cycle.json`が存在しない状態（初回）では「第1週」と表示される

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "単語テスト週次サイクル: トップページに今週のバナーを表示"
```

---

### Task 5: 週4のロビー画面切り替え（`quiz.html`）

**Files:**
- Modify: `public/quiz.html`

**Interfaces:**
- Consumes: `GET /api/quiz-cycle`（Task 1）、`quiz:startReview`（Task 3）
- Produces: 週4のときホストに「復習テストを開始」ボタンのみを表示するロビーUI

- [ ] **Step 1: 復習用コントロールのHTMLを追加**

`public/quiz.html`の`<div id="host-controls" style="display:none;">`のブロック（ロビー画面内）の直後に追記:

```html
      <div id="review-controls" style="display:none;">
        <p style="text-align:center; margin-bottom:14px;">今週は復習週です。過去3週分の単語をまとめて出題します。</p>
        <button id="btn-start-review">復習テストを開始</button>
        <p class="error" id="review-error"></p>
      </div>
```

- [ ] **Step 2: スクリプトで週番号を取得し、ロビー表示を出し分ける**

`const socket = io();`の直後に追記:

```js
  let currentWeek = 1;
  fetch("/api/quiz-cycle").then((r) => r.json()).then(({ week }) => { currentWeek = week; }).catch(() => {});
```

`quiz:playersUpdate`のハンドラを以下に置き換え:

```js
  socket.on("quiz:playersUpdate", ({ hostId, hostName, players }) => {
    isHost = hostId === socket.id;
    const isReviewWeek = currentWeek === 4;
    $("host-controls").style.display = isHost && !isReviewWeek ? "" : "none";
    $("review-controls").style.display = isHost && isReviewWeek ? "" : "none";
    $("wait-host").style.display = isHost ? "none" : "";
    $("host-name").textContent = hostName;
    $("lobby-players").innerHTML = players.map((p) =>
      `<li><span>${p.name}${p.id === hostId ? " 👑" : ""}</span><span>${p.submitted ? "提出済み ✅" : ""}</span></li>`).join("");
    $("again-card").style.display = isHost ? "" : "none";
  });
```

`$("btn-start").addEventListener(...)`のブロックの直後に追記:

```js

  $("btn-start-review").addEventListener("click", () => {
    $("review-error").textContent = "";
    socket.emit("quiz:startReview", (res) => {
      if (res && res.error) $("review-error").textContent = res.error;
    });
  });
```

- [ ] **Step 3: ブラウザで確認**

Run: `node -e "const fs=require('fs'); fs.writeFileSync('quiz-cycle.json', JSON.stringify({count:3, history:[{category:'clacel',seriesIndex:0,label:'Clacel 2.0 Series 1'},{category:'ielts',seriesIndex:1,label:'IELTS Series 2'},{category:'toeic',seriesIndex:2,label:'TOEIC Series 3'}]}))"`（週4状態を強制的に作る）

サーバーを再起動後（`quiz-cycle.json`は起動時ではなく毎回読み直すので再起動不要）、ブラウザで確認する項目:
1. `http://localhost:3100/quiz.html?mode=create` でルーム作成→ロビーでカテゴリ/シリーズ選択が消え、「復習テストを開始」ボタンのみ表示される
2. ボタンを押すと20問の復習テストが始まる（`setLabel`に3シリーズ名が含まれる）
3. 確認後、`node -e "require('fs').rmSync('quiz-cycle.json',{force:true})"` で状態を戻す

- [ ] **Step 4: Commit**

```bash
git add public/quiz.html
git commit -m "単語テスト週次サイクル: 週4のロビー画面を復習テスト開始ボタンに切り替え"
```

---

### Task 6: 結果画面の「今週分を完了する」ボタン

**Files:**
- Modify: `public/quiz.html`

**Interfaces:**
- Consumes: `quiz:completeSession`（Task 2）
- Produces: 結果画面でホストにのみ表示される完了ボタン（押すと次週へ進む）

- [ ] **Step 1: HTMLにボタンを追加**

`public/quiz.html`の`<div class="card" id="again-card" style="display:none;">`ブロックを以下に置き換え:

```html
    <div class="card" id="again-card" style="display:none;">
      <button id="btn-again">もう一度（ロビーに戻る）</button>
      <button class="secondary" id="btn-complete-session">今週分を完了する（次の週へ）</button>
      <p class="error" id="complete-status"></p>
    </div>
```

- [ ] **Step 2: スクリプトにクリックハンドラを追加**

`$("btn-again").addEventListener("click", () => socket.emit("quiz:playAgain"));`の直後に追記:

```js

  $("btn-complete-session").addEventListener("click", () => {
    $("btn-complete-session").disabled = true;
    socket.emit("quiz:completeSession", (res) => {
      if (!res) { $("btn-complete-session").disabled = false; return; }
      currentWeek = res.week;
      $("complete-status").style.color = "var(--green)";
      $("complete-status").textContent = `完了しました。次は第${res.week}週です。`;
    });
  });
```

- [ ] **Step 3: ブラウザで確認**

Run: `node -e "require('fs').rmSync('quiz-cycle.json',{force:true})"`（クリーンな状態から開始）

ブラウザ2タブで確認する項目（既存の`docs/superpowers/plans/2026-07-19-word-quiz.md` Task 6と同じ2人プレイの流れを踏襲）:
1. ホスト・参加者でルームを作り、Clacel Series 1で開始→両者提出→結果画面
2. 参加者側には「今週分を完了する」ボタンが出ない（ホストのみ）
3. ホストが「今週分を完了する」を押すと「完了しました。次は第2週です。」と表示され、ボタンが無効化される
4. トップページを再読み込みすると「第2週」のバナーに変わっている

- [ ] **Step 4: Commit**

```bash
git add public/quiz.html
git commit -m "単語テスト週次サイクル: 結果画面に今週分を完了するボタンを追加"
```

---

### Task 7: 最終検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 自動テストを全部通す**

Run:
```bash
node scripts/validate-wordtests.js wordtests-clacel.js 20,20,20,20,20,20,20,12 && \
node scripts/validate-wordtests.js wordtests-ielts.js 20,20,20,20,20 && \
node scripts/validate-wordtests.js wordtests-toeic.js 20,20,20,20,20 && \
node scripts/test-quiz-flow.js && \
node scripts/test-quiz-cycle.js
```
Expected: 3つの`OK:`と2つの`ALL PASS`

- [ ] **Step 2: 1サイクル分（4週）を通しでブラウザ確認**

`quiz-cycle.json`を削除した状態から、ブラウザで週1→2→3→4→（次サイクル）週1まで実際に完了ボタンを押して進め、以下を確認する:
1. 週1〜3: 毎回カテゴリ/シリーズを選んで開始→結果画面で完了→トップページのバナーが次週表示に変わる
2. 週4: ロビーに「復習テストを開始」のみ表示→開始すると週1〜3で使った3シリーズ由来の20問が出題される→完了すると週1に戻り、バナーも「第1週」に戻る

- [ ] **Step 3: fable-checkスキルを実行**

完了報告の前に`fable-check`スキルのチェックリスト（リネーム漏れ・呼び出し元・エッジケース・ドキュメント矛盾・デバッグ残骸）を通す。
