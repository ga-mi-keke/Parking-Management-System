## セットアップ手順

### API (NestJS + Prisma)
```bash
cd apps/api
pnpm install
pnpm run db:migrate   # SQLite dev.db と Prisma Client を作成
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

### ルートからまとめて起動する場合
```bash
pnpm install          # ルートで一括インストール
pnpm dev              # API と Web を並列起動
```
