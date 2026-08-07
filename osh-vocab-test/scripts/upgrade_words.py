# -*- coding: utf-8 -*-
"""既存の6要素wordsタプル (word, ipa, pos, en_def, ja, example) を
新フォーマットの7要素 (word, ipa, pos, forms, ja, example, example_ja) に変換する。
forms/example_ja は外部から与えられたlookup dictを使う。
"""


def upgrade_series_map(series_map, lookup):
    """lookup: {word: (forms, example_ja)}"""
    new_map = {}
    for n, d in series_map.items():
        new_words = []
        for w in d['words']:
            word = w[0]
            ipa, pos, _en, ja, example = w[1], w[2], w[3], w[4], w[5]
            forms, example_ja = lookup[word]
            new_words.append((word, ipa, pos, forms, ja, example, example_ja))
        new_d = dict(d)
        new_d['words'] = new_words
        new_map[n] = new_d
    return new_map
