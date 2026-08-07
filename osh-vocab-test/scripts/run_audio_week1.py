# -*- coding: utf-8 -*-
"""TOEIC Week1（Series1〜7、140語）向けに、日→英プロンプト・例文・連続再生の3種の音声を追加生成する。
単語のみの音声（既存分）はそのままskip_existingで維持し、リスト内容自体は変更しない。
使い方: python3 scripts/run_audio_week1.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts import audio_gen as ag
from data.toeic import SERIES as S1
from data.toeic_s6 import SERIES as S6
from data.toeic_s7 import SERIES as S7

merged = {}
merged.update(S1)
merged.update(S6)
merged.update(S7)

TEST_NAME = "toeic"
SERIES_NUMBERS = list(range(1, 8))

print("=== jp2en音声 ===")
c, f = ag.generate_jp2en_audio(merged, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

print("=== 例文音声 ===")
c, f = ag.generate_sentence_audio(merged, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

print("=== 連続再生音声 ===")
c, f = ag.generate_continuous_audio(merged, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

print("ALL DONE")
