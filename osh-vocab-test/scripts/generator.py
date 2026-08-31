# -*- coding: utf-8 -*-
"""OSH Vocabulary Test PDF generator（共通モジュール）
引き継ぎ資料 5-2 のコードをこのMac環境向けにフォントパスのみ変更したもの。
"""
import os
import re
import random
from datetime import timedelta

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, HRFlowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONTS_DIR = os.path.join(os.path.dirname(__file__), "..", "fonts")

pdfmetrics.registerFont(TTFont('DejaVu', os.path.join(FONTS_DIR, 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-B', os.path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-I', os.path.join(FONTS_DIR, 'DejaVuSans-Oblique.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-BI', os.path.join(FONTS_DIR, 'DejaVuSans-BoldOblique.ttf')))
pdfmetrics.registerFont(TTFont('IPAGothic', os.path.join(FONTS_DIR, 'ipaexg.ttf')))

JP = 'IPAGothic'
INK = colors.HexColor('#0F1438')
BLUE = colors.HexColor('#2D3BE8')
SOFT = colors.HexColor('#4A4E7A')
LIGHT = colors.HexColor('#E3E9FA')
CARD_BORDER = colors.HexColor('#C7D3F0')


def st(name, font='DejaVu', size=10, leading=14, color=INK, **kw):
    return ParagraphStyle(name, fontName=font, fontSize=size, leading=leading, textColor=color, **kw)


s_brand = st('brand', 'DejaVu-B', 20, 24, BLUE, alignment=1)
s_series = st('series', JP, 12, 16, INK, alignment=1)
s_sub = st('sub', JP, 10, 14, SOFT, alignment=1)
s_h = st('h', 'DejaVu-B', 13, 17, INK, spaceBefore=10, spaceAfter=6)
s_body = st('body', 'DejaVu', 10, 16, INK)
s_note = st('note', JP, 8.5, 12, SOFT)
s_q = st('q', 'DejaVu', 10, 18, INK, spaceAfter=5, leftIndent=18, firstLineIndent=-18)
s_ans = st('ans', 'DejaVu', 9.5, 14, INK, spaceAfter=3)

# --- Word List（横長カード）専用スタイル ---
s_card_day = st('card_day', 'DejaVu-B', 13, 16, BLUE, alignment=1)
s_card_title = st('card_title', 'DejaVu-B', 18, 22, INK, alignment=1)
s_card_cat = st('card_cat', JP, 9, 12, SOFT, alignment=1)
s_no = st('no', 'DejaVu', 7, 9, SOFT)
s_card_word = st('card_word', 'DejaVu-B', 11, 13, BLUE, spaceBefore=1)
s_card_ipa = st('card_ipa', 'DejaVu', 9.5, 12, SOFT)
s_card_forms = st('card_forms', JP, 8, 10, SOFT)
s_card_jp = st('card_jp', JP, 11, 14, INK)
s_card_ex = st('card_ex', 'DejaVu', 10, 14, INK)
s_card_exjp = st('card_exjp', JP, 9, 12, SOFT)


def header(story, test_name, series_no, subtitle):
    story.append(Paragraph("OSH Vocabulary Test", s_brand))
    story.append(Paragraph(f"{test_name} — Day {series_no}", s_series))
    story.append(Spacer(1, 2))
    story.append(Paragraph(subtitle, s_sub))
    story.append(HRFlowable(width="100%", thickness=1.2, color=BLUE, spaceBefore=6, spaceAfter=10))


def _card_header(story, test_name, pos_label, day_label):
    """Word List（横長カード）ページ専用のヘッダー。Practice/Answer Keyのheader()とは別物。"""
    story.append(Paragraph(day_label, s_card_day))
    story.append(Paragraph("OSH Vocabulary Test", s_card_title))
    cat = f"{test_name} ｜ {pos_label}" if pos_label else test_name
    story.append(Paragraph(cat, s_card_cat))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.2, color=BLUE, spaceBefore=2, spaceAfter=0))


def _no_label(i):
    return "N O . " + " ".join(f"{i:02d}")


