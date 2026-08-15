# OSH Vocabulary Test 制作進捗

## チェックポイント（2026-07-31時点のサマリー）

- **Clacel（CLACEL01+02+03）**: 完成。490語・25シリーズ、新フォーマット確定
- **TOEIC**: Series1〜12（240語）完成。残り約48シリーズ
- **IELTS**: Series1〜12（240語）完成。残り約33シリーズ
- **音声**: TOEIC Series1〜7（1週間分、140語）完成
- 量産は一旦保留し、TOEIC 1週間分（Series1〜7）のリスト・テスト・音声一式が試験運用可能な状態

## 音声生成（完了 2026-07-31、TOEIC Series1〜7）

- `scripts/audio_gen.py`新設。macOS `say`コマンドで男性Evan(Enhanced)・女性Samantha(Enhanced)の単語発音を生成、`output/audio/<test>/SeriesNN/<word>_m.m4a`・`_f.m4a`として保存
- **バグ発見・修正**: `say`コマンドがまれに（280回中2回）ハングし、タイムアウトなしだと処理全体が止まることが判明。`subprocess.run`に`timeout=10秒`を設定し、タイムアウト時は最大3回リトライする方式に変更（`_say_with_retry`）。既存ファイルはスキップする仕組みも追加し、再実行時の重複生成を防止
- TOEIC Series1〜7（140語×2声＝280ファイル）生成完了、全ファイル`afinfo`でサイズ・再生時間を確認済み、0バイトファイルなし
- **1週間分の試験運用素材が完成**: `output/pdf/TOEIC_S01〜07.pdf`（リスト＋テスト）＋`output/audio/toeic/Series01〜07/`（発音音声）

計画本体: `docs/plan.md`／引き継ぎ資料: `docs/OSH_単語テスト_引き継ぎ資料.md`

## 環境整備（完了 2026-07-29）

- `venv/` 作成、`reportlab`5.0.0・`pdf2image`導入済み（poppler/pdftoppmはHomebrewで導入済み）
- フォント: DejaVu Sans一式・IPAexゴシックをHomebrew（`font-dejavu`, `font-ipaexfont`）で導入し、`fonts/`にシンボリックリンク
- `scripts/generator.py`: 引き継ぎ資料のコードをこの環境向けに移植。**修正点1件**: フッター(`_footer`)が英語フォント(DejaVu)のままだと日本語（「単語テスト」「｜」）が表示されないバグを発見・修正（フッターのフォントをIPAゴシックに変更）
- 動作確認: 既存の完成PDF `/Users/tina/Desktop/単語テスト/単語テスト_Clacel2.0提案用/Clacel_02_Series01.pdf` から`pdftotext`でデータを復元し(`data/clacel_02.py`)、QA→PDF生成→画像化目視確認まで一通り成功

## 既存の完成済みPDF（新規発見）

`/Users/tina/Desktop/単語テスト/` 配下に、PDFとしては以下がすでに存在:
- `単語テスト_Clacel2.0提案用/`: Clacel_02 Series01〜08 → **全てPythonデータ化完了**（`data/clacel_02.py`＝S1、`data/clacel_02_s2_to_s8.py`＝S2〜8）。`pdftotext -layout`で1件ずつ復元し、QA・横断重複チェック・再生成PDFのテキスト突合で内容一致を確認済み
- `単語テスト_TOIEC提案用/`: TOEIC Series01〜05 → 未データ化（2周目を作る際に必要）
- `単語テスト_IELTS提案用/`: IELTS Series01〜05 → 未データ化（2周目を作る際に必要）
- `単語テスト_英検提案用/`: Eiken2 Series01〜05（今回スコープ外）

CLACEL02 Series8のみ12語（副詞・接続詞・前置詞、一部語がFIBで2問使われる）という特殊構成のため、QAスクリプトに`expected_fib_count`（単語数とFIB数を別々に指定できる項目）を追加して対応（`scripts/qa.py`）。

## テスト種別ステータス

| テスト種 | 1周目 完了シリーズ | 1周目 残り | 2周目以降 |
|---|---|---|---|
| Clacel CLACEL01(159語) | **Series1〜8 全完成**（作り直し込み） | なし | 未着手 |
| Clacel CLACEL02(152語) | **Series1〜8 全てPythonデータ化完了** | なし | 未着手 |
| Clacel CLACEL03(179語、6カテゴリ) | **Series1〜9 全完成**（動詞40・名詞20・形容詞20・副詞20・イディオム40・句動詞39） | なし | 未着手 |
| TOEIC(TSL, 1250語) | Series1〜12(240語) 新フォーマットで完成 | 残り約48シリーズ（約960語） | 未着手 |
| IELTS(NAWL, 963語) | Series1〜12(240語) 新フォーマットで完成 | 残り約33シリーズ（約660語） | 未着手 |

## CLACEL03 データ確定（完了 2026-07-30）

- 前置詞カテゴリ（until/by, between/among等の対比ペア）は**不使用と確定**（ユーザー指示）。除外して集計。
- 確定内訳: 動詞40・名詞20・形容詞20・副詞20・イディオム40・句動詞39 ＝ **合計179語**、カテゴリ間重複なし（`data/clacel_03_words.json`）
- 見出し語のクリーニング: `come up with~`→`come up with`／`be sick of~`→`sick of`／`to some (a certain) extent`→`to some extent`／`end up doing`→`end up`（末尾の〜やプレースホルダ表記を正式な見出し語に整形）
- シリーズ分割方針（カテゴリごとに20語区切り、TOEIC/IELTS同様「1シリーズ1品詞」を踏襲）: verb=S1-2、noun=S3、adjective=S4、adverb=S5、idiom=S6-7、phrasal_verb=S8-9(20+19)
- **CLACEL03 Series1〜9 完成**（`data/clacel_03_verb.py`・`_noun.py`・`_adjective.py`・`_adverb.py`・`_idiom.py`・`_phrasal.py`）。全179語・9シリーズでQA通過、PDF生成・目視確認済み。9シリーズ横断の重複チェックも通過
- **QAスクリプトを2件修正**（`scripts/qa.py`）:
  1. 単語1語の活用変化（pretend→pretended）しか想定していなかった「FIB解答→見出し語」の照合ロジックが、イディオムの過去形・語順変化（came up with→come up with等）で誤って「未使用」判定 → 複数語は語の重複数で判定する方式に変更
  2. 句動詞（S8-9）は"on/at/for/in/out/up"等の前置詞を共有する語が多く、語の重複数だけでは**誤った見出し語に紐付く**問題が発生（例: "arrived at"が"look at"に誤マッチ） → FIBデータに`(質問文, 解答, 見出し語ヒント)`の3要素目（省略可）を追加し、衝突しやすい句動詞・イディオムは明示的に紐付ける方式に変更。単語1語のシリーズ（動詞/名詞/形容詞/副詞）は2要素のままで従来通り動作
