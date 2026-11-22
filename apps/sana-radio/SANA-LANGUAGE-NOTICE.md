# SANA Language

**語根ひとつから、語族が規則的に立ち上がる。**  
英語ゼロ・不規則ゼロ・生成的な人工言語。

![SANA Language screenshot](screenshot1.png)

## Live Demo

https://sana-language.pages.dev

## About

SANA は、語根と公開された規則から語を生成する人工言語／翻訳実験です。
同じ入力からは常に同じ語が生成され、語根・派生・品詞・文法標識を分解して扱えることを重視しています。

v1.4.0-alpha.10 は約 51,900 語根を収録し、PWA としてホーム画面へのインストールとオフライン起動に対応しています。

## Features

- 語根から動詞活用・派生語・品詞を決定的に生成
- 日本語 → SANA 変換
- SANA → 日本語の再構成
- 6SEG alphabet-v3 表示・画像保存
- 6SEG画像の形状読取
- SANA / 日本語のコピー・テキスト保存
- 語根辞書の検索とユーザー語根追加
- PWA対応（インストール / Service Worker / オフライン起動）

## PWA

HTTPS で公開すると、対応ブラウザからホーム画面へインストールできます。
初回オンライン読み込み後は、アプリシェルが Service Worker にキャッシュされ、オフラインでも起動できます。

## Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy . --project-name sana-language
```

デプロイ時は、このリポジトリの `index.html`、`manifest.webmanifest`、`sw.js`、`icons/` が同じルート階層にある状態で公開してください。

## Japanese lexical data / 日本語語彙データについて

SANA の日本語語彙処理の一部では、国立国語研究所が公開する
**『現代日本語書き言葉均衡コーパス』短単位語彙表 ver.1.0**
を参照して作成した加工語彙データを使用しています。

**出典**  
国立国語研究所  
『現代日本語書き言葉均衡コーパス』短単位語彙表 ver.1.0

**Original edited dataset copyright**  
National Institute for Japanese Language and Linguistics (NINJAL)  
国立国語研究所

SANA は、BCCWJ 語彙表そのもの、元データの頻度数値、頻度順位、ジャンル別頻度等を再配布しません。
SANA 内で使用・表示される語彙上の指標や分類がある場合、それらは開発者が独自に算出・設計したものであり、国立国語研究所による分類・評価・保証を示すものではありません。

本利用形態については国立国語研究所へ照会を行い、問題ない旨の回答を得ています（2026年7月）。
本プロジェクトは現在、無料・広告なし・非営利で公開しています。
広告、有料機能、寄付・スポンサー収入、法人向け提供など営利性を伴う形へ変更する場合は、変更前に国立国語研究所へ改めて確認する方針です。

元となるコーパスおよび語彙表には解析誤りが含まれる可能性があり、SANA の語彙情報についても完全な正確性を保証するものではありません。

### English note

Parts of SANA's Japanese lexical resources were created with reference to the **Balanced Corpus of Contemporary Written Japanese (BCCWJ) Short Unit Word Frequency List ver.1.0**, published by NINJAL.
SANA does not redistribute the original frequency list, raw frequency values, rankings, or register-specific frequency data. Any learning-oriented labels or classifications used by SANA are independently designed by the developer and are not evaluations or guarantees made by NINJAL.

## Version

`v1.4.0-alpha.10`

- ひらがな表記の定型挨拶（こんにちは・こんばんは・おやすみなさい）を辞書に追加
- 擬態語「ぎゅうぎゅう」・助数接尾「日目」を辞書に追加
- 動詞「ほどく」「ほどける」、副詞「先ほど」、名詞「円板・円周・円周率・一周・周・三葉」を追加
- 全動詞監査により一段活用クラス未登録31語を修正（過ぎる・駆ける・寝る・変える・得る等。「過ぎた」が 過＋ぎ＋た に断片化していた）
- 分野別プローブ235語により辞書欠落31語を追加（番目・枚目・回目・冊・匹・素数・写像・数列・級数・せっかく・もちろん・けっこう等）
- 単漢字白リストに 枚・回・数・個・何・頃・非・逆 を追加（辞書所収なのに漢字連続列の被覆に使えなかった）
- 未知文字に隣接する1文字かな語彙（名詞・副詞）を未知列ごと可逆リテラルへ統合する分割規則を追加（「ぎゅうぎゅう」型の単字サラダを構造的に防止。助詞・動詞トークンは対象外）
- 動詞「応える」（一段）「擦りむく」、名詞「手加減」「ぞう」、副詞「ぞっと」、終助詞「ぞ」（hezo、よ・ね系の文法トークン）を追加。単字白リストに「僕」を追加
- 否定標識を `un` から `nu` へ変更。`un ko...` の連続を避け、発音上の不快な偶然を解消。alpha.9以前の `un` は復号互換のみ維持
- NINJAL照会結果（利用可の回答）を出典表記へ反映
- BCCWJ reference / attribution notice
- GitHub-ready PWA package
- 6SEG alphabet-v3

## Author

**Masato Nasu / 那須 雅人**

### alpha.10 cache hotfix
- `index.html` / `sw.js` の旧版キャッシュ残留を防止
- Service Worker を `updateViaCache: "none"` で登録
- 新しい Service Worker はインストール後すぐ `skipWaiting()`
- Cloudflare Pages 用 `_headers` で `index.html` と `sw.js` を no-cache/no-store