def _word_card_row(idx, entry, pos_label):
    w, ipa, pos, forms, jp, ex, ex_jp = entry
    ipa = _fix_ipa(ipa)
    ex_r = ex.replace('<i>', '<font name="DejaVu-B" color="#2D3BE8">').replace('</i>', '</font>')

    pos_part = ''
    if not pos_label:
        pos_abbr = POS_ABBR.get(pos, pos)
        pos_part = f' ({pos_abbr})'

    left = [
        Paragraph(_no_label(idx), s_no),
        Paragraph(w, s_card_word),
        Paragraph(f'{ipa}{pos_part}', s_card_ipa),
    ]
    if forms:
        left.append(Paragraph(forms, s_card_forms))

    right = [
        Paragraph(f'<b>{jp}</b>', s_card_jp),
        HRFlowable(width="100%", thickness=0.6, color=CARD_BORDER, spaceBefore=2, spaceAfter=2),
        Paragraph(ex_r, s_card_ex),
        Paragraph(ex_jp, s_card_exjp),
    ]
    return [left, right]


def _word_card_table(chunk, start_index, pos_label):
    rows = [_word_card_row(start_index + i, entry, pos_label) for i, entry in enumerate(chunk)]
    t = Table(rows, colWidths=[42 * mm, 132 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (0, -1), 7 * mm),
        ('RIGHTPADDING', (0, 0), (0, -1), 4 * mm),
        ('LEFTPADDING', (1, 0), (1, -1), 8 * mm),
        ('RIGHTPADDING', (1, 0), (1, -1), 8 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('LINEAFTER', (0, 0), (0, -1), 0.6, CARD_BORDER),
        ('LINEBELOW', (0, 0), (-1, -2), 0.6, CARD_BORDER),
        ('BOX', (0, 0), (-1, -1), 0.8, CARD_BORDER),
    ]))
    return t


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(JP, 7)
    canvas.setFillColor(SOFT)
    txt = getattr(doc, '_source_note', '')
    if txt:
        canvas.drawCentredString(A4[0] / 2, 10 * mm, txt)
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, "OSH Vocabulary Test")
    canvas.restoreState()

    day_label = getattr(doc, '_day_label', '')
    if day_label:
        canvas.saveState()
        canvas.setFont('DejaVu-B', 18)
        canvas.setFillColor(BLUE)
        canvas.drawString(12 * mm, A4[1] - 16 * mm, day_label)
        canvas.restoreState()


POS_ABBR = {
    'verb': 'v.', 'noun': 'n.', 'adjective': 'adj.', 'adverb': 'adv.',
    'phrase': 'phr.', 'preposition': 'prep.', 'conjunction': 'conj.',
}

BLANK = '_' * 15
_ITALIC_RE = re.compile(r'<i>(.*?)</i>')


def _blank_example(example):
    """例文中の<i>...</i>（見出し語の活用形）を空所に置き換える。戻り値: (穴埋め文, 正解)。"""
    m = _ITALIC_RE.search(example)
    answer = m.group(1)
    blanked = _ITALIC_RE.sub(BLANK, example, count=1)
    return blanked, answer


_IPA_E_RE = re.compile(r'e(?!ɪ)')


def _fix_ipa(ipa):
    """DRESS母音の/e/を/ɛ/に統一する。二重母音/eɪ/は対象外（変更しない）。"""
    return _IPA_E_RE.sub('ɛ', ipa)


_SIBILANT_ENDINGS = ('s', 'z', 'ʃ', 'ʒ', 'tʃ', 'dʒ')
_VOICELESS_ENDINGS = ('p', 't', 'k', 'f', 'θ')
# -ed用: 無声子音の後は/t/になる。無声の歯擦音(s/ʃ/tʃ)もここでは含める
# （-s用の_VOICELESS_ENDINGSは歯擦音を先に別分岐で処理するため含めていない）
_VOICELESS_ENDINGS_FOR_ED = _VOICELESS_ENDINGS + ('s', 'ʃ', 'tʃ')