- CLACEL03元データの整理過程で不要になった試作ファイル（`clacel_03_pilot.py`等）は削除済み（Series6として正式化）

## CLACEL01 完成（完了 2026-07-30）

- 元CSV順のまま159語・全て動詞・8シリーズ（Series1〜7=20語×7、Series8=19語）で完成。`data/clacel_01.py`・`clacel_01_s2_s3.py`・`clacel_01_s4_s5.py`・`clacel_01_s6_s7.py`・`clacel_01_s8.py`
- 元CSVの47番目「servive」は「survive」の誤記と判断し訂正して収録
- Series1は資料上「試作」扱いだったが、本番品質（IPA・英語定義・和訳・例文・FIB20・Part2 5・Answer Key）で全面作り直し
- QAスクリプトをさらに2件強化（`scripts/qa.py`）:
  1. 不規則動詞マップ(`IRREGULAR_VERBS`)を語彙追加のたびに拡充（blow→blew、wake→woke、swing→swung、sink→sank、ring→rang、lose→lost、hang→hung 等）
  2. **-ing形の綴り変化に対応**: `face→facing`（語尾のeを落とす）、`die→dying`（ie→yの綴り変化）のように、単純な先頭一致では原形を復元できないケースがあったため、`_ing_base_candidates()`で語尾のe追加・ie→y逆変換・二重子音の候補を機械的に生成して照合する方式に変更

**Clacel（CLACEL01+02+03、合計490語）で1周目が全て完成**。次はTOEIC/IELTSの継続量産、または2周目（新規例文）の設計に進める状態。

## Word Listフォーマット刷新（完了 2026-07-30）

`Clacel_02_Series01_v2_確認用.pdf`をユーザーが「これが良い」と指定。旧フォーマット（英語定義＋日本語訳＋例文）から以下に変更（アイコンは工数の都合で不採用と決定済み）:
- 英語定義行を削除
- 見出し語の直後に活用形を明記（動詞: 3人称単数・過去形／名詞: 複数形（可算のみ）／形容詞・副詞・前置詞句等: 活用なし）
- 例文の日本語訳を追加
- `scripts/generator.py`: `words`タプルを6要素`(word, ipa, pos, en_def, ja, example)`→7要素`(word, ipa, pos, forms, ja, example, example_ja)`に変更。`POS_ABBR`で品詞を`(v.)`等に略記
- **既に完成していたClacel 490語（CLACEL01/02/03）も全て新フォーマットに作り直し済み**
  - CLACEL02: 8シリーズ全てに`_v2_確認用.pdf`が既に存在していたため、`pdftotext`で活用形・日本語訳を復元（新規翻訳作業は不要）。ただし**Series2のみv2版で"access"が削除され19語構成に変化**していたため、FIB・Answer Keyもv2の内容に合わせて更新
  - CLACEL01・CLACEL03: v2版PDFが存在しないため、活用形・例文の日本語訳を新規に作成（`scripts/upgrade_words.py`で既存の6要素タプルに新要素をマージ）
- TOEIC/IELTS(Series1〜5)にも`_v2_確認用.pdf`が既に存在することを確認済み。今後Series1〜5をこの新フォーマットで作り直す際は、CLACEL02同様`pdftotext`復元で対応可能（新規翻訳不要）

## Fill in the Blankページの再設計（完了 2026-07-30）

ユーザー提示のスクリーンショット（TOEIC想定のPractice画面）に合わせ、Test構成を全面的に簡素化。

- **FIB問題は手書きの別文ではなく、Word Listの例文をそのまま流用**（`<i>...</i>`で囲んだ見出し語部分を空所に置換）。ヒントは単語ではなく**日本語の意味**を各問の上に表示
- 空所は語の長さに関係ない固定幅（`_`×15）にして文字数バレを防止
- ページ見出しは「Practice（練習）｜ Word Listの例文で穴埋め（20問）｜ {品詞ラベル}｜ Series N」に変更
- **Part 2: Sentence Writing（英作文）は削除**。構成は「Word List → Practice(穴埋め20問) → Answer Key」の3部構成に
- `scripts/generator.py`の`build_series()`から`fib`/`sw_words`/`sw_samples`/`answer_notes`/`seed`引数を削除し、`words`だけから自動生成する方式に変更。`scripts/build.py`も追従
- **CLACEL02のみ判明した問題**: pdftotextで復元した例文には`<i>`タグ（穴埋め対象語の印）が一切残っていなかった（PDF内の書式情報はテキスト抽出で失われるため）。活用形リストと照合して対象語を自動検出し、151語全てに`<i>`タグを機械的に付与して解消（CLACEL01/03は自分で執筆した際に`<i>`タグ済みだったため対象外）
- Clacel全25シリーズを新構成で再生成済み

もともとのFIB文・英作文（Part2）・answer_notesのデータは各`data/*.py`に残したまま（未使用だが実害なし）。

## TOEIC/IELTS Series1〜5 復元（完了 2026-07-31）

