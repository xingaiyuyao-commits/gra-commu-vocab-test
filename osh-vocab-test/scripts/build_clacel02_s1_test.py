# -*- coding: utf-8 -*-
"""動作確認用: CLACEL02 Series1をこの環境で実際にPDF生成してみる。"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts.qa import run_qa
from scripts.generator import build_series
from data.clacel_02 import SERIES

errors = run_qa(SERIES)
if errors:
    print("QA NG:")
    for e in errors:
        print(" -", e)
    sys.exit(1)

total = sum(len(d['words']) for d in SERIES.values())
print(f"QA OK: 全{total}語ユニーク")

SRC = "Clacel Vocabulary List ｜ OSH 単語テスト"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output", "pdf")
os.makedirs(OUT_DIR, exist_ok=True)

for n, d in SERIES.items():
    out = os.path.join(OUT_DIR, f"Clacel02_Series{n:02d}_test.pdf")
    build_series("Clacel 2.0 単語テスト", n, d['words'], d['fib'], d['sw_words'], d['sw_samples'],
                  out, answer_notes=d.get('answer_notes'), pos_label=d.get('pos_label'), source_note=SRC)
    print("generated:", out)
