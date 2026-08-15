const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// quiz.html を jsdom 上で実際に実行し、socket.io をスタブに差し替えてテストできるようにするヘルパー。
// 本番の <script src="..."> はネットワーク越しに取得できないため、内容をインライン展開してから読み込む。
function loadQuizPage({ url = "http://localhost/quiz.html" } = {}) {
  const publicDir = path.join(__dirname, "..", "..", "public");
  let html = fs.readFileSync(path.join(publicDir, "quiz.html"), "utf8");

  // socket.io クライアントはテストでは不要（window.io をスタブで差し替えるため）なので取り除く
  html = html.replace(/<script src="\/socket\.io\/socket\.io\.js"><\/script>\s*/, "");

  // /ui-logic.js への外部参照は実ファイルの内容をインラインにして読み込む
  const uiLogicSrc = fs.readFileSync(path.join(publicDir, "ui-logic.js"), "utf8");
  html = html.replace(
    '<script src="/ui-logic.js"></script>',
    `<script>${uiLogicSrc}</script>`
  );

  const emitted = [];
  const socketHandlers = {};
  const fakeSocket = {
    on(event, handler) {
      (socketHandlers[event] ||= []).push(handler);
      return fakeSocket;
    },
    emit(event, payload, cb) {
      emitted.push({ event, payload, cb });
      return fakeSocket;
    },
  };

  const dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.io = () => fakeSocket;
      // quiz.htmlはタイマー表示のため実際のsetIntervalを使うが、
      // テストではプロセスが終了しなくなるため無効化する（タイマー発火自体はテスト対象外）
      window.setInterval = () => 0;
      window.clearInterval = () => {};
    },
  });

  function fireSocketEvent(event, payload) {
    (socketHandlers[event] || []).forEach((handler) => handler(payload));
  }

  return {
    dom,
    window: dom.window,
    document: dom.window.document,
    emitted,
    socketHandlers,
    fakeSocket,
    fireSocketEvent,
  };
}

module.exports = { loadQuizPage };
