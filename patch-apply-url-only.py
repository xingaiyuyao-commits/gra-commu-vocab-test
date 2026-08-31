#!/usr/bin/env python3
"""
Simple patch applier for quiz.html: applies the three textual replacements made here.
Usage: python3 patch-apply-url-only.py /absolute/path/to/public/quiz.html
This script creates a backup file quiz.html.bak before modifying.
"""
import sys
from pathlib import Path

if len(sys.argv) != 2:
    print("Usage: python3 patch-apply-url-only.py /path/to/public/quiz.html")
    sys.exit(2)

p = Path(sys.argv[1])
if not p.exists():
    print("File not found:", p)
    sys.exit(1)

orig = p.read_text(encoding='utf-8')
backup = p.with_suffix(p.suffix + '.bak')
backup.write_text(orig, encoding='utf-8')
print('Backup written to', backup)

replacements = [
    (
        '      <div id="join-section">\n        <label for="room" style="margin-top:20px">ルームコード</label>\n        <input id="room" maxlength="6" placeholder="例: AB3K9P" style="text-transform: uppercase;" aria-describedby="entry-error" />\n        <button id="btn-join" class="secondary">参加する</button>\n      </div>',
        '      <div id="join-section" hidden>\n        <input id="room" maxlength="6" placeholder="例: AB3K9P" style="text-transform: uppercase; display:none;" aria-describedby="entry-error" disabled />\n        <button id="btn-join" class="secondary">URLから参加</button>\n      </div>'
    ),
    (
        '    if (qrId && $(qrId)) $(qrId).innerHTML = `<img src="/quiz/qr.svg?text=${encodeURIComponent(url)}" alt="参加用リンクのQRコード" />`;',
        '    if (qrId && $(qrId)) $(qrId).hidden = true;'
    ),
    (
        '$("btn-join").addEventListener("click", () => {\n    const name = $("name").value.trim();\n    if (!name) return ($("entry-error").textContent = "名前を入力してください");\n    $("entry-error").textContent = "";\n    socket.emit("quiz:joinRoom", { roomCode: $("room").value, name }, onEntered);\n  });',
        '$("btn-join").addEventListener("click", () => {\n    const name = $("name").value.trim();\n    if (!name) return ($("entry-error").textContent = "名前を入力してください");\n    $("entry-error").textContent = "";\n    const roomCode = (typeof presetRoom !== "undefined" && presetRoom) ? presetRoom.toUpperCase().slice(0,6) : ($("room") ? $("room").value : "");\n    socket.emit("quiz:joinRoom", { roomCode, name }, onEntered);\n  });'
    )
]

new = orig
for old, new_s in replacements:
    if old in new:
        new = new.replace(old, new_s)
        print('Applied replacement')
    else:
        print('Original block not found; skipping a replacement (it may already be applied).')

p.write_text(new, encoding='utf-8')
print('Patch applied to', p)
print('If you use git, review the changes and commit on a branch, then create a PR as needed.')
