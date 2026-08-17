# -*- coding: utf-8 -*-
"""9月「1ヶ月分」（Day1〜30、Day7/14/21/28欠番）の音声を全カテゴリ分まとめて生成する。
Clacel/IELTSのDay1は既に正しい音声が存在するためスキップする。
TOEICは今回のセッションでDay1/2相当の本文が変わっており、旧Series01〜07音声は
output/audio/toeic/_old_pre_month1_backup/ に退避済みなので、Day1から全て新規生成する。

生成順: 単語音声→日本語→英語→例文音声→連続再生。各語ごとにSeries{N:02d}へ生成し、
その後Day{N}へリネームする（既存のDay1生成スクリプトと同じ方式）。
音声仕様: 英語は男性Evan(Enhanced)のみ、日本語→英語はKyoko(女性)+Evan(男性)結合1本。

使い方: venv/bin/python3 scripts/generate_all_audio.py 2>&1 | tee /tmp/audio_gen.log
"""
import importlib.util
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from scripts import audio_gen as ag


def load(path):
    spec = importlib.util.spec_from_file_location(path, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.SERIES


def build_clacel_map():
    c02 = load("data/clacel_02.py")
    c01_1 = load("data/clacel_01.py")
    c01_23 = load("data/clacel_01_s2_s3.py")
    c01_45 = load("data/clacel_01_s4_s5.py")
    c01_67 = load("data/clacel_01_s6_s7.py")
    c01_8 = load("data/clacel_01_s8.py")
    c03_verb = load("data/clacel_03_verb.py")
    c03_noun = load("data/clacel_03_noun.py")
    c03_adj = load("data/clacel_03_adjective.py")
    c03_adv = load("data/clacel_03_adverb.py")
    c03_idiom = load("data/clacel_03_idiom.py")
    c03_phrasal = load("data/clacel_03_phrasal.py")
    round2 = load("data/clacel_02_s1_round2.py")
    return [
        (2, c02[2]), (3, c02[3]), (4, c02[4]), (5, c02[5]), (6, c02[6]),
        (8, c02[7]), (9, c02[8]),
        (10, c01_1[1]), (11, c01_23[2]), (12, c01_23[3]), (13, c01_45[4]),
        (15, c01_45[5]), (16, c01_67[6]), (17, c01_67[7]), (18, c01_8[8]),
        (19, c03_verb[1]), (20, c03_verb[2]),
        (22, c03_noun[3]), (23, c03_adj[4]), (24, c03_adv[5]),
        (25, c03_idiom[6]), (26, c03_idiom[7]), (27, c03_phrasal[8]),
        (29, c03_phrasal[9]), (30, round2["1r2"]),
    ]


def build_toeic_map():
    t1 = load("data/toeic.py")
    t6 = load("data/toeic_s6.py")
    t7 = load("data/toeic_s7.py")
    t8 = load("data/toeic_s8.py")
    t910 = load("data/toeic_s9_s10.py")
    t11 = load("data/toeic_s11.py")
    t12 = load("data/toeic_s12.py")
    t1318 = load("data/toeic_s13_to_s18.py")
    t1924 = load("data/toeic_s19_to_s24.py")
    t2526 = load("data/toeic_s25_s26.py")
    return [
        (1, t1[1]), (2, t1[2]), (3, t1[3]), (4, t1[4]), (5, t1[5]), (6, t6[6]),
        (8, t7[7]), (9, t8[8]), (10, t910[9]), (11, t910[10]), (12, t11[11]), (13, t12[12]),
        (15, t1318[13]), (16, t1318[14]), (17, t1318[15]), (18, t1318[16]), (19, t1318[17]), (20, t1318[18]),
        (22, t1924[19]), (23, t1924[20]), (24, t1924[21]), (25, t1924[22]), (26, t1924[23]), (27, t1924[24]),
        (29, t2526[25]), (30, t2526[26]),
    ]


def build_ielts_map():
    i1 = load("data/ielts.py")
    i6 = load("data/ielts_s6.py")
    i7 = load("data/ielts_s7.py")
    i8 = load("data/ielts_s8.py")
    i910 = load("data/ielts_s9_s10.py")
    i11 = load("data/ielts_s11.py")
    i12 = load("data/ielts_s12.py")
    i1324 = load("data/ielts_s13_to_s24.py")
    i2526 = load("data/ielts_s25_s26.py")
    return [
        (2, i1[2]), (3, i1[3]), (4, i1[4]), (5, i1[5]), (6, i6[6]),
        (8, i7[7]), (9, i8[8]), (10, i910[9]), (11, i910[10]), (12, i11[11]), (13, i12[12]),
        (15, i1324[13]), (16, i1324[14]), (17, i1324[15]), (18, i1324[16]), (19, i1324[17]), (20, i1324[18]),
        (22, i1324[19]), (23, i1324[20]), (24, i1324[21]), (25, i1324[22]), (26, i1324[23]), (27, i1324[24]),
        (29, i2526[25]), (30, i2526[26]),
    ]


def generate_day(test_name, day, series_data):
    series_map = {day: series_data}
    series_dir = os.path.join(ag.AUDIO_DIR, test_name, f"Series{day:02d}")
    day_dir = os.path.join(ag.AUDIO_DIR, test_name, f"Day{day}")

    t0 = time.time()
    c1, f1 = ag.generate_series_audio(series_map, test_name, [day])
    c2, f2 = ag.generate_jp2en_audio(series_map, test_name, [day])
    c3, f3 = ag.generate_sentence_audio(series_map, test_name, [day])
    c4, f4 = ag.generate_continuous_audio(series_map, test_name, [day])

    if os.path.isdir(series_dir) and not os.path.isdir(day_dir):
        os.rename(series_dir, day_dir)
    elif os.path.isdir(series_dir) and os.path.isdir(day_dir):
        # 既にDay{N}が存在する場合は中身をマージする
        for fname in os.listdir(series_dir):
            os.replace(os.path.join(series_dir, fname), os.path.join(day_dir, fname))
        os.rmdir(series_dir)

    failures = f1 + f2 + f3 + f4
    elapsed = time.time() - t0
    print(f"  {test_name} Day{day}: 単語{c1} jp2en{c2} 例文{c3} 連続{c4} 失敗{len(failures)} ({elapsed:.0f}s)")
    if failures:
        print(f"    失敗詳細: {failures}")
    return len(failures)


def main():
    plans = [
        ("clacel_02", build_clacel_map()),
        ("toeic", build_toeic_map()),
        ("ielts", build_ielts_map()),
    ]
    total_failures = 0
    grand_t0 = time.time()
    for test_name, day_list in plans:
        print(f"=== {test_name}: {len(day_list)}日分 ===")
        for day, series_data in day_list:
            total_failures += generate_day(test_name, day, series_data)
    elapsed = time.time() - grand_t0
    print(f"ALL DONE ({elapsed/60:.1f}分), 総失敗数: {total_failures}")


if __name__ == "__main__":
    main()
