## セットアップ手順

### API (NestJS + Prisma)
```bash
cd apps/api
cp .env.example .env  # DATABASE_URL を TimescaleDB/PostgreSQL に合わせて編集
pnpm install
pnpm run db:migrate   # DB にテーブルを作成 (要: TimescaleDB/PostgreSQL 起動済み)
pnpm run db:seed      # サンプルの駐車スペースを投入
pnpm run start:dev    # http://localhost:3000
```

### フロントエンド (SvelteKit)
```bash
cd apps/web
cp .env.example .env  # PUBLIC_API_URL を必要に応じて編集
pnpm install
pnpm run dev          # http://localhost:5173
```

Tailwind CSS ベースの UI なので、`apps/web/tailwind.config.js` や
`src/app.postcss` を編集すれば見た目をすぐカスタマイズできます。
API は CORS 済みなので、フロントから `http://localhost:3000/spots` にアクセスして
リアルタイムに空き状況を取得・更新できます。

> ⚠️ DBは TimescaleDB/PostgreSQL を想定しています。ローカルに用意していない場合は  
> 例: `docker run --name parking-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=parking -p 5432:5432 timescale/timescaledb:latest-pg16`
> を実行し、`.env` の `DATABASE_URL` を `postgresql://postgres:postgres@localhost:5432/parking?schema=public` に変更してください。  
> Prisma のマイグレーションが `CREATE EXTENSION timescaledb` を実行するため、接続ユーザーにはスーパーユーザー権限が必要です。

### ルートからまとめて起動する場合
```bash
pnpm install          # ルートで一括インストール
pnpm dev              # API と Web を並列起動
```
### 実行できない場合
```bash
cd apps/api　
pnpm add dotenv
cd ../.. #元のディレクトリに戻る
sudo apt update
sudo apt install postgresql postgresql-contrib #PostgreSQLのインストール

sudo service postgresql start #サービス起動
sudo -u postgres psql #postgresユーザーとしてログイン
ALTER USER postgres WITH PASSWORD 'postgres'; #パスワードを変更
\q #終了

pnpm prisma generate

pnpm dev #最後

```
### python環境初期化と実行方法
```bash
#以下のコマンドで初期化
~/Parking-Management-System$ source python/init_from_root.sh
#成功した場合
(yolo_env)~/Parking-Management-System$
#./videoにmp4を追加してpython/car_counter.pyのパスを設定すれば
(yolo_env)~/Parking-Management-System$ python3 python/car_counter.py
#で動画に対して処理を実行できる linux環境だとカメラにアクセスできないようなのでカメラを使いたければwindowsで
#動画は容量の問題でコミットできなかったので各自で適当なものを使って試してください
```
