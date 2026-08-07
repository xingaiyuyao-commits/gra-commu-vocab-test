# OSH Vocabulary Test ｜ 作成・引き継ぎ資料

このドキュメントは、**別のClaudeのページ（新しい会話）でも同じ単語テストを再現・継続できるようにするための完全な手順書**です。このファイルの内容をそのまま新しいClaudeに渡せば、同じ品質・同じ方法で続きを作れます。

---

## 1\. このプロジェクトの概要

「OSH Vocabulary Test」という単語テスト教材シリーズをPDFで作成する。4種類のテストがあり、それぞれ「単語リスト＋テスト（Fill in the blank 20問＋英作文5問）＋解答」で1シリーズ＝20語。各テスト種を50シリーズずつ作るのが最終目標。

### 4種類のテストと出典リスト

| テスト種 | ベース単語リスト（出典） | トーン・レベル |
| :---- | :---- | :---- |
| TOEIC | **TSL**（TOEIC Service List, Browne & Culligan, 2016） | ビジネス、600〜800点帯 |
| IELTS | **NAWL**（New Academic Word List, Browne/Culligan/Phillips, 2013） | アカデミック、Band 6.0〜7.0 |
| 英検2級 | **NGSL**（New General Service List, 同上, 2013） | 日常・学校・社会、過去問頻出 |
| Clacel 2.0 | **Clacel提供のCSVリスト**（CLACEL01/02/03の3レベル） | Clacel独自 |

出典リストはすべて **CC BY-SA 4.0**（コーパス頻度に基づく無料の学術リスト）。newgeneralservicelist.com および eapfoundation.com で頻度順データが取得できる。**単語そのものは事実情報で著作権対象外。例文・問題・訳は全てオリジナル作成**するため商用利用可。出典はPDFフッターに明記する。

---

## 2\. 「単語の引っ張り方」＝語の選定方法（最重要）

これが今回の質問の核心。手順は以下の通り。

### ステップA：コーパス頻度リストを取得する

**コーパスとは**：実際に使われた大量の英語文章（新聞・論文・会話など数億語）を集めたデータベース。「どの単語が実際に何回使われたか」を数値で示せるので、「本当によく出る順」に単語を並べられる。感覚ではなくデータに基づく客観的な裏付けになる。

各リストの取得元URL（web\_fetchで取得。bash直接curlはドメイン制限で不可の場合あり）：

- **TSL**（TOEIC）: `https://www.newgeneralservicelist.com/toeic-service-list` → CSVリンク `https://www.newgeneralservicelist.com/s/TSL_12_stats.csv`（頻度ランキング付き1250語）  
- **NAWL**（IELTS）: `https://www.eapfoundation.com/vocab/academic/nawl/`（SFI＝頻度指標つき全リスト）。newgeneralservicelist.org の.txtリンクは404になっていることがある。  
- **NGSL**（英検2級）: `https://www.newgeneralservicelist.com/new-general-service-list` → `https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv`（頻度順2800語）

取得できない場合でも、これらのリストは「TOEICならreimburse/invoice/itinerary、IELTSならsignificant/hypothesis/empirical、英検2級なら日常のNGSL語」というように**どの語が含まれるかは広く知られている**ので、Claudeの知識で該当レベルの頻出語を選んでも良い。ただしフッターの出典表記は正確に。

### ステップB：頻度順の語を品詞で振り分ける

取得したリストは頻度順（混在品詞）。これを **動詞・名詞・形容詞・副詞** に分類する。分類はPythonで品詞判定してもいいし、Claudeが手作業でやってもよい。

### ステップC：レベル・実用性でフィルタ

- 機能語（the, be, of等の超基本語）は除外  
- 専門的すぎる語（IELTS/NAWLの algorithm, enzyme 等）は汎用性で判断して除外  
- そのテストらしい語を優先（TOEIC=ビジネス、IELTS=アカデミック、英検2級=日常）

### ステップD：20語ずつシリーズに分割

各シリーズ20語。**品詞は1シリーズ1品詞に統一**（動詞シリーズ・名詞シリーズ・形容詞シリーズ）。

### 品詞配分ルール（各テスト種のSeries 1〜5）

**動詞2・名詞2・形容詞1** の配分：

