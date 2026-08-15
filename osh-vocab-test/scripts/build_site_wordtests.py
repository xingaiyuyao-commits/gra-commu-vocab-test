# -*- coding: utf-8 -*-
"""PDF側のdata/*.py（9月「1ヶ月分」）を、サイト本体のwordtests-*.js形式に変換する。
既存のwordtests-*.jsを、Day1〜30（Day7/14/21/28は復習日のため欠番）の全24日分で
まるごと置き換える。日付マッピングはosh-vocab-test/progress.mdの確定表に対応する。
使い方: venv/bin/python3 scripts/build_site_wordtests.py
"""
import importlib.util
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
ITAL = re.compile(r"<i>(.*?)</i>")


def load_series(path):
    spec = importlib.util.spec_from_file_location(path, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.SERIES


def make_hint(base):
    # サーバー側quizHint(base)と同じアルゴリズム（見出し語の文字数基準、活用形ではない）
    return base[0] + "_" * (len(base) - 1)


def words_to_items(words):
    items = []
    for w in words:
        word, ipa, pos, forms, ja, example, example_ja = w
        m = ITAL.search(example)
        answer = m.group(1)
        sentence = example[: m.start()] + "___" + example[m.end():]
        base = word.lower()
        items.append({
            "sentence": sentence,
            "answer": answer.lower(),
            "base": base,
            "hint": make_hint(base),
            "ja": ja,
            "sentenceJa": example_ja,
        })
    return items


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def serialize(label, header_lines, day_series_pairs):
    out = "\n".join(header_lines) + "\n" if header_lines else ""
    out += "module.exports = {\n"
    out += f"  label: {js_str(label)},\n"
    out += "  series: [\n"
    for day, words in day_series_pairs:
        items = words_to_items(words)
        out += "    {\n"
        out += f'      name: {js_str(f"Day {day}")},\n'
        out += "      items: [\n"
        for it in items:
            out += (
                f'        {{ sentence: {js_str(it["sentence"])}, answer: {js_str(it["answer"])}, '
                f'base: {js_str(it["base"])}, hint: {js_str(it["hint"])}, ja: {js_str(it["ja"])}, '
                f'sentenceJa: {js_str(it["sentenceJa"])} }},\n'
            )
        out += "      ],\n"
        out += "    },\n"
    out += "  ],\n"
    out += "};\n"
    return out


def build_clacel():
    c02 = load_series("data/clacel_02.py")
    c01_1 = load_series("data/clacel_01.py")
    c01_23 = load_series("data/clacel_01_s2_s3.py")
    c01_45 = load_series("data/clacel_01_s4_s5.py")
    c01_67 = load_series("data/clacel_01_s6_s7.py")
    c01_8 = load_series("data/clacel_01_s8.py")
    c03_verb = load_series("data/clacel_03_verb.py")
    c03_noun = load_series("data/clacel_03_noun.py")
    c03_adj = load_series("data/clacel_03_adjective.py")
    c03_adv = load_series("data/clacel_03_adverb.py")
    c03_idiom = load_series("data/clacel_03_idiom.py")
    c03_phrasal = load_series("data/clacel_03_phrasal.py")
    round2 = load_series("data/clacel_02_s1_round2.py")

    mapping = [
        (1, c02[1]), (2, c02[2]), (3, c02[3]), (4, c02[4]), (5, c02[5]), (6, c02[6]),
        (8, c02[7]), (9, c02[8]),
        (10, c01_1[1]), (11, c01_23[2]), (12, c01_23[3]), (13, c01_45[4]),
        (15, c01_45[5]), (16, c01_67[6]), (17, c01_67[7]), (18, c01_8[8]),
        (19, c03_verb[1]), (20, c03_verb[2]),
        (22, c03_noun[3]), (23, c03_adj[4]), (24, c03_adv[5]),
        (25, c03_idiom[6]), (26, c03_idiom[7]), (27, c03_phrasal[8]),
        (29, c03_phrasal[9]), (30, round2["1r2"]),
    ]
    pairs = [(day, d["words"]) for day, d in mapping]
    header = [
        "// Clacel 2.0 単語テスト問題（9月「1ヶ月分」、osh-vocab-test/data/*.pyから自動生成）",
        "// answer は例文中の活用形を小文字で保持。判定時に両者を小文字化して比較する",
        "// Day7/14/21/28は復習日のため欠番。Day9は12語、Day18は19語、Day29は19語（元データの語数通り）",
    ]
    return serialize("Clacel", header, pairs)


def build_toeic():
    t1 = load_series("data/toeic.py")
    t6 = load_series("data/toeic_s6.py")
    t7 = load_series("data/toeic_s7.py")
    t8 = load_series("data/toeic_s8.py")
    t910 = load_series("data/toeic_s9_s10.py")
    t11 = load_series("data/toeic_s11.py")
    t12 = load_series("data/toeic_s12.py")
    t1318 = load_series("data/toeic_s13_to_s18.py")
    t1924 = load_series("data/toeic_s19_to_s24.py")
    t2526 = load_series("data/toeic_s25_s26.py")

    mapping = [
        (1, t1[1]), (2, t1[2]), (3, t1[3]), (4, t1[4]), (5, t1[5]), (6, t6[6]),
        (8, t7[7]), (9, t8[8]), (10, t910[9]), (11, t910[10]), (12, t11[11]), (13, t12[12]),
        (15, t1318[13]), (16, t1318[14]), (17, t1318[15]), (18, t1318[16]), (19, t1318[17]), (20, t1318[18]),
        (22, t1924[19]), (23, t1924[20]), (24, t1924[21]), (25, t1924[22]), (26, t1924[23]), (27, t1924[24]),
        (29, t2526[25]), (30, t2526[26]),
    ]
    pairs = [(day, d["words"]) for day, d in mapping]
    header = [
        "// TOEIC 単語テスト問題（9月「1ヶ月分」、osh-vocab-test/data/*.pyから自動生成）",
        "// answer は例文中の活用形を小文字で保持。判定時に両者を小文字化して比較する",
        "// Day7/14/21/28は復習日のため欠番",
    ]
    return serialize("TOEIC", header, pairs)


def build_ielts():
    i1 = load_series("data/ielts.py")
    i6 = load_series("data/ielts_s6.py")
    i7 = load_series("data/ielts_s7.py")
    i8 = load_series("data/ielts_s8.py")
    i910 = load_series("data/ielts_s9_s10.py")
    i11 = load_series("data/ielts_s11.py")
    i12 = load_series("data/ielts_s12.py")
    i1324 = load_series("data/ielts_s13_to_s24.py")
    i2526 = load_series("data/ielts_s25_s26.py")

    mapping = [
        (1, i1[1]), (2, i1[2]), (3, i1[3]), (4, i1[4]), (5, i1[5]), (6, i6[6]),
        (8, i7[7]), (9, i8[8]), (10, i910[9]), (11, i910[10]), (12, i11[11]), (13, i12[12]),
        (15, i1324[13]), (16, i1324[14]), (17, i1324[15]), (18, i1324[16]), (19, i1324[17]), (20, i1324[18]),
        (22, i1324[19]), (23, i1324[20]), (24, i1324[21]), (25, i1324[22]), (26, i1324[23]), (27, i1324[24]),
        (29, i2526[25]), (30, i2526[26]),
    ]
    pairs = [(day, d["words"]) for day, d in mapping]
    header = [
        "// IELTS 単語テスト問題（9月「1ヶ月分」、osh-vocab-test/data/*.pyから自動生成）",
        "// answer は例文中の活用形を小文字で保持。判定時に両者を小文字化して比較する",
        "// Day7/14/21/28は復習日のため欠番",
    ]
    return serialize("IELTS", header, pairs)


if __name__ == "__main__":
    outputs = {
        "wordtests-clacel.js": build_clacel(),
        "wordtests-toeic.js": build_toeic(),
        "wordtests-ielts.js": build_ielts(),
    }
    for filename, content in outputs.items():
        path = os.path.join(REPO_ROOT, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        total_days = content.count('name: "Day')
        total_words = content.count("sentenceJa:")
        print(f"generated: {filename} ({total_days} days, {total_words} words)")
