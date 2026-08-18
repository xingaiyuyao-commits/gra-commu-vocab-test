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
  assert.equal(document.querySelector('label[for="room"]').textContent, "ルームコード");
});

test("参加・作成画面: Clacel/TOEIC/IELTSそれぞれの作成ボタンが縦並びで表示される", () => {
  const { document } = loadQuizPage();
  ["clacel", "toeic", "ielts"].forEach((category) => {
    assert.ok(document.getElementById(`mh-${category}-create`), `${category}の作成ボタンがある`);
    assert.equal(document.getElementById(`mh-${category}-lobby`).hidden, true, `${category}は最初ロビー非表示`);
  });
});

test("参加・作成画面: エラーにrole=alert、入力欄がエラーと関連付けられている", () => {
  const { document } = loadQuizPage();
  const error = document.getElementById("entry-error");
  assert.equal(error.getAttribute("role"), "alert");
  assert.equal(document.getElementById("name").getAttribute("aria-describedby"), "entry-error");
  assert.equal(document.getElementById("room").getAttribute("aria-describedby"), "entry-error");
});

test("参加・作成画面: 名前を入力せずに作成ボタンを押すとエラーが出て、ルーム作成は行われない", () => {
  const { window, document, fakeSockets } = loadQuizPage();
  document.getElementById("mh-clacel-create").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.equal(document.getElementById("entry-error").textContent, "名前を入力してください");
  assert.equal(fakeSockets.length, 1, "名前が空ならmh用の新しいソケット接続は作られない");
});

test("参加・作成画面: 名前を入力してから作成ボタンを押すとそのコースのルームが作成される", () => {
  const { window, document, fakeSockets } = loadQuizPage();
  setValue(window, document.getElementById("name"), "ホスト太郎");
  document.getElementById("mh-clacel-create").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.equal(fakeSockets.length, 2, "Clacel用の新しいソケット接続が1つ作られる");

  const mhSocket = fakeSockets[1];
  const createCall = mhSocket.emitted.find((e) => e.event === "quiz:createRoom");
  assert.ok(createCall, "quiz:createRoomが送信される");
  assert.equal(createCall.payload.category, "clacel");
  assert.equal(createCall.payload.name, "ホスト太郎");

  createCall.cb({ roomCode: "ABCD", isHost: true, category: "clacel", seriesNames: ["Day 1", "Day 2"] });
  assert.equal(document.getElementById("mh-clacel-code").textContent, "ABCD");
  assert.equal(document.getElementById("mh-clacel-lobby").hidden, false);
});

test("参加・作成画面: ホストの複数コース作成パネルは開始〜結果発表〜もう一度まで1画面で完結する", () => {
  const { window, document, fakeSockets } = loadQuizPage();
  setValue(window, document.getElementById("name"), "ホスト");

  document.getElementById("mh-toeic-create").dispatchEvent(new window.Event("click", { bubbles: true }));
  const s = fakeSockets[1];
  const createCall = s.emitted.find((e) => e.event === "quiz:createRoom");
  createCall.cb({ roomCode: "WXYZ", isHost: true, category: "toeic", seriesNames: ["Day 1", "Day 2"] });

  assert.equal(document.getElementById("mh-toeic-lobby").hidden, false);
  assert.equal(document.getElementById("mh-toeic-create").hidden, true);
  assert.match(document.getElementById("mh-toeic-players").innerHTML, /ホスト/);

  // 参加者が入る
  s.fire("quiz:playersUpdate", { hostId: "h", players: [{ name: "ホスト", submitted: false }, { name: "Aさん", submitted: false }] });
  assert.match(document.getElementById("mh-toeic-players").innerHTML, /Aさん/);

  // テスト開始
  document.getElementById("mh-toeic-start").dispatchEvent(new window.Event("click", { bubbles: true }));
  const startCall = s.emitted.find((e) => e.event === "quiz:startGame");
  assert.ok(startCall, "quiz:startGameが送信される");

  s.fire("quiz:started", { setLabel: "TOEIC Day 1", total: 20, endsAt: Date.now() + 300000 });
  assert.equal(document.getElementById("mh-toeic-waiting").hidden, false);
  assert.match(document.getElementById("mh-toeic-timer").textContent, /残り時間/);
  assert.equal(document.getElementById("mh-toeic-reveal").disabled, true);

  // 提出状況
  s.fire("quiz:submitProgress", { submitted: 1, total: 2 });
  assert.match(document.getElementById("mh-toeic-progress").textContent, /1 \/ 2/);

  // 全員提出→結果発表ボタンが押せる
  s.fire("quiz:readyToReveal");
  assert.equal(document.getElementById("mh-toeic-reveal").disabled, false);

  window.confirm = () => true;
  document.getElementById("mh-toeic-reveal").dispatchEvent(new window.Event("click", { bubbles: true }));
  const revealCall = s.emitted.find((e) => e.event === "quiz:revealResults");
  assert.ok(revealCall, "quiz:revealResultsが送信される");

  s.fire("quiz:results", { setLabel: "TOEIC Day 1", perfect: [{ name: "Aさん" }], others: [] });
  assert.equal(document.getElementById("mh-toeic-results").hidden, false);
  assert.match(document.getElementById("mh-toeic-perfect").innerHTML, /Aさん/);

  // もう一度
  document.getElementById("mh-toeic-again").dispatchEvent(new window.Event("click", { bubbles: true }));
  assert.ok(s.emitted.some((e) => e.event === "quiz:playAgain"));
  s.fire("quiz:backToLobby");
  assert.equal(document.getElementById("mh-toeic-lobby").hidden, false);
  assert.equal(document.getElementById("mh-toeic-results").hidden, true);
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
  const actualPlayerId = window.sessionStorage.getItem("quizPlayerId");
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
  const actualPlayerId = window.sessionStorage.getItem("quizPlayerId");
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
  const actualPlayerId = window.sessionStorage.getItem("quizPlayerId");
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

test("開始: ホストは回答画面を経由せず、開始と同時に提出待ち画面（結果発表ボタンつき）が表示される", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  const actualPlayerId = window.sessionStorage.getItem("quizPlayerId");
  fireSocketEvent("quiz:playersUpdate", {
    hostId: actualPlayerId,
    hostName: "Tina",
    players: [{ id: actualPlayerId, name: "Tina", submitted: false }],
  });

  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });

  assert.equal(document.getElementById("screen-waiting").classList.contains("active"), true);
  assert.equal(document.getElementById("screen-quiz").classList.contains("active"), false);
  assert.equal(document.getElementById("btn-reveal-results").disabled, true);
  // ホストは回答・提出をしない進行役のため「提出しました」という自分ごとの文言にしない
  assert.notEqual(document.getElementById("waiting-status").textContent, "提出しました 🎉");
  assert.notEqual(document.getElementById("waiting-sub-label").textContent, "提出済み");
  assert.match(document.getElementById("waiting-set").textContent, /Day 1/);
});