- Series 1: 動詞①  
- Series 2: 動詞②  
- Series 3: 名詞①  
- Series 4: 名詞②  
- Series 5: 形容詞①

（Series 6以降を作る場合も、動詞→名詞→形容詞→副詞の品詞順で続ける）

### Clacel 2.0 の特別ルール

Clacelは提供CSVの構造に従う（コーパス出典ではない）：

- CSVは3列（CLACEL01/02/03）＝3つのレベル  
- 各列を **CSV順のまま** 20語ずつシリーズに分割（例：CLACEL02 152語→Series 1〜8）  
- CLACEL02は既に品詞順（動詞→名詞→形容詞→副詞→前置詞）に並んでいたのでその順を尊重  
- **語はシャッフルしてミックス**（リスト内での並びは崩す）  
- CLACEL03はidiom（熟語）中心 → テスト形式を「語群＋和訳ヒントで空所補充」に調整予定（未着手）  
- 端数シリーズ（例：CLACEL02 Series 8は12語）はその語数のまま作る

---

## 3\. テストの仕様（全種共通）

各シリーズ＝PDF 5ページ構成：

1. **Word List（単語リスト）**：20語。各語に「番号・見出し語（青太字）・発音記号・品詞・英語定義・日本語訳・例文（該当語をグレー網掛け斜体太字）」  
2. **Test Part 1: Fill in the Blank（20問）**：Word Bank（20語の表）＋空所補充20問。各1点。必要に応じ語形変化（過去形・三単現・複数形）あり  
3. **（Part 1の続き）**  
4. **Test Part 2: Sentence Writing（5問）**：指定語5つで自由英作文。記入欄2行。各2点。合計30点満点  
5. **Answer Key（解答）**：Part 1解答（2列表・語形変化や別解の注釈つき）＋ Part 2解答例

### 発音記号のルール（重要）

**必ず Cambridge Dictionary の US（アメリカ）発音**。UK特有記号（ɒ, ɜː）は使わない。US式では ɝː（confirm=/kənˈfɝːm/）、t̬（quarterly=/ˈkwɔːr.t̬ɚ.li/）、ɚ、ɑː などを使う。

### デザイン仕様

- タイトル：「OSH Vocabulary Test」（青太字 \#2D3BE8、中央）  
- サブタイトル：「〈テスト名〉 — Series N」＋品詞ラベル  
- 配色：INK \#0F1438 / BLUE \#2D3BE8 / SOFT \#4A4E7A / LIGHT \#EAE1F7  
- フッター：左寄せに出典、右寄せに「OSH Vocabulary Test」  
- 日本語フォント：IPAゴシック（`/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf`）  
- 英字フォント：DejaVu Sans（発音記号IPAも表示可能）

---

## 4\. 品質チェック（QA）— 必ず自動検証する

各シリーズ生成前に以下を自動チェック（Pythonスクリプト）。1つでも失敗したら修正してから生成：

1. **語数**：単語20語・FIB20問・Part2が5語＋5例文（端数シリーズは実際の語数）  
2. **品詞統一**：動詞シリーズなら全語verb、など期待品詞と一致  
3. **重複なし**：シリーズ内＋**シリーズ間も横断で**全語ユニーク  
4. **Part2語がリスト内にある**  
5. **FIB網羅性**：20問で20語すべてが最低1回使われている（語形変化も接頭辞一致で判定）  
6. **空所の存在**：各FIB問に `______` がある  
7. **語形変化と注釈の整合**：過去形・三単現等になっている問の番号が、解答注釈（answer\_notes）に記載されている  
8. **UK式IPA混入チェック**：ɒ や ɜː が含まれていないか

さらに生成後、PDFを画像化（pdf2image, dpi70前後）して**目視確認**する。

### これまで実際に見つかった不具合の例（要注意）

- 同じ語が複数シリーズに重複（verify, explicit, offer, encourage 等）→ 片方を別語に差し替え  
- FIBで1語だけ使われず別の語が2回出題 → 差し替え  
- アルファベット順で作ってしまった（初期版）→ ユーザー要望で品詞別＋シャッフルに変更  
- 語形変化の注釈番号ズレ

---

## 5\. 再現用の完全なコード

