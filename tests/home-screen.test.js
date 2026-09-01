const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const publicDir = path.join(__dirname, "..", "public");
const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");

test("承認済みホームの見出し・参加導線・学習日・画像を表示する", () => {
  assert.match(html, /<h1>ÖSH Vocabulary<br\s*\/?>(?:\s*)Challenge<\/h1>/);
  assert.match(html, /<a class="join-cta" href="\/quiz\.html\?mode=join">[\s\S]*ルームコードを入力して参加する[\s\S]*→[\s\S]*<\/a>/);
  assert.match(html, /id="today-date"/);
  assert.match(html, /id="today-day"/);
  assert.match(html, /<img[^>]+src="\/assets\/osh-vocab-home-illustration\.png"/);
  assert.ok(fs.existsSync(path.join(publicDir, "assets", "osh-vocab-home-illustration.png")));
});

test("3コースのルーム作成導線を保つ", () => {
  assert.match(html, /class="course-link" href="\/quiz\.html\?mode=create"[\s\S]*01[\s\S]*Clacel/);
  assert.match(html, /class="course-link" href="\/quiz\.html\?mode=create"[\s\S]*02[\s\S]*TOEIC/);
  assert.match(html, /class="course-link" href="\/quiz\.html\?mode=create"[\s\S]*03[\s\S]*IELTS/);
});
