# -*- coding: utf-8 -*-
"""シリーズデータをQA→PDF生成する共通ランナー。"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts.qa import run_qa
from scripts.generator import build_series

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output", "pdf")


def build_from_series_map(series_map, test_name, source_note, filename_prefix,
                           expect_pos=None, expected_word_count=20):
    errors = run_qa(series_map, expect_pos=expect_pos, expected_word_count=expected_word_count)
    if errors:
        print("QA NG:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    total = sum(len(d['words']) for d in series_map.values())
    print(f"QA OK: 全{total}語ユニーク")

    os.makedirs(OUT_DIR, exist_ok=True)
    for n, d in series_map.items():
        out = os.path.join(OUT_DIR, f"{filename_prefix}{n:02d}.pdf" if isinstance(n, int) else f"{filename_prefix}{n}.pdf")
        build_series(test_name, n, d['words'], out, pos_label=d.get('pos_label'), source_note=source_note)
        print("generated:", out)
