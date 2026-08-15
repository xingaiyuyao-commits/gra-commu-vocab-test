const test = require("node:test");
const assert = require("node:assert/strict");
const { loadQuizPage } = require("./helpers/loadQuizPage");

function setValue(window, el, value) {
  el.value = value;
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
}

test("参加・作成画面: ラベル文言が仕様通り", () => {
  const { document } = loadQuizPage();
  assert.equal(document.querySelector('label[for="name"]').textContent, "名前");
  assert.equal(document.getElementById("category-label").textContent, "単語帳を選択");
  assert.equal(document.querySelector('label[for="room"]').textContent, "ルームコード");
});

test("参加・作成画面: 単語帳ボタンにaria-pressedがあり、選択に応じて切り替わる", () => {
  const { window, document } = loadQuizPage();
  const buttons = Array.from(document.querySelectorAll(".cat-btn"));
  buttons.forEach((b) => assert.equal(b.getAttribute("aria-pressed"), "false"));

  buttons[0].dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
  assert.equal(buttons[1].getAttribute("aria-pressed"), "false");

  buttons[1].dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.equal(buttons[0].getAttribute("aria-pressed"), "false");
  assert.equal(buttons[1].getAttribute("aria-pressed"), "true");
});

test("参加・作成画面: エラーにrole=alert、入力欄がエラーと関連付けられている", () => {
  const { document } = loadQuizPage();
  const error = document.getElementById("entry-error");
  assert.equal(error.getAttribute("role"), "alert");
  assert.equal(document.getElementById("name").getAttribute("aria-describedby"), "entry-error");
  assert.equal(document.getElementById("room").getAttribute("aria-describedby"), "entry-error");
});

test("参加・作成画面: 名前と単語帳の両方が揃うまで作成ボタンは無効", () => {
  const { window, document } = loadQuizPage();
  const nameInput = document.getElementById("name");
  const catButtons = document.querySelectorAll(".cat-btn");
  const createBtn = document.getElementById("btn-create");

  assert.equal(createBtn.disabled, true);

  setValue(window, nameInput, "Tina");
  assert.equal(createBtn.disabled, true, "単語帳未選択ならまだ無効のまま");

  catButtons[0].dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.equal(createBtn.disabled, false, "名前と単語帳が揃ったら有効になる");

  setValue(window, nameInput, "");
  assert.equal(createBtn.disabled, true, "名前を消したら再び無効になる");
});

test("提出確認: 最終問題で「回答を確認」を押すと確認画面を表示する（即提出しない）", () => {
  const { window, document, fireSocketEvent, emitted } = loadQuizPage();

  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "私はお茶を飲む。" },
    { sentence: "She ___ books.", answer: "reads", base: "read", hint: "r____", ja: "読む", sentenceJa: "彼女は本を読む。" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1",
    total: questions.length,
    endsAt: Date.now() + 5 * 60 * 1000,
    questions,
  });

  document.getElementById("answer").value = "drink";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.equal(document.getElementById("btn-next").textContent, "回答を確認");

  document.getElementById("answer").value = "reads";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(
    emitted.some((e) => e.event === "quiz:submit"),
    false,
    "確認前にはquiz:submitが送信されない"
  );
  assert.ok(document.getElementById("screen-confirm").classList.contains("active"));
  assert.match(document.getElementById("confirm-summary").textContent, /回答済み2問／未回答0問/);
});

test("提出確認: 未回答がある場合は回答済み数・未回答数・未回答の問題番号を表示する", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();

  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "私はお茶を飲む。" },
    { sentence: "She ___ books.", answer: "reads", base: "read", hint: "r____", ja: "読む", sentenceJa: "彼女は本を読む。" },
    { sentence: "They ___ fast.", answer: "run", base: "run", hint: "r__", ja: "走る", sentenceJa: "彼らは速く走る。" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1",
    total: questions.length,
    endsAt: Date.now() + 5 * 60 * 1000,
    questions,
  });

  // 1問目だけ回答し、2・3問目は無回答のまま最後まで進める
  document.getElementById("answer").value = "drink";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  document.getElementById("answer").value = "";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  document.getElementById("answer").value = "";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.match(document.getElementById("confirm-summary").textContent, /回答済み1問／未回答2問/);
  assert.match(document.getElementById("confirm-unanswered").textContent, /2/);
  assert.match(document.getElementById("confirm-unanswered").textContent, /3/);
});

test("提出確認: 「回答に戻る」で提出せずテスト画面に戻れる", () => {
  const { window, document, fireSocketEvent, emitted } = loadQuizPage();
  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.ok(document.getElementById("screen-confirm").classList.contains("active"));

  document.getElementById("btn-confirm-back").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.ok(document.getElementById("screen-quiz").classList.contains("active"));
  assert.equal(emitted.some((e) => e.event === "quiz:submit"), false);
});

