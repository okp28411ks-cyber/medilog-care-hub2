# MediLog+

MediLog+ の Supabase / Vercel / GitHub 新規プロジェクト版です。

## Stack
- Vite
- React
- Supabase Auth / PostgreSQL / Storage
- Vercel

## Environment variables

Vercel / local `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

`service_role` / secret key はフロントエンドに置かないでください。

## Local development

```bash
npm install
npm run dev
```

## Deploy

GitHub repository を Vercel に接続し、上記2つの環境変数を設定してください。
