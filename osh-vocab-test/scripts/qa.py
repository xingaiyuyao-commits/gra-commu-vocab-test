# -*- coding: utf-8 -*-
"""シリーズデータのQAロジック。
Practiceページの穴埋め問題はWord Listの例文（<i>...</i>で囲んだ活用形）から
generator.pyが自動生成するため、ここでは主にWord List自体の整合性を検査する。
"""

import re

_ITALIC_RE = re.compile(r'<i>(.*?)</i>')


def run_qa(series_map, expect_pos=None, expected_word_count=20, uk_ipa_markers=('ɒ', 'ɜː')):
    """series_map: {series_no: series_dict} 全体を横断でQAする。
    expect_pos: {series_no: 'verb'|'noun'|...} 品詞統一チェック対象のみ指定。
    戻り値: エラーメッセージのリスト（空なら合格）。
    """
    errors = []
    all_words = {}

    for n, d in series_map.items():
        words = d['words']
        hw = [w[0] for w in words]
        exp = d.get('expected_count', expected_word_count)

        if len(words) != exp:
            errors.append(f"S{n}: 単語数{len(words)}（期待{exp}）")

        if expect_pos and n in expect_pos:
            ps = set(w[2] for w in words)
            if ps != {expect_pos[n]}:
                errors.append(f"S{n}: 品詞不統一 {ps}")

        for w in hw:
            key = w.lower()
            if key in all_words:
                errors.append(f"重複: '{w}'（S{all_words[key]}/S{n}）")
            all_words[key] = n

        for w, ipa, pos, forms, ja, example, example_ja in words:
            for marker in uk_ipa_markers:
                if marker in ipa:
                    errors.append(f"S{n} '{w}': UK式IPA混入 {ipa}")
            matches = _ITALIC_RE.findall(example)
            if len(matches) != 1:
                errors.append(f"S{n} '{w}': 例文の<i>タグが{len(matches)}個（1個である必要）")

    return errors


if __name__ == '__main__':
    import sys
    sys.path.insert(0, '.')
    from data.clacel_02 import SERIES as CLACEL02
    errs = run_qa(CLACEL02)
    if errs:
        print("QA NG:")
        for e in errs:
            print(" -", e)
        sys.exit(1)
    total = sum(len(d['words']) for d in CLACEL02.values())
    print(f"QA OK: 全{total}語ユニーク")
