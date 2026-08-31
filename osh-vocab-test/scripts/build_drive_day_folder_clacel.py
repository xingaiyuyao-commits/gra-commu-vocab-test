# -*- coding: utf-8 -*-
"""Clacel Day1（clacel_02 Series1）をDriveにそのままアップロードできるフォルダ構成に整える。
Day1/
  単語（英語のみ）/        単語音声（男性のみ）をコピー
  日本語→英語（20語連続）/  jp2enの20語を1本に連結
  例文（20文）/            例文音声（男性のみ）の20文を1本に連結
使い方: python3 scripts/build_drive_day_folder_clacel.py
"""
import os
import shutil
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts import audio_gen as ag
from data.clacel_02 import SERIES as S1

TEST_NAME = "clacel_02"
n = 1
words = [w[0] for w in S1[n]["words"]]

SRC_DIR = os.path.join(ag.AUDIO_DIR, TEST_NAME, "Day1")
OUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "output", "audio_by_day", TEST_NAME)

GAP_MS = 900

os.makedirs(OUT_ROOT, exist_ok=True)

day_dir = os.path.join(OUT_ROOT, "Day1")
word_dir = os.path.join(day_dir, "単語（英語のみ）")
jp2en_dir = os.path.join(day_dir, "日本語→英語（20語連続）")
sentence_dir = os.path.join(day_dir, "例文（20文）")
for d in (word_dir, jp2en_dir, sentence_dir):
    os.makedirs(d, exist_ok=True)

print("=== Day1 ===")

# 1) 単語（英語のみ）: 単語音声（男性のみ）をコピー
for w in words:
    fname = ag._safe_filename(w)
    src = os.path.join(SRC_DIR, f"{fname}_m.m4a")
    dst = os.path.join(word_dir, f"{fname}_m.m4a")
    if os.path.exists(src):
        shutil.copyfile(src, dst)
    else:
        print(f"  missing word audio: {src}")

# 2) 日本語→英語（20語連続）
parts = [os.path.join(SRC_DIR, f"{ag._safe_filename(w)}_jp2en.m4a") for w in words]
missing = [p for p in parts if not os.path.exists(p)]
if missing:
    print(f"  jp2en missing: {missing}")
else:
    out_path = os.path.join(jp2en_dir, "Day1_jp2en.m4a")
    ok = ag._concat_with_silence(parts, out_path, silence_ms=GAP_MS)
    print(f"  jp2en連続再生: {'OK' if ok else 'FAILED'}")

# 3) 例文（20文）
parts = [os.path.join(SRC_DIR, f"{ag._safe_filename(w)}_sentence_m.m4a") for w in words]
missing = [p for p in parts if not os.path.exists(p)]
if missing:
    print(f"  sentence missing: {missing}")
else:
    out_path = os.path.join(sentence_dir, "Day1_sentences_m.m4a")
    ok = ag._concat_with_silence(parts, out_path, silence_ms=GAP_MS)
    print(f"  例文連続再生: {'OK' if ok else 'FAILED'}")

print("ALL DONE")