- 既存の`TOEIC_Series0N_v2_確認用.pdf`・`IELTS_Series0N_v2_確認用.pdf`（各5本）から新フォーマットで復元。`data/toeic.py`・`data/ielts.py`
- **データ品質の修正**: 復元時にIPAのUK式混入（ɜː）を6+6語で発見・US式(ɝː)に訂正（confirm, reimburse, purchase, merger, permit, urgent / interpret, assert, conserve, convert, emerge, diverse）。引き継ぎ資料の「必ずUS発音」ルールに従い修正
- IELTS Series1の2語（interact→interacting、undergo→undergone）は活用形リストに-ing形・過去分詞が無く自動タグ付けできなかったため手動で`<i>`タグを付与
- **`scripts/qa.py`を全面簡略化**: Practiceページの穴埋めがWord Listの例文から自動生成される仕様になったため、旧`fib`/`sw_words`/`sw_samples`/`answer_notes`関連のチェック（不規則動詞マップ・見出し語マッチング等）を全て削除。代わりに「各例文に`<i>...</i>`が正確に1つあるか」を検査する項目を追加
- 残り: TOEIC約55シリーズ・IELTS約40シリーズ（合計約1900語）が未着手。1系列20語の選定＋IPA・定義・和訳・例文＋日本語訳の作成が必要

## 音声

方針: PDFにQR等は埋め込まず別ファイル配布。`say -v "Evan (Enhanced)"`（男性）／`say -v "Samantha (Enhanced)"`（女性）で生成。

## 8/18デモ準備（完了 2026-08-08、Clacel・IELTS Day1音声新規生成）

9/1ローンチに向けた8/18の運営メンバー確認会（TOEIC・Clacel・IELTSを3つ同時受験）向けに、1日分（各20語）の音声・リストを整備。

- **サイトDay1データとPDF Series1データの一致確認**: `gra-commu-vocab-test`本体（`quiz.html`＋`wordtests-*.js`）で既に稼働中のDay1語彙が、本プロジェクトのSeries1データと単語レベルで完全一致することを確認（Clacel Day1＝`data/clacel_02.py` Series1、TOEIC Day1＝`data/toeic.py` Series1、IELTS Day1＝`data/ielts.py` Series1）。サイト側データ改修は不要と判断。
- **Day1データのQA再検証**: `scripts/qa.py`の`run_qa()`をClacel/TOEIC/IELTSのDay1データに実行し、UK式IPA混入・単語数・`<i>`タグ数のエラー0件を確認（過去に指摘のあったUK式IPA混入の教訓を踏まえ、推測でなく実データで再検証）。
- **音声仕様を訂正（重要な仕様変更）**: これまで`scripts/audio_gen.py`は単語・例文・連続再生すべてで男女両方（Evan男性・Samantha女性）を生成していたが、正しい仕様は「英語（単語・例文・連続再生）は男性のみ、日本語→英語は日本語(Kyoko・女性)＋英語(Evan・男性)を結合した1本のみ」。`audio_gen.py`の4関数を修正し、女性版の重複生成をやめた。**TOEIC Series01（既存122ファイル）は旧仕様のまま変更していない**（ユーザー指示）。新規生成分（Clacel・IELTS）から新仕様を適用。
- **フォルダ命名を"Day"表記に統一（新規生成分のみ）**: サイトの"Day"表記に合わせ、Clacel・IELTSの音声フォルダは`output/audio/{clacel_02,ielts}/Day1/`とした（TOEICの既存`Series01〜07`はそのまま、リネームしていない）。
- Clacel Day1（`clacel_02` Series1・20語）・IELTS Day1（`ielts` Series1・20語）の音声を新規生成。各61ファイル（単語20＋jp2en20＋例文20＋連続再生1）、失敗0件。`afinfo`で0バイトファイル・破損なしを確認済み。
- 配布用に`scripts/build_drive_day_folder_clacel.py`・`build_drive_day_folder_ielts.py`を新規作成し、`output/audio_by_day/{clacel_02,ielts}/Day1/`に「単語（英語のみ）／日本語→英語（20語連続）／例文（20文）」の3フォルダ構成で整理済み。
- 単語リストPDFは3種ともSeries01が既に完成済み（`output/pdf/Clacel02_S01.pdf`・`TOEIC_S01.pdf`・`IELTS_S01.pdf`）のため追加作業なし。

**今後の学び（次回production時に反映）**:
1. 音声仕様は「英語は男性のみ・日本語→英語は日本語女性＋英語男性の1本のみ」が正。TOEIC Series01のみ旧仕様（男女両方）が残っているため、Week1全体をこの仕様に揃え直すかは別途判断が必要。
2. 音声フォルダ命名は今後"Day"表記に統一する方向。TOEIC Series01〜07を含めた全体リネームは未実施（将来的に判断）。

## PDFフォーマットのルール確定・8/18分再生成（完了 2026-08-10）

8/18デモ用PDF（`output/8月18日/`納品分）をユーザーが確認し、以下4点の修正指示。**その場で`scripts/generator.py`を修正し、Clacel02/TOEIC/IELTSのDay1（Series1）PDFを再生成・`output/8月18日/`にも反映済み**（他のシリーズ・Day2以降は未着手）:

1. **IPAの`/e/`→`/ɛ/`変換**: DRESS母音の`/e/`は全て`/ɛ/`に変更する。**`/eɪ/`（二重母音）は対象外・変更しない**（例: `pretend /prɪˈtend/`→`/prɪˈtɛnd/`、`make /meɪk/`はそのまま）。`generator.py`に`_fix_ipa()`（正規表現`e(?!ɪ)`→`ɛ`）を新設し、Word List・Answer Keyの両方でIPA表示時に自動適用する方式にした（**データファイル自体（`data/*.py`）の`/e/`表記は書き換えていない**。表示時に自動変換されるため、今後どのシリーズを生成してもこのルールが自動的に効く）。
2. **Practiceの設問順をランダム化**: 実装済み（`random.Random(series_no).shuffle`）。
3. **Answer Keyに発音記号を追加**: `generator.py`のAnswer Key生成部を修正し、各解答の後ろに`_fix_ipa()`適用済みIPAを併記するようにした。
4. **PDF内の"Series"表記を"Day"に統一**: 実装済み。

**確認事項**: 2・4は8/5の`generator.py`更新で既にコード実装済みだったが、既存の`output/pdf/*.pdf`（8/18納品分含む）が8/5より前のビルドで未反映だっただけと判明。今回1・3を新規実装した上で、Clacel02_S01・TOEIC_S01・IELTS_S01の3ファイルを`venv/bin/python3`で再生成し、`pdftotext`で4点とも反映されていることを目視確認、`output/8月18日/`の該当PDFも差し替え済み。

**残課題**: 他の全シリーズ（Clacel01/02/03残り・TOEIC/IELTS Series2〜12）はこのルールで未再生成。次にそれらを触る/配布する際は、この`generator.py`の新版で再ビルドし直す必要がある。