# 不規則活用（規則的なlet-suffix生成では発音を導けない語形）。
# (見出し語, 活用形): 発音記号（生データ表記。/e/→/ɛ/変換は_fix_ipaが後段で適用するのでここでは適用不要）
IRREGULAR_ANSWER_IPA = {
    ('stand', 'stood'): '/stʊd/',
    ('undergo', 'undergone'): '/ˌʌn.dɚˈɡɑːn/',
    ('leave', 'left'): '/lɛft/',
    ('mislead', 'misled'): '/mɪsˈlɛd/',
    ('overpay', 'overpaid'): '/ˌoʊ.vɚˈpeɪd/',
    ('dig', 'dug'): '/dʌɡ/',
    ('draw', 'drawn'): '/drɔːn/',
    ('withdraw', 'withdrew'): '/wɪðˈdruː/',
    ('grow', 'grew'): '/ɡruː/',
    ('bite', 'bit'): '/bɪt/',
    ('blow', 'blew'): '/bluː/',
    ('rise', 'risen'): '/ˈrɪz.ən/',
    ('throw', 'threw'): '/θruː/',
    ('lay', 'laid'): '/leɪd/',
    ('lose', 'lost'): '/lɔːst/',
    ('ring', 'rang'): '/ræŋ/',
    ('pay', 'paid'): '/peɪd/',
    ('swing', 'swung'): '/swʌŋ/',
    ('sink', 'sank'): '/sæŋk/',
    ('hang', 'hung'): '/hʌŋ/',
    ('freeze', 'froze'): '/froʊz/',
    ('lie', 'lay'): '/leɪ/',
    ('break down', 'broke down'): '/broʊk daʊn/',
    ('come up with', 'came up with'): '/keɪm ʌp wɪð/',
    ("none of one's business", 'none of your business'): '/nʌn ʌv jɔːr ˈbɪz.nəs/',
    ('come to', 'came to'): '/keɪm tuː/',
    ('give to', 'gives to'): '/ɡɪvz tuː/',
    ('end up', 'ended up'): '/ˈen.dɪd ʌp/',
    ('look forward to', 'looking forward to'): '/ˈlʊk.ɪŋ ˈfɔːr.wɚd tuː/',
    ('come across', 'came across'): '/keɪm əˈkrɔːs/',
    ('run out of', 'ran out of'): '/ræn aʊt ʌv/',
    ('tend to', 'tends to'): '/tendz tuː/',
    ('get along with', 'gets along with'): '/ɡets əˈlɔːŋ wɪð/',
    ('go through', 'went through'): '/went θruː/',
    ('cut in', 'cutting in'): '/ˈkʌt̬.ɪŋ ɪn/',
    ('get on', 'got on'): '/ɡɑːt ɑːn/',
    ('work on', 'working on'): '/ˈwɝː.kɪŋ ɑːn/',
    ('arrive at', 'arrived at'): '/əˈraɪvd æt/',
    ('give to', 'gave to'): '/ɡeɪv tuː/',
    ('fall in love with', 'fell in love with'): '/fel ɪn lʌv wɪð/',
    ('look for', 'looking for'): '/ˈlʊk.ɪŋ fɔːr/',
    ('wait for', 'waited for'): '/ˈweɪ.t̬ɪd fɔːr/',
    ('pass by', 'passed by'): '/pæst baɪ/',
    ('take out', 'took out'): '/tʊk aʊt/',
    ('come out', 'came out'): '/keɪm aʊt/',
    ('turn out', 'turned out'): '/tɝːnd aʊt/',
    ('go out', 'going out'): '/ˈɡoʊ.ɪŋ aʊt/',
    ('wake up', 'woke up'): '/woʊk ʌp/',
    ('grow up', 'grew up'): '/ɡruː ʌp/',
    ('break up', 'broke up'): '/broʊk ʌp/',
}

_VOWEL_CHARS = set('aeiouəɪʊʌɔæɑɛɝɚɜ')


def _final_sound(core):
    for s in ('tʃ', 'dʒ'):
        if core.endswith(s):
            return s
    return core[-1:] if core else ''


def _maybe_flap_t(core):
    """語末の/t/が母音の直後（intervocalic）なら、この語彙集の表記慣習に合わせてフラップ化(t̬)する
    （例: notify /ˈnoʊ.t̬ə.faɪ/と同じ表記）。子音の直後（interact等）はフラップしない。"""
    if core.endswith('t') and len(core) >= 2 and core[-2] in _VOWEL_CHARS:
        return core[:-1] + 't̬'
    return core


def _ensure_primary_stress(core):
    """単音節で強勢記号がない見出し語（例: waste /weɪst/）に-s/-ed/-ingで新しい音節が増える時は、
    強勢の位置が一意に決まるよう先頭にˈを補う（例: wasted /ˈweɪst.ɪd/）。"""
    if 'ˈ' not in core and 'ˌ' not in core:
        return 'ˈ' + core
    return core


def _is_regular_s_form(base, form):
    if form in (base + 's', base + 'es'):
        return True
    if base.endswith('y') and not base.endswith(('ay', 'ey', 'oy', 'uy')) and form == base[:-1] + 'ies':
        return True
    return False


def _is_regular_ed_form(base, form):
    if form == base + 'ed':
        return True
    if base.endswith('e') and form == base + 'd':
        return True
    if len(form) == len(base) + 3 and form.startswith(base) and form.endswith('ed') and base and form[len(base)] == base[-1]:
        return True
    if base.endswith('y') and not base.endswith(('ay', 'ey', 'oy', 'uy')) and form == base[:-1] + 'ied':
        return True
    return False


