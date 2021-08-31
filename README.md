# camchat

カメラ映像を見ながらチャットを楽しむシステムのプロトタイプです。

![](https://github.com/KDDI-tech/camchat/blob/main/doc/image/image.png?raw=true)

## 概要

camchatは2つのアプリで構成されます。

- カメラ映像配信アプリ : 映像をviewerアプリに配信するだけのアプリです。
- viewerアプリ : 映像を視聴しながらチャットするアプリです。

## デプロイ方法

### 1. 本repoをcloneする

```
git clone git@github.com:KDDI-tech/camchat.git
```

### 2. 設定ファイルを編集する

下記3つの設定ファイルを編集してください。

- `/config.js`
- `/users.js`
- `/www/skywaykey.js`

#### /config.js

basic認証のユーザー名、パスワードやIPアドレス、ポート番号などを設定するファイルです。

```
module.exports = {
  "basicAuth":{"id":"ユーザー名をここに書く","pass":"パスワードをここに書く"},
  "ip":"127.0.0.1",
  "port":ポート番号,
  "secret":"適当な文字列"
}
```
#### /users.js

ログインユーザーを登録する設定ファイルです。

現在の実装では本ファイルにID/パスワードを平文で保存します。この実装のままではセキュアな利用は行えませんのでご注意ください。

#### /www/skywaykey.js

本PJでは(株)NTTコミュニケーションズ様が提供するSkywayを利用しています。
利用登録後、APIキーを発行し、本設定ファイルにAPIキーを登録してください。

```
export default 'ここにSkywayで発行されたAPIキーをコピーする';
```

### 3. デプロイする

設定ファイルを編集後、repoのディレクトリをカレントにして下記コマンドを入力してください。

#### forever を導入 (未導入の場合のみ)

```
npm i forever -g
```

#### パッケージインストールと起動

```
npm i
npm start
```

上記でサーバーが起動します。
WebRTCに対応したブラウザから下記にアクセスしてみてください。

- http://localhost:`/config.jsに設定したport番号`/cam → カメラ映像配信アプリ
- http://localhost:`/config.jsに設定したport番号`/viewer → viewerアプリ

## License

[MITライセンス](https://github.com/KDDI-tech/camchat/blob/main/LICENSE)です。