## Practice問題の活用形比率ルール（確定・8/18分にも適用完了 2026-08-10）

- FIB問題の解答（例文の`<i>...</i>`部分）は**原型4割・活用形6割**程度の比率にする。**Day2以降・2周目の新規例文執筆でも継続して適用するルール**。
- 2026-08-10実測（対応前、原型に偏りすぎと判明）: Clacel02 Day1＝原型80%・活用形20%、TOEIC Day1＝原型95%・活用形5%、IELTS Day1＝原型50%・活用形50%
- **8/18分も作り直し済み**: ユーザー指示により、Clacel02/TOEIC/IELTSのDay1それぞれ原型のままだった単語を選び、`data/clacel_02.py`（8語）・`data/toeic.py`（11語）・`data/ielts.py`（2語）の該当エントリの`example`/`example_ja`を活用形を使った新しい例文に書き換え（`forms`フィールドに記載済みの活用形と一致させて執筆）。結果、3種とも**原型8/活用形12（40%/60%）**にちょうど揃った。QA（`run_qa`）はエラー0件。
- 例文変更に伴い、影響する単語の**例文音声（`_sentence_m.m4a`）も再生成**: Clacel/IELTSは`output/audio/{clacel_02,ielts}/Day1/`内の該当ファイルを削除後`generate_sentence_audio`で再生成（誤って`Series01`フォルダが新規作成されたため`Day1`へ統合し直した）。TOEICは既存の男女両声規約に合わせ、11語分を男女両方`output/audio/toeic/Series01/`に直接再生成。配布用の連結音声（`output/audio_by_day/{clacel_02,toeic,ielts}/Day1/例文（20文）/Day1_sentences_m.m4a`）も全て再生成し、`output/8月18日/`納品分にも反映済み。
- この比率は`data/*.py`の`example`フィールド（`<i>`タグで囲む語形）を書く時点で決まるため、**新規に例文を執筆する際に三単現・過去形・複数形・進行形などの活用形を積極的に使うこと**。コード側の自動判定ではなく執筆時の意識ルール。必要なら`scripts/qa.py`に比率チェックを追加することも将来的に検討可。

## PDF左上バッジを「8/18」表記に変更（完了 2026-08-10）

PDF左上の青い「Day1」バッジ（`generator.py`の`_footer`が描画するもの。ヘッダー内の「— Day 1」小見出しとは別物）を、8/18デモ用の3PDFのみ「8/18」に変更。`build_series()`に`day_label`引数を追加し、明示的に渡した場合は自動計算（`DayN`）より優先されるようにした。`output/8月18日/`納品分にも反映済み。

## 意味欄の冗長なカタカナ表記を削除（完了 2026-08-10、8/18分以外の既存データ）

8/18分（Clacel02/TOEIC/IELTS Day1）は対象外（ユーザー確認済みで問題なし）。それ以外の既存データ全体（Clacel01/02/03・TOEIC全series）を機械的にスキャンし、`jp`（意味）欄に「見出し語のカタカナ発音表記」と「実質同じ意味の日本語訳」が重複して両方書かれている12件を発見・修正（カタカナ表記のみ削除、日本語訳を残す）:

- `data/clacel_01_s4_s5.py`（Series5）: fit「合う、フィットする」→「合う」
- `data/clacel_02.py`: cancel（S2）「中止する、キャンセルする」→「中止する」／version（S3）「版、バージョン」→「版」／presentation（S4）「発表、プレゼン」→「発表」／professional（S5）「プロの、専門的な」→「専門的な」／roast（S5）「焼いた、ローストした」→「焼いた」
- `data/toeic.py`（Series3〜4）: seminar「セミナー、研修会」→「研修会」／feedback「意見、フィードバック」→「意見」／schedule「予定、スケジュール」→「予定」
- `data/toeic_s9_s10.py`（Series9〜10）: workshop「研修会、ワークショップ」→「研修会」／cabinet「キャビネット、戸棚」→「戸棚」／cabin「客室、キャビン」→「客室」

**意図的に残したもの**: カタカナが日本語で既に標準・定番の訳語になっているもの（energy＝エネルギー、infrastructure＝インフラ、category＝カテゴリー、dilemma＝ジレンマ、memo＝メモ等）や、カタカナ側が見出し語の別の意味を表しているもの（knock＝ノックする[ドアを]／ぶつける、surf＝サーフィンする／ネットを見て回る、check out＝確認する／チェックアウトする、subscription＝定期購読／サブスクリプション[デジタル配信]）は、削除すると情報が失われるか誤りになるため意図的に残した。

**残課題**: 修正した12語を含むPDF（Clacel01_S05・Clacel02_S02〜05・TOEIC_S03〜04・TOEIC_S09〜10）は未再生成。次にこれらのシリーズを配布する際は`generator.py`で再ビルドが必要。

## 時制が曖昧な例文の禁止ルール確定・8/18分修正完了（完了 2026-08-11）

サイト側のTOEIC単語テストで「instructed/diagnosed/compiledの例文に時制を示す語がなく、三単現でも文法的に成立してしまう」という指摘を受け、ユーザーから**今後絶対にこの種の文を作らない**という絶対ルールが示された。