def _answer_ipa(base_word, base_ipa, answer_word):
    """FIB解答（例文の<i>...</i>部分＝活用形）の発音記号を返す。
    見出し語のまま／規則的な-s・-ed・-ing活用は音韻規則から自動生成し、
    不規則活用はIRREGULAR_ANSWER_IPAを引く（未登録の場合はValueErrorで気づけるようにする）。
    """
    base_l, answer_l = base_word.lower(), answer_word.lower()
    if answer_l == base_l:
        return base_ipa
    key = (base_l, answer_l)
    if key in IRREGULAR_ANSWER_IPA:
        return IRREGULAR_ANSWER_IPA[key]

    core = base_ipa.strip('/')

    if answer_l.endswith('ing'):
        return f'/{_ensure_primary_stress(_maybe_flap_t(core))}.ɪŋ/'

    if _is_regular_ed_form(base_l, answer_l):
        f = _final_sound(core)
        if f in ('t', 'd'):
            stem = _maybe_flap_t(core) if f == 't' else core
            return f'/{_ensure_primary_stress(stem)}.ɪd/'
        if f in _VOICELESS_ENDINGS_FOR_ED:
            return f'/{core}t/'
        return f'/{core}d/'

    if _is_regular_s_form(base_l, answer_l):
        f = _final_sound(core)
        if f in _SIBILANT_ENDINGS:
            return f'/{_ensure_primary_stress(core)}.ɪz/'
        if f in _VOICELESS_ENDINGS:
            return f'/{core}s/'
        return f'/{core}z/'

    raise ValueError(
        f"'{base_word}' -> '{answer_word}' は不規則活用のためIPAを自動生成できません。"
        f" IRREGULAR_ANSWER_IPAに ('{base_word}', '{answer_word}') の発音記号を追加してください。"
    )


def build_series(test_name, series_no, words, outpath, pos_label=None, source_note=None, start_date=None, day_label=None):
    story = []

    if day_label is None:
        day_label = f"Day{series_no}"
        if start_date:
            d = start_date + timedelta(days=series_no - 1)
            day_label += f" ({d.month}/{d.day})"

    CARD_CHUNK = 10
    chunks = [words[i:i + CARD_CHUNK] for i in range(0, len(words), CARD_CHUNK)]
    for ci, chunk in enumerate(chunks):
        _card_header(story, test_name, pos_label, day_label)
        story.append(_word_card_table(chunk, ci * CARD_CHUNK + 1, pos_label))
        if ci < len(chunks) - 1:
            story.append(PageBreak())

    story.append(PageBreak())

    p1_sub = "Practice（練習）｜ Word Listの例文で穴埋め（20問）"
    if pos_label:
        p1_sub += f"｜ {pos_label}"
    p1_sub += f"｜ Day {series_no}"
    header(story, test_name, series_no, p1_sub)
    story.append(Paragraph(
        f'<font name="{JP}">日本語の意味をヒントに、空所に単語を入れなさい。必要に応じて形を変えること。</font>',
        s_note))
    story.append(Spacer(1, 10))

    shuffled_words = words.copy()
    random.Random(series_no).shuffle(shuffled_words)

    answers = []
    for i, (w, ipa, pos, forms, jp, ex, ex_jp) in enumerate(shuffled_words, 1):
        blanked, answer = _blank_example(ex)
        answers.append((answer, _fix_ipa(_answer_ipa(w, ipa, answer))))
        story.append(Paragraph(
            f'<font name="{JP}" size="9" color="#4A4E7A">{i}. {jp}</font><br/>{blanked}',
            s_q))

    story.append(PageBreak())

    header(story, test_name, series_no, "Answer Key（解答）")
    half = (len(answers) + 1) // 2
    left = [f"{i}. {a} {ipa}" for i, (a, ipa) in enumerate(answers[:half], 1)]
    right = [f"{i}. {a} {ipa}" for i, (a, ipa) in enumerate(answers[half:], half + 1)]
    while len(right) < len(left):
        right.append('')
    t2 = Table(list(zip(left, right)), colWidths=[85 * mm, 85 * mm])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'DejaVu'),
        ('FONTSIZE', (0, 0), (-1, -1), 9.5),
        ('TEXTCOLOR', (0, 0), (-1, -1), INK),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t2)

    doc = SimpleDocTemplate(outpath, pagesize=A4,
                             topMargin=16 * mm, bottomMargin=20 * mm,
                             leftMargin=18 * mm, rightMargin=18 * mm,
                             title=f"OSH {test_name} Day {series_no}")
    doc._source_note = source_note or ""
    doc._day_label = day_label
    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
