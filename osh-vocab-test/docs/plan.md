# OSH Vocabulary Test（Clacel / TOEIC / IELTS）PDF＋音声 制作計画

## Context

9月ローンチの「コミュニティー単語テスト」（1日20語・半年間毎日実施）向けに、Clacel / TOEIC / IELTSの3種（英検2級は対象外）のPDF単語テスト教材を作成する。既存の引き継ぎ資料 `/Users/tina/Downloads/OSH_単語テスト_引き継ぎ資料.md` に仕様・実績があるが、今回の調査で以下が判明し、当初想定と進め方を変える必要がある。

- **Clacel・TOEIC・IELTSの3つとも、元になる単語リストが1800語に届かない**（Clacel≒480語、TOEIC/TSL=1250語、IELTS/NAWL=963語）。よって3種とも「手持ちの語で1周→語が尽きたら新しい例文で2周目以降を作る」というループ方式に統一する。
- Clacelは3周目以降も**可能な限り毎回新しい例文を書き続ける**運用とする。
- 単語リストに発音音声を追加する。音声はPDFに埋め込まず（QRなし）、**別ファイルとして配布**する。生成は**macOSの`say`コマンド**（男性Evan (Enhanced)・女性Samantha (Enhanced)）を使う。この2声は`say -v '?'`で存在確認済み。女性は従来のブラウザ標準「Google US English」の代替（`say`に同名声がないため）。
- 実行環境の差異: 引き継ぎ資料はLinuxサンドボックス（reportlab・DejaVu・IPAゴシックが最初から入っている前提）向けだが、このMacには`reportlab`未インストール・該当フォントも存在しない（確認済み）。ローカルで作業するための環境整備が必要。

## 現状の数字（英検を除く3種のみ）

| テスト種 | ソース総語数 | 完成済み | 残り（1周目終了まで） |
|---|---|---|---|
| TOEIC (TSL) | 1250語（フィルタでさらに減る見込み） | Series1〜5＝100語 | 最大1150語相当（要フィルタ後の実数確認） |
| IELTS (NAWL) | 963語（見出し語ベース、要フィルタ後の実数確認） | Series1〜5＝100語 | 最大863語相当 |
| Clacel CLACEL01 | 159語 | Series1のみ（試作） | 残り約139語（≒7シリーズ） |
| Clacel CLACEL02 | 152語 | Series1〜8＝完成 | なし |
| Clacel CLACEL03（idiom） | 約167〜171語（重複・注記混入あり、要クリーンアップ） | 未着手・形式未確定 | 全量 |

1800語という「折り返し」目標は、TOEIC/IELTSも含め**どの種も1周目だけでは到達しない**。1周目終了後は2周目（新規例文）に入り、Clacelは特に周回が速い（480語÷20語/日≒24日で1周）。

## 全体方針・優先順位

1. **Clacel最優先**（9月ローンチに直結）→ 次にTOEIC/IELTSを量産継続
2. CLACEL03（idiom）も含め、**全ての単語リストはこれまでと同じ既存フォーマット**（Word List＋Fill in the Blank 20問＋Sentence Writing 5問＋Answer Key）で作る。引き継ぎ資料にあった「語群＋和訳ヒントで空所補充」への形式変更は行わない。CLACEL03の見出し語が複数語のフレーズ（"break down"等）になる点だけ既存`generator.py`のデータ構造上問題なく扱えるかを最初の1シリーズで確認する
3. 音声は全3種・全シリーズ共通の仕組みとして後付けできるので、PDF本体の制作と並行して構築してよい

## フェーズ構成

### フェーズ0: 環境・プロジェクト整備
- 作業場所を新設: `/Users/tina/Desktop/AI/osh-vocab-test/`（このNode.jsリポジトリとは別。Python/reportlab系のため）
  - `data/`（各テスト種のシリーズデータ。引き継ぎ資料5-3のPython辞書形式を踏襲）
  - `scripts/`（`generator.py`＝引き継ぎ資料5-2そのまま、QAスクリプト＝引き継ぎ資料5-4踏襲、`audio_gen.py`＝新規）
  - `output/pdf/`、`output/audio/`
  - `fonts/`（DejaVu Sans一式＋IPAゴシック。無料配布フォントをここに配置）
  - `docs/`（引き継ぎ資料と本計画のコピー）
  - `progress.md`（下記「進捗管理」参照）