- **判定方法**: 空所に入れる語の時制を入れ替えて（過去形↔現在形）、他の語はそのままで読む。入れ替えた文も完全に自然で成立するならNG。曖昧さを解消する型は、明確な時の副詞（yesterday/last week等）・頻度副詞（usually/currently/these days等）・法助動詞+原形（will/can等）・不定詞や命令文で原形が強制される形・受動態の助動詞が`<i>`タグ外にある形、のいずれか。
- **8/18分を総点検・修正**: Clacel02/TOEIC/IELTSのDay1（PDF版`data/*.py`）とサイト版`wordtests-*.js`の両方を1文ずつ点検し、該当19件（PDF側15件・サイト側8件、重複含む）を修正。`data/clacel_02.py`（8語）・`data/toeic.py`（7語、既出の5語修正と別）・`data/ielts.py`（4語）、および`wordtests-toeic.js`（2問）・`wordtests-clacel.js`（3問）・`wordtests-ielts.js`（3問）。QA（`run_qa`・`validate-wordtests.js`）・サイトの統合テスト（`scripts/test-quiz-flow.js`）は全てエラー0件/PASSを確認。
- 変更に伴い、該当語の例文音声（`_sentence_m/_f.m4a`）と配布用連結音声（`Day1_sentences_m.m4a`）を再生成し、`output/8月18日/`納品分・`output/pdf/`・サイト（Railway本番）すべてに反映済み。
- **今後のルール**: Day2以降・2周目の新規例文執筆時も、書いた直後に上記の時制入れ替えテストを毎回行う。QAスクリプトでの自動検出は未実装（文法的曖昧性の機械判定は困難なため、執筆時の手動チェックが唯一の防御線）。
- **8/18分の追加修正（2026-08-12）**: recognize（Clacel、ユーザー指定の新例文「Yesterday, he recognized an old classmate of his on the street.」に差し替え、時制の手がかりも追加）／depict・assert・accumulate（IELTS、"currently"がシリーズ内で7回重複していたため"still"/"to this day"/"even now"に差し替えて表現を分散、PDF・サイト両方）。

## Answer KeyのIPAを解答の活用形基準に修正（完了 2026-08-12）

Answer Key（解答一覧）が、FIB解答（例文の`<i>...</i>`部分＝活用形。例: "compiled"）に対して**見出し語（原形、例: compile）のIPAをそのまま流用していた**バグを発見（ユーザー指摘）。「解答の発音記号は活用された形の発音記号にすべき」との指示を受け修正。

- `scripts/generator.py`に`_answer_ipa(base_word, base_ipa, answer_word)`を新設。規則活用（-s/-es・-ed/-d・-ing）は英語の音韻規則（無声子音の後は/s//t/、有声・母音の後は/z//d/、歯擦音・/t//d/の後は/ɪz//ɪd/というルール）から自動導出し、不規則活用は`IRREGULAR_ANSWER_IPA`辞書（`(見出し語, 活用形): IPA`）で明示的に管理。規則からもIRREGULAR辞書からも導出できない場合は`ValueError`で確実に気づける設計（黙って誤ったIPAを出さない）。
- Answer Key生成部（`answers.append(...)`）を`_answer_ipa()`経由に変更。
- 8/18分（Clacel02/TOEIC/IELTS Day1）の活用形36件を全て自動生成→ネイティブ視点で1件ずつ手動検証。**バグを1件発見**: "published"が無声子音/ʃ/の後なのに規則実装漏れで/d/になっていた（正しくは/t/）→ `_VOICELESS_ENDINGS_FOR_ED`に`s/ʃ/tʃ`を追加して修正。不規則活用2件（stand→stood /stʊd/、undergo→undergone /ˌʌn.dɚˈɡɔːn/）は`IRREGULAR_ANSWER_IPA`に手動登録。
- **既存の他シリーズへの影響を事前点検**: 新しい`_answer_ipa()`は全シリーズのAnswer Key生成で使われるため、Clacel01・Clacel03（idiom/phrasal含む）に存在する不規則動詞（grow/bite/blow/rise/throw/lay/lose/ring/pay/swing/sink/hang/freeze/lie等）や複数語のイディオム・句動詞（例: "come up with"→"came up with"）は、現時点で`IRREGULAR_ANSWER_IPA`未登録のため**それらのシリーズを次に再ビルドする際は`ValueError`で止まる**（意図した安全装置）。再ビルドする際は該当語のIPAを辞書に追加すること。8/18分（Day1×3）には該当なし、QA・再ビルドとも問題なし。
- **今後のルール**: 新しい例文を書き、活用形を`<i>`タグで囲む際は、Answer Keyに出るIPAが自動生成（規則活用）か`IRREGULAR_ANSWER_IPA`登録（不規則活用）のどちらかでカバーされることを`build_series()`実行時に確認する（`ValueError`が出たらそこで発音記号を追記する）。

**追加修正（2026-08-12、ユーザー指摘）**: `_answer_ipa()`の音節表記が不完全だった点を修正。
- `/ɪz/`・`/ɪd/`・`/ɪŋ/`は新しい音節を作るため、直前に音節区切りの`.`を必ず挿入する（例: supervises /ˈsuː.pɚ.vaɪz.ɪz/）
- 語末の`/t/`が母音の直後（intervocalic）なら新音節の前でフラップ化`t̬`する（既存のnotify /ˈnoʊ.t̬ə.faɪ/等の表記慣習に合わせる。例: interpreted /ɪnˈtɝː.prət̬.ɪd/、manipulated /...leɪt̬.ɪd/）。子音直後の/t/（interact等）はフラップしない。`/d/`語末はフラップしても表記変更なし
- 単音節で強勢記号のない見出し語（waste /weɪst/等）に音節が増える時は先頭に`ˈ`を補う（wasted /ˈweɪst.ɪd/）
- `undergone`のIPAを/ˌʌn.dɚˈɡɔːn/→/ˌʌn.dɚˈɡɑːn/に訂正（辞書全体の/ɑː/表記慣習に統一）
- 8/18分（Day1×3）を再生成し、ユーザー提示の8例全てと一致することを確認済み。

## 9月本番用「1ヶ月分」Clacel PDF一括生成（完了 2026-08-15）

9月ローンチの実運用フォーマットが確定: **週7日のうち6日を新規20語、7日目は新規リストなしで前6日分（120語）からランダム出題する復習日**。これを4週＝28日で1ヶ月分とする。7日目（Day7/14/21/28）はユーザー指示によりPDF作成不要（当面スコープ外）。今回は**PDFのみ作成、サイト`wordtests-*.js`反映・音声生成は対象外**（Clacel Day1は例外、後述）。