新しいClaudeの環境（Linux, Python, reportlab）で以下を順に実行すれば同じPDFが作れる。

### 5-1. 環境準備

pip install reportlab pdf2image \--break-system-packages

\# フォント確認（IPAゴシックとDejaVuがあること）

fc-list | grep \-iE "ipafont|dejavu"

### 5-2. 共通生成モジュール `generator.py`

\# \-\*- coding: utf-8 \-\*-

"""OSH Vocabulary Test PDF generator（共通モジュール）"""

import random

from reportlab.lib.pagesizes import A4

from reportlab.lib.units import mm

from reportlab.lib import colors

from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,

                                Table, TableStyle, HRFlowable)

from reportlab.lib.styles import ParagraphStyle

from reportlab.pdfbase import pdfmetrics

from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))

pdfmetrics.registerFont(TTFont('DejaVu-B', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

pdfmetrics.registerFont(TTFont('DejaVu-I', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'))

pdfmetrics.registerFont(TTFont('DejaVu-BI', '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf'))

pdfmetrics.registerFont(TTFont('IPAGothic', '/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf'))

JP \= 'IPAGothic'

INK \= colors.HexColor('\#0F1438')

BLUE \= colors.HexColor('\#2D3BE8')

SOFT \= colors.HexColor('\#4A4E7A')

LIGHT \= colors.HexColor('\#EAE1F7')

def st(name, font='DejaVu', size=10, leading=14, color=INK, \*\*kw):

    return ParagraphStyle(name, fontName=font, fontSize=size, leading=leading, textColor=color, \*\*kw)

s\_brand  \= st('brand', 'DejaVu-B', 20, 24, BLUE, alignment=1)

s\_series \= st('series', JP, 12, 16, INK, alignment=1)

s\_sub    \= st('sub', JP, 10, 14, SOFT, alignment=1)

s\_h      \= st('h', 'DejaVu-B', 13, 17, INK, spaceBefore=10, spaceAfter=6)

s\_word   \= st('word', 'DejaVu', 9.5, 13, INK, spaceAfter=7)

s\_body   \= st('body', 'DejaVu', 10, 16, INK)

s\_note   \= st('note', JP, 8.5, 12, SOFT)

s\_q      \= st('q', 'DejaVu', 10, 18, INK, spaceAfter=5, leftIndent=18, firstLineIndent=-18)

s\_ans    \= st('ans', 'DejaVu', 9.5, 14, INK, spaceAfter=3)

def header(story, test\_name, series\_no, subtitle):

    story.append(Paragraph("OSH Vocabulary Test", s\_brand))

    story.append(Paragraph(f"{test\_name} — Series {series\_no}", s\_series))

    story.append(Spacer(1, 2))

    story.append(Paragraph(subtitle, s\_sub))

    story.append(HRFlowable(width="100%", thickness=1.2, color=BLUE, spaceBefore=6, spaceAfter=10))

def \_footer(canvas, doc):

    canvas.saveState()

    canvas.setFont('DejaVu', 7\)

    canvas.setFillColor(SOFT)

    txt \= getattr(doc, '\_source\_note', '')

    if txt:

        canvas.drawCentredString(A4\[0\]/2, 10\*mm, txt)

    canvas.drawRightString(A4\[0\]-18\*mm, 10\*mm, "OSH Vocabulary Test")

    canvas.restoreState()

def build\_series(test\_name, series\_no, words, fib, sw\_words, sw\_samples,

                 outpath, answer\_notes=None, seed=None, pos\_label=None, source\_note=None):

    story \= \[\]

    list\_subtitle \= "Word List（単語リスト）"

    if pos\_label:

        list\_subtitle \= f"Word List（単語リスト）｜ {pos\_label}"

    header(story, test\_name, series\_no, list\_subtitle)

    for i, (w, ipa, pos, en, jp, ex) in enumerate(words, 1):

        ex\_r \= ex.replace('\<i\>', '\<font name="DejaVu-BI" backColor="\#E3E3E3"\>').replace('\</i\>', '\</font\>')

        block \= (f'\<b\>{i}. \<font name="DejaVu-B" color="\#2D3BE8"\>{w}\</font\>\</b\> '

                 f'{ipa} — \<i\>{pos}\</i\>; {en}\<br/\>'

                 f'\<font name="{JP}" size="8.5" color="\#4A4E7A"\>　{jp}\</font\>\<br/\>'

                 f'　{ex\_r}')

        story.append(Paragraph(block, s\_word))

    story.append(PageBreak())

    p1\_sub \= "Test — Part 1: Fill in the Blank（20問）"

    if pos\_label:

        p1\_sub \+= f"｜ {pos\_label}"

    header(story, test\_name, series\_no, p1\_sub)

    story.append(Paragraph(f'\<font name="{JP}"\>Word Bank から適切な単語を選び、空所に入れなさい。必要に応じて形を変えること。（各1点）\</font\>', s\_note))

    story.append(Spacer(1, 6))

    rng \= random.Random(seed if seed is not None else series\_no \* 7 \+ 3\)

    bank \= \[w for w, \*\_ in words\]

    rng.shuffle(bank)

    ncols \= 4

    rows \= \[bank\[i:i+ncols\] for i in range(0, len(bank), ncols)\]

    if rows and len(rows\[-1\]) \< ncols:

        rows\[-1\] \+= \[''\] \* (ncols \- len(rows\[-1\]))

    t \= Table(rows, colWidths=\[42\*mm\]\*ncols)

    t.setStyle(TableStyle(\[

        ('FONTNAME', (0,0), (-1,-1), 'DejaVu'),

        ('FONTSIZE', (0,0), (-1,-1), 9),

        ('TEXTCOLOR', (0,0), (-1,-1), INK),

        ('BACKGROUND', (0,0), (-1,-1), LIGHT),

        ('BOX', (0,0), (-1,-1), 1, BLUE),

        ('INNERGRID', (0,0), (-1,-1), 0.4, colors.HexColor('\#C9BCE8')),

        ('TOPPADDING', (0,0), (-1,-1), 4),

        ('BOTTOMPADDING', (0,0), (-1,-1), 4),

        ('LEFTPADDING', (0,0), (-1,-1), 6),

    \]))

    story.append(t)

    story.append(Spacer(1, 10))

    for i, (q, \_) in enumerate(fib, 1):

        story.append(Paragraph(f"{i}.  {q}", s\_q))

    story.append(PageBreak())

    p2\_sub \= "Test — Part 2: Sentence Writing（5問）"

    if pos\_label:

        p2\_sub \+= f"｜ {pos\_label}"

    header(story, test\_name, series\_no, p2\_sub)

    story.append(Paragraph(f'\<font name="{JP}"\>次の単語を使って、自分のオリジナルの英文を1文ずつ書きなさい。（各2点）\</font\>', s\_note))

    story.append(Spacer(1, 8))

    line \= '\_' \* 78

    for i, w in enumerate(sw\_words, 1):

        story.append(Paragraph(f'{i}.  \<b\>\<font color="\#2D3BE8"\>{w}\</font\>\</b\>', s\_body))

        story.append(Spacer(1, 6))

        story.append(Paragraph(f'\<font color="\#9A9ABF"\>{line}\</font\>', s\_body))

        story.append(Spacer(1, 4))

        story.append(Paragraph(f'\<font color="\#9A9ABF"\>{line}\</font\>', s\_body))

        story.append(Spacer(1, 10))

    story.append(Paragraph(f'\<font name="{JP}" size="9"\>得点：Part 1（　　/20）＋ Part 2（　　/10）＝ 合計（　　/30）\</font\>', s\_body))

    story.append(PageBreak())

    header(story, test\_name, series\_no, "Answer Key（解答）")

    story.append(Paragraph("\<b\>Part 1: Fill in the Blank\</b\>", s\_h))

    half \= (len(fib)+1)//2

    left \= \[f"{i}. {a}" for i, (\_, a) in enumerate(fib\[:half\], 1)\]

    right \= \[f"{i}. {a}" for i, (\_, a) in enumerate(fib\[half:\], half+1)\]

    while len(right) \< len(left): right.append('')

    t2 \= Table(list(zip(left, right)), colWidths=\[85\*mm, 85\*mm\])

    t2.setStyle(TableStyle(\[

        ('FONTNAME', (0,0), (-1,-1), 'DejaVu'),

        ('FONTSIZE', (0,0), (-1,-1), 9.5),

        ('TEXTCOLOR', (0,0), (-1,-1), INK),

        ('TOPPADDING', (0,0), (-1,-1), 3),

        ('BOTTOMPADDING', (0,0), (-1,-1), 3),

    \]))

    story.append(t2)

    if answer\_notes:

        story.append(Paragraph(f'\<font name="{JP}"\>※ {answer\_notes}\</font\>', s\_note))

    story.append(Spacer(1, 8))

    story.append(Paragraph(f"\<b\>Part 2: Sentence Writing\</b\> \<font name='{JP}' size='10'\>（解答例）\</font\>", s\_h))

    story.append(Paragraph(f'\<font name="{JP}"\>指定語が正しい形・意味で使われ、文法的に成立していれば正解。以下は一例。\</font\>', s\_note))

    story.append(Spacer(1, 4))

    for i, sample in enumerate(sw\_samples, 1):

        story.append(Paragraph(f"{i}. \<font name='DejaVu-I'\>{sample}\</font\>", s\_ans))

    doc \= SimpleDocTemplate(outpath, pagesize=A4,

                            topMargin=16\*mm, bottomMargin=20\*mm,

                            leftMargin=18\*mm, rightMargin=18\*mm,

                            title=f"OSH {test\_name} Series {series\_no}")

    doc.\_source\_note \= source\_note or ""

    doc.build(story, onFirstPage=\_footer, onLaterPages=\_footer)

### 5-3. データの書き方（1シリーズ分のテンプレート）

各シリーズは辞書で定義。`words`は (見出し語, IPA\[US\], 品詞, 英語定義, 日本語訳, 例文*語*) の6要素タプル×20。

SERIES \= {}

SERIES\[1\] \= dict(

    pos\_label="動詞 Verbs ①",   \# サブタイトルに出る品詞ラベル

    words=\[

        ("publish", "/ˈpʌb.lɪʃ/", "verb", "to make information or a book available to the public",

         "出版する、公表する", "The company will \<i\>publish\</i\> its annual report next week."),

        \# ... 20語

    \],

    fib=\[

        ("Please \_\_\_\_\_\_ us if your contact details change.", "notify"),

        \# ... 20問。解答が語形変化する場合は "commutes" のように変化形を書く。別解は "applicant / candidate"

    \],

    sw\_words=\["notify", "postpone", "obtain", "confirm", "relocate"\],  \# Part2の5語

    sw\_samples=\[   \# Part2解答例5文

        "Please notify me if the schedule changes.",

        \# ...

    \],

    answer\_notes="14 は三単現 commutes。",  \# 語形変化・別解の注釈（問番号を必ず入れる）

)

### 5-4. QA＋ビルドスクリプトのテンプレート

import sys

from generator import build\_series

\# from \<データファイル\> import SERIES を集約

SRC \= "Word selection based on the TOEIC Service List (Browne & Culligan, 2016, CC BY-SA 4.0)"

EXPECT\_POS \= {1:'verb',2:'verb',3:'noun',4:'noun',5:'adjective'}  \# 期待品詞

errors=\[\]; all\_words={}

for n,d in SERIES.items():

    words=d\['words'\]; fib=d\['fib'\]; hw=\[w\[0\] for w in words\]

    exp \= 20  \# 端数シリーズは実語数に

    if len(words)\!=exp: errors.append(f"S{n}:単語{len(words)}")

    if len(fib)\!=20: errors.append(f"S{n}:FIB{len(fib)}")

    if len(d\['sw\_words'\])\!=5 or len(d\['sw\_samples'\])\!=5: errors.append(f"S{n}:Part2数")

    if n in EXPECT\_POS:

        ps=set(w\[2\] for w in words)

        if ps\!={EXPECT\_POS\[n\]}: errors.append(f"S{n}:品詞不統一 {ps}")

    for w in hw:

        if w in all\_words: errors.append(f"重複:'{w}'(S{all\_words\[w\]}/S{n})")

        all\_words\[w\]=n

    for w in d\['sw\_words'\]:

        if w not in hw: errors.append(f"S{n}Part2:'{w}'リスト外")

    used=set()

    for q,a in fib:

        if '\_\_\_\_\_\_' not in q: errors.append(f"S{n}:空所なし")

        first=a.split('/')\[0\].strip()

        if first in hw: used.add(first)

        else:

            best=None

            for h in hw:

                if first.startswith(h\[:max(4,len(h)-2)\]) or h.startswith(first\[:max(4,len(first)-2)\]):

                    if best is None or len(h)\>len(best): best=h

            if best: used.add(best)

    if len(used)\<len(hw): errors.append(f"S{n}:FIB未使用 {set(hw)-used}")

    changed=\[(i,a.split('/')\[0\].strip()) for i,(q,a) in enumerate(fib,1) if a.split('/')\[0\].strip() not in hw\]

    notes=d.get('answer\_notes','')

    for i,form in changed:

        if str(i) not in notes and "特になし" not in notes:

            errors.append(f"S{n}:問{i}({form})語形変化だが注釈なし")

    for w,ipa,\*\_ in words:

        if 'ɒ' in ipa or 'ɜː' in ipa: errors.append(f"S{n}'{w}':UK式IPA {ipa}")

if errors:

    print("QA NG:"); \[print(" \-",e) for e in errors\]; sys.exit(1)

print(f"QA OK: 全{len(all\_words)}語ユニーク")

for n,d in SERIES.items():

    out=f"/mnt/user-data/outputs/TOEIC\_Series{n:02d}.pdf"

    build\_series("TOEIC 単語テスト", n, d\['words'\], d\['fib'\], d\['sw\_words'\], d\['sw\_samples'\],

                 out, answer\_notes=d.get('answer\_notes'), pos\_label=d\['pos\_label'\], source\_note=SRC)

    print("generated:", out)

### 5-5. 目視確認

from pdf2image import convert\_from\_path

imgs \= convert\_from\_path('/mnt/user-data/outputs/TOEIC\_Series01.pdf', dpi=72)

imgs\[0\].save('check.png')  \# viewツールで確認

---

## 6\. 出典フッターの文言（コピペ用）

- TOEIC: `Word selection based on the TOEIC Service List (Browne & Culligan, 2016, CC BY-SA 4.0)`  
- IELTS: `Word selection based on the New Academic Word List (Browne, Culligan & Phillips, 2013, CC BY-SA 4.0)`  
- 英検2級: `Word selection based on the New General Service List (Browne, Culligan & Phillips, 2013, CC BY-SA 4.0)`  
- Clacel 2.0: `Clacel Vocabulary List ｜ OSH 単語テスト`

---

## 7\. これまでの進捗（2026年時点）

| テスト種 | 完成状況 |
| :---- | :---- |
| TOEIC | Series 1〜5（100語）完成 |
| IELTS | Series 1〜5（100語）完成 |
| 英検2級 | Series 1〜5（100語）完成 |
| Clacel 2.0 CLACEL01 | Series 1（試作）のみ。残り Series 2〜8 |
| Clacel 2.0 CLACEL02 | Series 1〜8（152語）完成 |
| Clacel 2.0 CLACEL03（idiom） | 未着手。「語群＋和訳ヒントで空所補充」形式で作る予定 |

### 各テスト種の品詞構成（Series 1〜5、完成分）

- Series 1: 動詞① / Series 2: 動詞② / Series 3: 名詞① / Series 4: 名詞② / Series 5: 形容詞①

---

## 8\. 新しいClaudeへの依頼文（そのままコピペ用）

> 添付の「OSH\_単語テスト\_引き継ぎ資料.md」に沿って、単語テストPDFを作成してください。まず資料の「2. 単語の引っ張り方」に従い、コーパス頻度リスト（TSL/NAWL/NGSL）から該当レベル・品詞の語を選定します。仕様（20語＋Fill in blank 20問＋英作文5問＋解答、Cambridge US発音記号、品詞1シリーズ1種、出典フッター明記）と、資料内の generator.py・QAスクリプトのコードをそのまま使ってください。生成前に必ず自動QA（品詞統一・全語ユニーク・FIB網羅・語形変化注釈整合・UK式IPA混入チェック）を通し、生成後はPDFを画像化して目視確認してください。〈次に作りたいテスト種・シリーズをここに書く〉

---

以上。このファイル1つで、別のClaudeページでも同じ品質・同じ方法で継続できます。  
