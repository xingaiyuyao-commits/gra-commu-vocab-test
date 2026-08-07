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
LIGHT = colors.HexColor('#EAE1F7')


def st(name, font='DejaVu', size=10, leading=14, color=INK, **kw):
    return ParagraphStyle(name, fontName=font, fontSize=size, leading=leading, textColor=color, **kw)


s_brand = st('brand', 'DejaVu-B', 20, 24, BLUE, alignment=1)
s_series = st('series', JP, 12, 16, INK, alignment=1)
s_sub = st('sub', JP, 10, 14, SOFT, alignment=1)
s_h = st('h', 'DejaVu-B', 13, 17, INK, spaceBefore=10, spaceAfter=6)
s_word = st('word', 'DejaVu', 10.5, 15, INK, spaceAfter=12)
s_body = st('body', 'DejaVu', 10, 16, INK)
s_note = st('note', JP, 8.5, 12, SOFT)
s_q = st('q', 'DejaVu', 10, 18, INK, spaceAfter=5, leftIndent=18, firstLineIndent=-18)
s_ans = st('ans', 'DejaVu', 9.5, 14, INK, spaceAfter=3)


def header(story, test_name, series_no, subtitle):
    story.append(Paragraph("OSH Vocabulary Test", s_brand))
    story.append(Paragraph(f"{test_name} — Day {series_no}", s_series))
    story.append(Spacer(1, 2))
    story.append(Paragraph(subtitle, s_sub))
    story.append(HRFlowable(width="100%", thickness=1.2, color=BLUE, spaceBefore=6, spaceAfter=10))


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


def build_series(test_name, series_no, words, outpath, pos_label=None, source_note=None, start_date=None):
    story = []

    list_subtitle = "Word List（単語リスト）"
    if pos_label:
        list_subtitle = f"Word List（単語リスト）｜ {pos_label}"
    header(story, test_name, series_no, list_subtitle)

    for i, (w, ipa, pos, forms, jp, ex, ex_jp) in enumerate(words, 1):
        ex_r = ex.replace('<i>', '<font name="DejaVu-BI">').replace('</i>', '</font>')
        forms_part = f' ({forms})' if forms else ''
        pos_part = ''
        if not pos_label:
            pos_abbr = POS_ABBR.get(pos, pos)
            pos_part = f' <i><font color="#4A4E7A">({pos_abbr})</font></i>'
        block = (f'<b>{i}. <font name="DejaVu-B" color="#2D3BE8">{w}</font></b> '
                 f'{ipa}{pos_part}{forms_part}<br/>'
                 f'<font name="{JP}" size="9" color="#4A4E7A">　{jp}</font><br/>'
                 f'　{ex_r}<br/>'
                 f'<font name="{JP}" size="9" color="#4A4E7A">　{ex_jp}</font>')
        story.append(Paragraph(block, s_word))

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
        answers.append(answer)
        story.append(Paragraph(
            f'<font name="{JP}" size="9" color="#4A4E7A">{i}. {jp}</font><br/>{blanked}',
            s_q))

    story.append(PageBreak())

    header(story, test_name, series_no, "Answer Key（解答）")
    half = (len(answers) + 1) // 2
    left = [f"{i}. {a}" for i, a in enumerate(answers[:half], 1)]
    right = [f"{i}. {a}" for i, a in enumerate(answers[half:], half + 1)]
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
    day_label = f"Day{series_no}"
    if start_date:
        d = start_date + timedelta(days=series_no - 1)
        day_label += f" ({d.month}/{d.day})"
    doc._day_label = day_label
    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
