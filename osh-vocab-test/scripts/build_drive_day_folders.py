# -*- coding: utf-8 -*-
"""TOEIC Week1（Day1〜7）をDriveにそのままアップロードできるフォルダ構成に整える。
Day{N}/
  単語（英語のみ）/        既存の単語のみ音声（男女）をコピー
  日本語→英語（20語連続）/  jp2enの20語を1本に連結（男女）
  例文（20文）/            例文音声の20文を1本に連結（男女）
使い方: python3 scripts/build_drive_day_folders.py
"""
import os
import shutil
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts import audio_gen as ag
from data.toeic import SERIES as S1
from data.toeic_s6 import SERIES as S6
from data.toeic_s7 import SERIES as S7

merged = {}
merged.update(S1)
merged.update(S6)
merged.update(S7)

SRC_ROOT = os.path.join(ag.AUDIO_DIR, "toeic")
OUT_ROOT = os.path.join(os.path.dirname(__file__), "..", "output", "audio_by_day", "toeic")

VOICES = [("m", "Evan (Enhanced)"), ("f", "Samantha (Enhanced)")]
GAP_MS = 900

os.makedirs(OUT_ROOT, exist_ok=True)

for n in range(1, 8):
    words = [w[0] for w in merged[n]["words"]]
    series_dir = os.path.join(SRC_ROOT, f"Series{n:02d}")
    day_dir = os.path.join(OUT_ROOT, f"Day{n}")
    word_dir = os.path.join(day_dir, "単語（英語のみ）")
    jp2en_dir = os.path.join(day_dir, "日本語→英語（20語連続）")
    sentence_dir = os.path.join(day_dir, "例文（20文）")
    for d in (word_dir, jp2en_dir, sentence_dir):
        os.makedirs(d, exist_ok=True)

    print(f"=== Day{n} ===")

    # 1) 単語（英語のみ）: 既存の単語のみ音声をコピー
    for w in words:
        fname = ag._safe_filename(w)
        for suf in ("m", "f"):
            src = os.path.join(series_dir, f"{fname}_{suf}.m4a")
            dst = os.path.join(word_dir, f"{fname}_{suf}.m4a")
            if os.path.exists(src):
                shutil.copyfile(src, dst)
            else:
                print(f"  missing word audio: {src}")

    # 2) 日本語→英語（20語連続）
    for suf, _ in VOICES:
        parts = [os.path.join(series_dir, f"{ag._safe_filename(w)}_jp2en_{suf}.m4a") for w in words]
        missing = [p for p in parts if not os.path.exists(p)]
        if missing:
            print(f"  jp2en missing({suf}): {missing}")
            continue
        out_path = os.path.join(jp2en_dir, f"Day{n}_jp2en_{suf}.m4a")
        ok = ag._concat_with_silence(parts, out_path, silence_ms=GAP_MS)
        print(f"  jp2en連続再生({suf}): {'OK' if ok else 'FAILED'}")

    # 3) 例文（20文）
    for suf, _ in VOICES:
        parts = [os.path.join(series_dir, f"{ag._safe_filename(w)}_sentence_{suf}.m4a") for w in words]
        missing = [p for p in parts if not os.path.exists(p)]
        if missing:
            print(f"  sentence missing({suf}): {missing}")
            continue
        out_path = os.path.join(sentence_dir, f"Day{n}_sentences_{suf}.m4a")
        ok = ag._concat_with_silence(parts, out_path, silence_ms=GAP_MS)
        print(f"  例文連続再生({suf}): {'OK' if ok else 'FAILED'}")

print("ALL DONE")