test("提出確認: 「この内容で提出」を押すとquiz:submitが送信される", () => {
  const { window, document, fireSocketEvent, emitted } = loadQuizPage();
  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });
  document.getElementById("answer").value = "drink";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  document.getElementById("btn-confirm-submit").dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.ok(emitted.some((e) => e.event === "quiz:submit"));
  assert.ok(document.getElementById("screen-waiting").classList.contains("active"));
});

test("提出確認: 制限時間終了時は確認を挟まず自動提出される", () => {
  const { document, fireSocketEvent, emitted } = loadQuizPage();
  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  // 既に終了時刻を過ぎた状態でスタートさせ、開始直後の自動チェックで即提出されることを確認する
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() - 1000, questions,
  });

  assert.ok(emitted.some((e) => e.event === "quiz:submit"));
  assert.equal(document.getElementById("screen-confirm").classList.contains("active"), false);
  assert.ok(document.getElementById("screen-waiting").classList.contains("active"));
});

test("テスト画面: 設問の英文の下に例文の日本語訳が表示される", () => {
  const { document, fireSocketEvent } = loadQuizPage();
  const questions = [
    { sentence: "She can't ___ the summer heat.", answer: "stand", base: "stand", hint: "s____", ja: "立つ、耐える", sentenceJa: "彼女は夏の暑さに耐えられない。" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });
  assert.equal(document.getElementById("q-sentence-ja").textContent, "彼女は夏の暑さに耐えられない。");
});

test("テスト画面: 例文の日本語訳がない設問では空欄になる", () => {
  const { document, fireSocketEvent } = loadQuizPage();
  const questions = [
    { sentence: "She can't ___ the summer heat.", answer: "stand", base: "stand", hint: "s____", ja: "立つ、耐える" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });
  assert.equal(document.getElementById("q-sentence-ja").textContent, "");
});

test("待機画面: ルーム作成者には結果発表ボタンが表示されるが、全員提出が揃うまでは押せない", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  // playerIdはloadQuizPage内でランダム生成されるため、hostIdを実際のplayerIdに合わせて送る
  const actualPlayerId = window.localStorage.getItem("quizPlayerId");
  fireSocketEvent("quiz:playersUpdate", {
    hostId: actualPlayerId,
    hostName: "Tina",
    players: [{ id: actualPlayerId, name: "Tina", submitted: false }],
  });
  assert.notEqual(document.getElementById("btn-reveal-results").style.display, "none");
  assert.equal(document.getElementById("btn-reveal-results").disabled, true);
});

test("待機画面: ホスト以外には結果発表ボタンが表示されない", () => {
  const { document, fireSocketEvent } = loadQuizPage();
  fireSocketEvent("quiz:playersUpdate", {
    hostId: "someone-else",
    hostName: "Aica",
    players: [{ id: "someone-else", name: "Aica", submitted: false }],
  });
  assert.equal(document.getElementById("btn-reveal-results").style.display, "none");
});

test("待機画面: 全員提出が揃うとquiz:readyToRevealでボタンが押せるようになる", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  const actualPlayerId = window.localStorage.getItem("quizPlayerId");
  fireSocketEvent("quiz:playersUpdate", {
    hostId: actualPlayerId,
    hostName: "Tina",
    players: [{ id: actualPlayerId, name: "Tina", submitted: true }],
  });
  assert.equal(document.getElementById("btn-reveal-results").disabled, true);

  fireSocketEvent("quiz:readyToReveal");
  assert.equal(document.getElementById("btn-reveal-results").disabled, false);
});

test("待機画面: 結果発表ボタンを押すとquiz:revealResultsが送信される（制限時間終了だけでは自動発表しない）", () => {
  const { window, document, fireSocketEvent, emitted } = loadQuizPage();
  const actualPlayerId = window.localStorage.getItem("quizPlayerId");
  fireSocketEvent("quiz:playersUpdate", {
    hostId: actualPlayerId,
    hostName: "Tina",
    players: [{ id: actualPlayerId, name: "Tina", submitted: true }],
  });
  fireSocketEvent("quiz:readyToReveal");

  assert.equal(
    emitted.some((e) => e.event === "quiz:revealResults"),
    false,
    "readyToRevealが届いただけでは自動送信されない"
  );

  window.confirm = () => true;
  document.getElementById("btn-reveal-results").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.ok(emitted.some((e) => e.event === "quiz:revealResults"));
});

test("結果画面: 最上部に本人の点数と正答率が表示される", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
    { sentence: "She ___ books.", answer: "reads", base: "read", hint: "r____", ja: "読む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 2, endsAt: Date.now() + 60000, questions,
  });

  document.getElementById("answer").value = "drink";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  document.getElementById("answer").value = "wrong-answer";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));

  fireSocketEvent("quiz:results", {
    perfect: [],
    review: [
      { sentence: "I ___ tea.", answer: "drink", ja: "飲む", sentenceJa: "" },
      { sentence: "She ___ books.", answer: "reads", ja: "読む", sentenceJa: "" },
    ],
  });

  assert.match(document.getElementById("personal-score").textContent, /1\s*\/\s*2/);
  assert.match(document.getElementById("personal-accuracy").textContent, /50/);
});
