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

未着手。方針: PDFにQR等は埋め込まず別ファイル配布。`say -v "Evan (Enhanced)"`（男性）／`say -v "Samantha (Enhanced)"`（女性）で生成予定。
