This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## AI 生成 (configurable providers)

The "AI 生成" button generates a diagram from a plain-language description via
`POST /api/generate`. Keys are read from the environment — the route never embeds one.

Configure **1–3 OpenAI-compatible providers** with a generic numbered convention (no
provider name is hardcoded, so Gemini, DeepSeek, OpenAI, Together, etc. all drop in):

```bash
# web/.env.local
AI_PROVIDER_1_NAME=Gemini
AI_PROVIDER_1_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_PROVIDER_1_KEY=your_gemini_key
AI_PROVIDER_1_MODEL=gemini-2.0-flash

AI_PROVIDER_2_NAME=DeepSeek
AI_PROVIDER_2_BASE_URL=https://api.deepseek.com/v1
AI_PROVIDER_2_KEY=your_deepseek_key
AI_PROVIDER_2_MODEL=deepseek-chat

# AI_PROVIDER_3_* for a third
```

When more than one is configured, the generate dialog shows a model picker
(`GET /api/providers` returns names/ids only — never keys).

Optionally, the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) is still supported
as an additional provider:

```bash
AI_GATEWAY_API_KEY=your_gateway_key
AI_MODEL=anthropic/claude-sonnet-4.6   # optional, this is the default
```

With nothing configured, the editor shows a friendly "AI 未配置" message instead of failing.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
