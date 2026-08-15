# -*- coding: utf-8 -*-
"""IELTS Day1（ielts Series1、20語）向けに、単語・日本語→英語・例文・連続再生の4種の音声を新規生成する。
音声仕様: 英語（単語・例文・連続再生）は男性のみ、日本語→英語は日本語(女性)+英語(男性)の1本のみ。
生成後、フォルダ名をSeries01からDay1にリネームする（サイトの"Day"表記に合わせるため）。
使い方: python3 scripts/run_audio_ielts_day1.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts import audio_gen as ag
from data.ielts import SERIES as S1

TEST_NAME = "ielts"
SERIES_NUMBERS = [1]

print("=== 単語音声 ===")
c, f = ag.generate_series_audio(S1, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

print("=== 日本語→英語音声 ===")
c, f = ag.generate_jp2en_audio(S1, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

print("=== 例文音声 ===")
c, f = ag.generate_sentence_audio(S1, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

print("=== 連続再生音声 ===")
c, f = ag.generate_continuous_audio(S1, TEST_NAME, SERIES_NUMBERS)
print(f"生成/既存: {c}件, 失敗: {len(f)}件")
if f:
    print(f)

series_dir = os.path.join(ag.AUDIO_DIR, TEST_NAME, "Series01")
day_dir = os.path.join(ag.AUDIO_DIR, TEST_NAME, "Day1")
if os.path.isdir(series_dir):
    os.rename(series_dir, day_dir)
    print(f"リネーム: {series_dir} -> {day_dir}")
elif os.path.isdir(day_dir):
    print(f"既にDay1フォルダが存在: {day_dir}")
else:
    print(f"警告: {series_dir} が見つかりません")

print("ALL DONE")