- **語の意味の使い分けルール（新規確定）**: 見出し語に複数の意味がある場合、できるだけ**難易度の高い方（後半に書かれることが多い意味）で例文を作成する**。理由: 見出し語自体が基礎単語（例: stand）の場合、簡単な方の意味（立つ）で例文を作っても学習価値がない。既存データ全体（Clacel 490語）を機械的に走査し、`ja`欄が複数意味を持つ235語のうち、見出し語が基礎語かつ簡単な意味の例文になっている明確な該当ケースを目視で洗い出し、以下5語を修正: **stand**（立つ→耐える、`data/clacel_02.py` S1）・**leave**（去る→置き忘れる、同S1）・**cover**（覆う→話題を扱う、同S1）・**drop**（落とす→やめる、`data/clacel_01_s4_s5.py` S4）・**press**（押す→迫る、同S5）。他の230語は「両義とも同程度の難易度」「idiom/句動詞で元々難しい意味しか採用していない」等の理由で意図的に据え置き（全件の詳細判断ログはセッション内のみ、再現には同様の目視判定が必要）。
- **stand/leave/coverは既に8/18納品済み・サイト反映済みDay1の一部**だったため、PDF（`output/pdf/Clacel02_S01.pdf`・`output/8月18日/Clacel_8月18日.pdf`）と例文音声（`output/audio/clacel_02/Day1/{stand,leave,cover}_sentence_m.m4a`、および連結音声`Day1_sentences_m.m4a`、8/18納品フォルダの複製分含む）を再生成・差し替え済み。**サイト側`wordtests-clacel.js`のstandは元々「耐える」で正しかった（PDF側だけがズレていた）ため変更不要**、leave/coverはサイト側データが別物（未確認、必要なら別途点検）。drop/pressは未公開の新規Day（Day13/15）向けなので音声・サイトは元々未生成、データ修正のみで完結。
- **leaveの活用形IPAを新規登録**: `left`が不規則活用のため`scripts/generator.py`の`IRREGULAR_ANSWER_IPA`に`('leave','left'): '/lɛft/'`を追加。
- **Day番号マッピングを確定**（7/14/21/28は復習日で欠番。既存の全25シリーズのうちCLACEL03句動詞Series9（19語、ask for/stand by等）は今回のみ収録せず来月以降の予備として保留）:

  | Day | 内容 | Day | 内容 | Day | 内容 | Day | 内容 |
  |---|---|---|---|---|---|---|---|
  | 1 | CLACEL02 S1 | 8 | CLACEL02 S7 | 15 | CLACEL01 S5 | 22 | CLACEL03 noun S3 |
  | 2 | CLACEL02 S2 | 9 | CLACEL02 S8(12語) | 16 | CLACEL01 S6 | 23 | CLACEL03 adjective S4 |
  | 3 | CLACEL02 S3 | 10 | CLACEL01 S1 | 17 | CLACEL01 S7 | 24 | CLACEL03 adverb S5 |
  | 4 | CLACEL02 S4 | 11 | CLACEL01 S2 | 18 | CLACEL01 S8(19語) | 25 | CLACEL03 idiom S6 |
  | 5 | CLACEL02 S5 | 12 | CLACEL01 S3 | 19 | CLACEL03 verb S1 | 26 | CLACEL03 idiom S7 |
  | 6 | CLACEL02 S6 | 13 | CLACEL01 S4 | 20 | CLACEL03 verb S2 | 27 | CLACEL03 phrasal S8 |

- **不規則活用IPAの一括登録**: CLACEL01・03を`generator.py`現行版（8/10確定のIPA/ɛ/変換・Answer Key IPA併記等）で再ビルドしたところ、`_answer_ipa()`が未登録の不規則活用41件（単語12件＋イディオム/句動詞の複合語29件）で`ValueError`（progress.mdの「残課題」節で予告されていた事象）。全件を`IRREGULAR_ANSWER_IPA`に追加して解消（例: `('come up with','came up with'): '/keɪm ʌp wɪð/'`のように、複合語は変化する語のみ差し替えたIPAを手動構成）。
- **QA結果**: `scripts/qa.py`の`run_qa()`は全シリーズ0件エラー。24日分×横断で見出し語の重複チェックも実施し、470語全てユニークであることを確認（`stand`等5語の例文変更後に再検証）。
- **出力先**: `output/2026-09_Month1/Clacel/Day01.pdf`〜`Day27.pdf`（Day7/14/21/28は欠番、24ファイル）。
- **未対応・次回への申し送り**:
  1. CLACEL01・03（Day2〜27の大半）は「原型4割・活用形6割」の比率ルール（8/18分にのみ適用済み）を再適用していない。必要なら`data/*.py`の例文を書き直して比率調整する追加作業が要る。
  2. サイト`wordtests-*.js`への反映・音声生成は今回スコープ外（ユーザー指示により未着手）。
  3. 保留にしたCLACEL03句動詞Series9（19語）の扱いは次回判断待ち。
  4. TOEIC・IELTSは同じ「1ヶ月分・週6日+復習」構成でこれから着手。現状PDF化済みなのはSeries1〜12（各240語）のみで、1ヶ月24日分（480語）に対し各12シリーズ（240語）が新規語選定・執筆待ち。

## TOEIC 新規Series13〜18（新規120語・Day15〜20）完成（完了 2026-08-15）

Clacelに続き、TOEICも1ヶ月分（Day1〜6,8〜13,15〜20,22〜27）の構築を開始。既存Series1〜12（240語）は現行`generator.py`で再ビルドし`output/2026-09_Month1/TOEIC/Day01〜13.pdf`に出力（Day7/14は復習日で欠番）。**新規Series13〜18（120語、Day15〜20）を新規執筆**し`output/2026-09_Month1/TOEIC/Day15〜20.pdf`を生成。

- **品詞ローテーションは既存Series1〜12と同じパターンを継続**（ユーザー確認済み）: Series13=動詞⑤、14=動詞⑥、15=名詞⑤、16=名詞⑥、17=形容詞③、18=副詞③。
- **語選定**: TSL（TOEIC Service List）のfrequency-ranked CSV（`newgeneralservicelist.com`経由、squarespace CDN上の実データ）をWebFetchでrank260〜950程度まで取得し、既存240語と重複しない語をビジネス文脈で選定。データファイル: `data/toeic_s13_to_s18.py`（新規作成）。
- **重複チェック**: 新120語内・既存240語との横断とも実施。初回チェックで`cater`・`omit`が既存240語と重複していたため`disrupt`・`convey`に差し替え済み。最終的に18シリーズ横断で360語全てユニークを確認。
- **原型/活用形比率（40%/60%ルール）は動詞シリーズ（13・14）のみに適用**（ユーザー確認済み、名詞・形容詞・副詞は活用の概念がないため対象外）。Series13=原型8/活用形12、Series14=原型8/活用形12で確定。
- **新規不規則活用IPA**: `('mislead','misled'): '/mɪsˈlɛd/'`を`IRREGULAR_ANSWER_IPA`に追加。
- QA (`run_qa`)は0件エラー。PDFはpdftotextで目視確認済み。
- **残り**: TOEIC月1分の最後の6シリーズ（Series19〜24、Day22〜27）が未着手。完了後にIELTSへ着手予定。