test("待機画面: 結果発表ボタンがある画面にどのコース・Dayかが大きく表示される", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Clacel Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });
  document.getElementById("answer").value = "drink";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));
  document.getElementById("btn-confirm-submit").dispatchEvent(new window.Event("click", { bubbles: true }));

  assert.equal(document.getElementById("screen-waiting").classList.contains("active"), true);
  assert.match(document.getElementById("waiting-set").textContent, /Clacel Day 1/);
  assert.match(document.getElementById("waiting-timer").textContent, /残り時間/);
});

test("開始: 参加者（非ホスト）は従来通り回答画面が表示される", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  fireSocketEvent("quiz:playersUpdate", {
    hostId: "someone-else",
    hostName: "Aica",
    players: [{ id: "someone-else", name: "Aica", submitted: false }],
  });

  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });

  assert.equal(document.getElementById("screen-quiz").classList.contains("active"), true);
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

test("結果画面: どのコース・Dayだったかが表示される", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Clacel Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });
  document.getElementById("answer").value = "drink";
  document.getElementById("btn-next").dispatchEvent(new window.Event("click", { bubbles: true }));

  fireSocketEvent("quiz:results", {
    setLabel: "Clacel Day 1",
    perfect: [],
    review: [{ sentence: "I ___ tea.", answer: "drink", ja: "飲む", sentenceJa: "" }],
  });

  assert.match(document.getElementById("results-set").textContent, /Clacel Day 1/);
});

test("結果画面: ホストは進行役なので自分の点数・正答率・コメント・答え合わせは表示せず、満点者だけ表示される", () => {
  const { window, document, fireSocketEvent } = loadQuizPage();
  const actualPlayerId = window.sessionStorage.getItem("quizPlayerId");
  fireSocketEvent("quiz:playersUpdate", {
    hostId: actualPlayerId,
    hostName: "Tina",
    players: [{ id: actualPlayerId, name: "Tina", submitted: false }],
  });

  const questions = [
    { sentence: "I ___ tea.", answer: "drink", base: "drink", hint: "d____", ja: "飲む", sentenceJa: "" },
  ];
  fireSocketEvent("quiz:started", {
    setLabel: "Day 1", total: 1, endsAt: Date.now() + 60000, questions,
  });

  fireSocketEvent("quiz:results", {
    perfect: [{ id: "someone-else", name: "Aica", timeMs: 1000 }],
    review: [
      { sentence: "I ___ tea.", answer: "drink", ja: "飲む", sentenceJa: "" },
    ],
  });

  assert.equal(document.getElementById("personal-score-card").style.display, "none");
  assert.equal(document.getElementById("encourage-card").style.display, "none");
  assert.equal(document.getElementById("review-card").style.display, "none");
  assert.notEqual(document.getElementById("perfect-list").style.display, "none");
  assert.match(document.getElementById("perfect-list").innerHTML, /Aica/);
});
