# MIRAKURU-VERSE 🌊

**Instant connection. Infinite possibilities.**

## 📖 Overview

**MIRAKURU-VERSE** は、Webブラウザのみで動作するサーバレス3Dメタバース空間です。

従来のルーム選択方式を廃止し、**「ワンクリックで世界中のユーザと同じ空間（グローバルロビー）に接続する」** オープンワールド形式を採用しました。
Three.jsによる美しいグラフィック表現と、MQTTによる軽量なリアルタイム通信を組み合わせ、アプリのインストール不要で、誰とでも一瞬でつながる体験を提供します。

## ✨ Key Features

* **🌍 One-Click Global Entry**
  * 合言葉やID登録は不要。「ENTER WORLD」ボタンを押すだけで、全ユーザが共有するグローバル・パブリック・ロビーへ即座に接続されます。
* **⚡ Serverless Real-time Communication**
  * バックエンドサーバを構築せず、MQTTプロトコル（WebSocket）を利用して、アバターの座標同期やチャット送信をミリ秒単位で実現。
* **🤖 Procedural Avatars**
  * ユーザごとにランダムなカラーリング（Cyan, Pink, Lime, Orange, Purple）のアバターが自動生成されます。
  * 出現位置をランダム化し、ユーザ同士の重なり（スタック）を防止。
* **💬 3D Chat Bubbles**
  * チャットメッセージはアバターの頭上に「吹き出し」として表示され、3D空間内での距離感や位置関係を直感的に把握できます。
  * `@ニックネーム` のメンションに対応し、メンションされたアバターはメンション元の方向を向きます。
  * 👍❤️✨🔥 などのリアクション（記号）や、簡易エモートを表示できます。
* **✨ Magic Particles (Python)**
  * Pythonコードで雪・スパーク・花火などのパーティクルを生成できます。
* **🧭 Treasure Hunt / Tag Bots**
  * 距離計算による Hot / Cold ヒントと、TAG-BOT・PONの追跡ボットを搭載。
* **🧠 NPC Behavior**
  * キーワード応答NPC、巡回パトロールなどの自律行動に対応。
* **🚪 Seamless Exit System**
  * 画面右上の「EXIT」ボタンで即座に切断・退出が可能。
  * 退出時やブラウザを閉じた際は、他のユーザの画面から自分のアバターが自動的に削除されます。
* **📱 Responsive UI**
  * スマホ/タブレットでも利用できるよう、UIをレスポンシブ対応。
  * Pythonコンソールもモバイル向けに最適化しています。
* **🐍 Python Control Console**
  * キーボード/タッチ操作に加えて、Pythonコードから移動・視界変更・チャット・演出を操作できます。
  * 画面右上のハンバーガーメニューから、Pythonコメント付きのAPP APIを確認できます。

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS / ES Modules)
* **3D Engine:** Three.js
* **Communication:** MQTT.js (via WebSockets over SSL)
* **Design:** CSS Glassmorphism, Responsive UI
* **Python Runtime:** Pyodide (in-browser)
* **Architecture:** Single Page Application (SPA)

## 🚀 How to Play

1. **Access:** デモサイトにアクセスします。
2. **Set Nickname:** メタバースに入る前にニックネームを入力します（1〜12文字、空白なし）。
3. **Dive In:** タイトル画面の **"ENTER WORLD"** ボタンをクリックします。
4. **Controls:**
    * PC: `WASD` / 方向キー / `Space` / `Shift` で移動。
    * スマホ/タブレット: 画面下のタッチパッドで移動。
5. **Python Console:**
    * 右上の ☰ からPythonコンソールを開いて操作します。
    * `move()`, `magic()`, `treasure_hint()` などを使用（角度は度数指定）。
6. **Explore (Python-First):**
    * Python中心で学習しつつ、必要に応じてキーボード/タッチ操作も使えます。
    * 実行結果やエラーはコンソール出力で確認できます。
7. **Exit:** 終了する際は右上の **"EXIT"** ボタンを押すとタイトル画面に戻ります。

## 📁 Project Structure

* `index.html` : UIレイアウト、外部ライブラリ読み込み（MQTT / importmap）
* `style.css` : 画面デザイン（テーマ色維持）＋レスポンシブ対応
* `main.js` : Three.jsの3D空間、アバター同期、チャット/メンション/リアクション/エモート、Pythonコンソール連携

## 🔐 Security Note

本アプリケーションは技術デモとして公開されています。
通信には公開されたMQTTテストブローカーを使用しており、チャット内容は同じロビーにいる全員に公開されます。
個人情報や機密情報は入力しないでください。

## ✅ Consent

メタバース空間へ入室する前に、上記の注意事項（公開チャットであること等）への同意が必要です。

## © Copyright

© 2025 奥河 董馬（Toma Okugawa）. All Rights Reserved.
