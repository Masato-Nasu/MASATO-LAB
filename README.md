# Personal Lab – Cloudflare Pages + Access + KV starter

このセットは、公開ページと同じサイト内に `/editor/` を置き、保存先を Workers KV にした最小構成です。

## いちばん楽な構成
- 公開ページ: `/`, `/portfolio.html`, `/memory.html`, `/tools.html`, `/about.html`
- 編集画面: `/editor/`
- 読み込み API: `/api/data`
- 保存 API: `/editor/save`
- 保存先: Workers KV の `SITE_DATA`
- 認証: Cloudflare Access で `/editor*` だけ保護

## Cloudflare 側の設定
1. Pages プロジェクトを作成して、このフォルダをデプロイする。
2. Workers KV で namespace を 1つ作る。
3. Pages > Settings > Bindings で KV binding を追加する。
   - Variable name: `SITE_DATA`
4. Zero Trust で One-time PIN を identity provider として追加する。
5. Access > Applications で Self-hosted application を追加し、`/editor*` を保護する。
   - 例: `your-site.pages.dev/editor*`
   - 許可するメールアドレスだけ Allow policy に入れる。

## 初回の流れ
1. 公開後に `/editor/` を開く。
2. Access の OTP でログインする。
3. 「現在の公開データを読み込む」を押す。
4. 内容を編集して「サイトに保存」を押す。

## ローカル確認
- 公開ページは `data.json` を同梱しているので、簡易確認がしやすいです。
- `/editor/` はローカルでも開けますが、保存 API は動かないので `Import data.json` / `Download data.json` を使ってください。

## メモ
- `/editor*` だけ Access で守るので、公開ページには Editor リンクを出していません。
- KV にまだデータが無い場合、`/api/data` は同梱の `data.json` を返します。
