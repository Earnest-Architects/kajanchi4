# AIタブ(ai.html)の構成

`ai.html` は骨組みだけ。見た目は `css/ai/`、動きは `js/ai/` に分割している。
スクリプトは通常の `<script>`(file:// でも動くようESMは使わない)。各ファイルは `window.AI` に機能を登録し、
モジュール間のやり取りは `AI.on / AI.emit` のイベントで行う。

| ファイル | 役割 |
|---|---|
| css/ai/tokens.css | 色・角丸・ボタンサイズなどのデザイントークン(配色変更はここだけ) |
| css/ai/base.css | ステージ・空状態・初回表示アニメ |
| css/ai/controls.css | 共通アイコンボタン `.ib` / ツールバー `.tb` / ツールチップ |
| css/ai/composer.css | 下部の入力カード |
| css/ai/compare.css | 比較スライダー・結果アクション(`.acts`) |
| css/ai/settings.css / paint.css / history.css / progress.css | 各機能のスタイル |
| js/ai/workflow.js | ComfyUIワークフロー + ノードID(`AI.NODE`) |
| js/ai/core.js | `$` / `sleep` / イベントバス / `setStatus` / 共有state |
| js/ai/icons.js | SVGアイコン定義。`data-icon="名前"` で描画。新規追加はここに1行 |
| js/ai/fx-shader.js | 生成中のWebGL背景(GLSLはこの中) |
| js/ai/progress.js | リング・%・段階表示(推定カーブ、所要時間の学習) |
| js/ai/settings.js | サーバー設定・接続テスト |
| js/ai/viewer.js | 画像1・比較スライダー・パネル開閉・レイアウト変数 |
| js/ai/paint.js | 赤ペン |
| js/ai/history.js | 履歴(IndexedDB) |
| js/ai/api.js | ComfyUI通信 |
| js/ai/generate.js | 生成フロー全体の制御 |
| js/ai/composer.js | 画像2・プロンプト欄 |
| js/ai/main.js | 起動 |

## 新しいボタンを足すには
1. `ai.html` の `<nav class="tb">` に `<button class="ib" data-icon="名前" data-tip="説明" aria-label="説明">` を追加
2. `icons.js` に同名のSVGパスを追加
3. 動作は該当モジュール(または新ファイル)に書き、`ai.html` の script 一覧に追加(読み込み順に注意)