## 時制曖昧文の全件監査・修正（完了 2026-08-15）

ユーザーから「これまでのフィードバック（三単現・時制曖昧文・発音記号の修正等）が今回の1ヶ月分ビルドに反映されているか確認してほしい」との依頼を受け監査した結果、**「時制が曖昧な例文を作らない」ルールは、これまでClacel02 Day1・TOEIC Day1・IELTS Day1の3シリーズにしか適用されておらず、Clacel01全部・Clacel03動詞シリーズ・TOEIC Series2〜12（8/11のルール確定前に執筆）は一度もチェックされていなかった**ことが判明。今回の月1分ビルドでこれらを丸ごと再利用したため、まとめて監査・修正した。

- 機械的スキャン（`<i>`タグの答えの前後に時制を確定させる語―yesterday/last week/currently/usually/モーダル・不定詞・命令文・受動態助動詞タグ外等―があるか）で候補を洗い出し、誤検出（"Would you mind"のような倒置疑問文、"spent all day V-ing"のような強制ジェランド、"before/when/than she 過去形〜"で時制が固定される文等）を1件ずつ人手で判別した上で、**実際に修正が必要だった約80件**（clacel_01全ファイル・clacel_02残り2語・clacel_03_verb・toeic.py/toeic_s7.py/toeic_s8.pyの一部）に明確な時・頻度マーカー（Yesterday,/Last week,/These days,/Currently,等）を追加。日本語訳も対応して修正。
- 修正後に同じスキャンを再実行し、残った8件は全て「grew...as the weeks passed」「Does Friday afternoon suit you」のように前後の語で時制がロックされている真の安全パターンであることを人手で確認し、意図的に未修正のまま残した（過剰修正を避けるため）。
- QA (`run_qa`)は全ファイル0エラー。Clacel24日分・TOEIC Day1〜13を全て再ビルド。Day1（Clacel02 Series1、8/18納品分）はcover/botherの文面が変わったため、`output/pdf/Clacel02_S01.pdf`・`output/8月18日/`納品分・該当例文音声・連結音声も再生成し反映済み。
- **今後の教訓**: 新規に例文を書く時だけでなく、**既存の古い例文を新しい用途（別Day番号での再利用等）に転用する際も、転用前に必ずこの時制曖昧チェックを行うこと**。今回のように「昔書かれた例文を検証なしに再利用する」ことが抜け漏れの原因になった。

## TOEIC「1ヶ月分」完成（完了 2026-08-15）

新規Series19〜24（動詞⑦⑧・名詞⑦⑧・形容詞④・副詞④、120語、Day22〜27）を新規執筆し、**TOEIC1ヶ月分（Day1〜27、Day7/14/21/28欠番、24日480語）が完成**。データは`data/toeic_s19_to_s24.py`。

- 語選定はTSL頻度ランク約800〜1250から選定（`newgeneralservicelist.com`経由のCSVを追加取得）。
- **今回は執筆時点から時制曖昧チェック・40%/60%比率（動詞シリーズのみ）を適用**したため、事後の一括監査で新規追加分は0件の指摘（Series13〜18で見つかった反省を活かした）。
- 不規則活用IPA1件（`('overpay','overpaid'): '/ˌoʊ.vɚˈpeɪd/'`）を新規登録。
- QA0エラー、TOEIC全24シリーズ横断で480語ユニークを確認。
- 出力: `output/2026-09_Month1/TOEIC/Day01〜27.pdf`（24ファイル）。
## IELTS「1ヶ月分」完成・Clacel/TOEIC/IELTS全3種が完成（完了 2026-08-15）

既存Series1〜12（240語）を再監査したところ、TOEIC/Clacelと同様に**時制曖昧文が28件見つかり**、修正してからDay1〜13を再ビルド（Day1＝Series1の`derive`修正分は8/18納品分の`output/pdf/IELTS_S01.pdf`・`output/8月18日/`・音声にも反映済み）。既存データのカタカナ表記も点検し、問題なし（`dilemma/infrastructure/category`等は既存の「keep」方針通り）。

新規Series13〜24（動詞⑤⑥⑦⑧・名詞⑤⑥⑦⑧・形容詞⑤⑥・副詞⑤⑥、240語、Day15〜20・Day22〜27）をNAWL（New Academic Word List）から新規執筆。データは`data/ielts_s13_to_s24.py`。

- 語選定はeapfoundation.comのNAWL一覧（A〜Z全体）を取得し、既存240語と重複しない学術語を選定。副詞はNAWL単体でのストックが少なく、moreover/furthermore/nevertheless等の一般的なアカデミック接続副詞で補完（プロジェクトの既定方針＝リストが尽きた場合はClaudeの知識で補うに準拠）。
- 執筆時点から時制曖昧チェック・40%/60%比率（動詞シリーズのみ）・カタカナ重複回避を適用し、事後監査で新規分は0件指摘。
- 語の重複チェックで`execute/manipulate/interfere/discriminate`が既存240語と衝突していることが判明し、都度`precipitate/oxidize/validate`等に差し替え。最終的に24シリーズ横断で480語ユニークを確認。
- QA0エラー、不規則活用IPAの追加登録は不要（該当なし）。
- 出力: `output/2026-09_Month1/IELTS/Day01〜27.pdf`（24ファイル）。

**これでClacel・TOEIC・IELTSの「9月1ヶ月分」PDF（各24日、計1430語）が全て完成**。

## 9月30日分の不足を解消（完了 2026-08-15）

ユーザーから「9月は30日まであるが足りているか」との指摘を受け確認したところ、Day1〜27（Day7/14/21/28欠番）は9/1〜9/28分までしかカバーしておらず、**Day29・Day30（9/29・9/30）が3種とも不足**していることが判明。以下の通り補完した:

- **Clacel Day29**: 保留していたCLACEL03句動詞Series9（19語）を採用。時制曖昧文チェックは未実施だったため今回実施し5件修正（pass by/take out/come out/grow up/break upに時マーカー追加）。
- **Clacel Day30**: 新規語が尽きたため、CLACEL02 Series1（Day1）と同じ20語に対して**全く新しい例文を書き下ろす「2周目」方式**で補完（`data/clacel_02_s1_round2.py`）。stand/leave/coverは意味の使い分けルール（難しい方の意味）も継続適用。不規則活用IPA2件（dig→dug、draw→drawn）を新規登録。
- **TOEIC Day29・Day30**: TSL（1250語）を使い切ったため、Series1・Series2（各20語）に2周目の新規例文をつけて補完（`data/toeic_round2_day29_30.py`）。
- **IELTS Day29・Day30**: NAWLストックが不足したため、Series1・Series2（各20語）に2周目の新規例文をつけて補完（`data/ielts_round2_day29_30.py`）。
- 全て執筆時点から時制曖昧チェック・40%/60%比率（動詞のみ）を適用し、QA0エラー。
- 出力: `output/2026-09_Month1/{Clacel,TOEIC,IELTS}/Day29.pdf`・`Day30.pdf`。**これで3種ともDay1〜30（Day7/14/21/28欠番、各26ファイル）＝9月全30日分が完成**。

**今後の教訓**: 各テスト種の手持ち語彙（Clacel490語・TSL1250語・NAWL実質使用可能語数）は、想定より早く「1ヶ月分＋α」で尽きる規模だった。

## 修正: 2周目方式はClacelのみ、TOEIC/IELTSは新規語を継続（完了 2026-08-15）

ユーザーから「2周目方式（既存語に新例文）はClacelにしか使わないでほしい。TOEIC/IELTSは（復習日以外）3ヶ月分は新しい単語でやりたい」との指示を受け、上記で作ったTOEIC/IELTSのDay29・Day30の2周目版（`data/toeic_round2_day29_30.py`・`data/ielts_round2_day29_30.py`）を破棄し、**新規語で作り直した**。

- TOEIC: TSL（1250語）をほぼ使い切ったため、一般的なビジネス頻出動詞40語（acknowledge/announce/appoint等）で新規Series25・26を作成（`data/toeic_s25_s26.py`）。重複チェックで2件（revise/resolve）が既存520語中と衝突していたためsponsor/withdrawに差し替え。
- IELTS: NAWLの実質使用可能語も枯渇したため、一般的な学術頻出動詞40語（postulate/stipulate/substantiate等）で新規Series25・26を作成（`data/ielts_s25_s26.py`）。
- 両方とも執筆時点から時制曖昧チェック・40%/60%比率を適用し、QA0エラー、重複0件（TOEIC・IELTSとも520語ユニーク）。
- `output/2026-09_Month1/{TOEIC,IELTS}/Day29.pdf`・`Day30.pdf`を新規語版で再生成済み。
- **Clacel Day30（`data/clacel_02_s1_round2.py`）はユーザー承認済みのため変更なし**。2周目方式は今後もClacelのみに適用する。
- **今後の方針**: TOEIC/IELTSは3ヶ月（復習日除く約78日）分を新規語で継続する必要があるが、TSL(1250語)・NAWL(963語)の公式リストは共に3ヶ月分（約1560語×2種）に遠く届かないため、公式リストを超えた一般的な頻出語（ビジネス英語・学術英語）を今後も併用する前提で進める。

次はユーザー指示により、サイト（`wordtests-*.js`）の設問に例文の日本語訳全文を追加する対応（`osh-vocab-test-plan`メモリの保留タスク参照）。

## サイト対応: 答え合わせ画面に例文の日本語訳全文を追加（完了 2026-08-15、リポジトリルート側の作業）

サイト（`gra-commu-vocab-test`本体、`wordtests-*.js`）の答え合わせ画面が単語の意味（`ja`欄）のみ表示していたため、各設問に新規`sentenceJa`欄（例文の日本語訳全文）を追加し、英文の下に表示するようにした。

- **データ移行**: PDF側`osh-vocab-test/data/*.py`の`example_ja`（既に翻訳済み）を、サイト側の各設問と英文テキストで突き合わせて一括移植。Clacel151問・TOEIC140問・IELTS100問、全391問中の大半（349問）はPDF側と英文が完全一致し直接コピー、残りはサイト側だけの独自例文だったため個別に翻訳した。
- **重要な副産物の発見**: 突き合わせの過程で、**サイト側にPDF側では既に修正済みだった時制曖昧文が18件残っていた**ことが判明（Clacel1件・TOEIC8件・IELTS9件。例: `wordtests-ielts.js`のclassify/convert/estimate/evaluate/demonstrate/acquire/assess/reinforce/deriveなど）。これらはPDF側の監査・修正時にサイト側への反映が漏れていたもの。今回`sentenceJa`追加と同時に英文もPDF側の修正版に同期し、まとめて解消した。
- **実装箇所**:
  - `wordtests-clacel.js`・`wordtests-toeic.js`・`wordtests-ielts.js`: 全設問に`sentenceJa`フィールドを追加（時制修正が入ったものは`sentence`も更新）
  - `server.js`: `quizSanitizedQuestions`は変更不要（既にitemsをそのまま使う設計）。結果配信の`review`マッピングに`sentenceJa`を追加。管理画面保存用の`validateWordtestsData`・`serializeWordtestsFile`にも`sentenceJa`の必須化・シリアライズを追加（**追加しないと管理画面で保存した瞬間に消えるバグを防止**）
  - `public/quiz.html`: 答え合わせ画面（`renderResults`）で英文の下に`sentenceJa`を表示
  - `public/admin-words.html`: 編集画面に`sentenceJa`列を追加（CSS grid・入力欄・新規行のデフォルト値）
- **検証**: `node scripts/validate-wordtests.js`（3ファイルともOK）、`node scripts/test-quiz-flow.js`（サーバー起動〜複数人プレイ〜結果発表までの20項目、全てPASS）。
- **未実施**: 本番反映には`railway up`が必要（[[deploy-requires-railway-up]]）。コード変更のみでまだデプロイしていない。