- `pip3 install reportlab pdf2image`
- DejaVu Sans（4書体：Regular/Bold/Oblique/BoldOblique）とIPAゴシックのフォントファイルを`fonts/`に配置し、`generator.py`のフォントパスをこのMac用に書き換え
- 動作確認: 引き継ぎ資料のCLACEL02サンプル1シリーズをこの環境で実際にPDF生成できるかテスト

### フェーズ1: Clacelの残り制作
- CLACEL03の元データをクリーンアップ（"due to"の重複、"on vs on top of"のような注記混入を除去し、正式な語数を確定）
- CLACEL03: 既存フォーマットのまま1シリーズ試作し、フレーズ見出し語（"break down"等）でもFill in the Blank・Sentence Writing・QAスクリプトが問題なく成立するかを確認してから残りを量産
- CLACEL01: Series1（試作）を本番品質で作り直し、残りSeries2〜8相当を制作
- 3レベル（CLACEL01/02/03）が揃った時点でClacel「1周目」完成

### フェーズ2: TOEIC/IELTS量産継続
- 引き継ぎ資料の既存パイプライン（`generator.py`・QAスクリプト・品詞配分ルール）をそのまま踏襲し、Series6以降を継続生成
- TSL(1250語)・NAWL(963語)それぞれフィルタ後の実利用可能語数を先に確定してから、何シリーズで1周目が終わるかを算出

### フェーズ3: ループ運用（2周目以降）の仕組み化
- 3種共通で「1周目の語リスト＋シリーズ構成はそのまま／例文(Word List・FIB・Part2)だけ新規に書き直す」というシリーズ複製ルールを`generator.py`のデータ側（`data/`のシリーズ辞書）に反映
- 周回番号（lap）をシリーズ名やファイル名に含める命名規則を決めて`progress.md`で管理（例: `Clacel_CLACEL01_S03_lap2.pdf`）

### フェーズ4: 音声パイプライン構築
- `scripts/audio_gen.py`を新規作成：各シリーズのWord List語（見出し語）を1語ずつ`say -v "Evan (Enhanced)" -o <path>.m4a`（男性）／`say -v "Samantha (Enhanced)" -o <path>.m4a`（女性）で生成
- 出力構成: `output/audio/<テスト種>/<シリーズ名>/<word>_m.m4a` ・ `_f.m4a`
- 既存完成分（TOEIC/IELTS Series1〜5、Clacel CLACEL02）にも遡って音声生成
- 配布方法（PDFにQRを埋め込まない前提）は、シリーズ単位でzip化するなど別途決める運用メモを`progress.md`に残す

## 進捗管理

`osh-vocab-test/progress.md` を新設し、以下を常に最新化する（セッションをまたいでも状況が追えるようにするため）:
- 各テスト種・各周（lap）ごとの完了シリーズ一覧
- CLACEL03の形式確定状況
- TSL/NAWLのフィルタ後実語数
- 音声生成済みシリーズ一覧

## Verification

- フェーズ0完了時: CLACEL02 Series1のサンプルデータで実際に`python3 scripts/generator.py`相当を実行し、PDFが1つ生成されること／`pdf2image`で画像化して目視確認できることを確認
- 各シリーズ生成時: 引き継ぎ資料4章のQAチェック（語数・品詞統一・重複なし・FIB網羅性・UK式IPA混入なし等）をスクリプトで実行し、エラー0件を確認してからPDF化
- 音声生成時: 生成した`.m4a`を`afinfo`で再生時間・フォーマットを確認し、1つ試聴して声質を確認
- 全体: `progress.md`の完了シリーズ数と、実際に`output/pdf/`配下に存在するファイル数が一致することを確認
