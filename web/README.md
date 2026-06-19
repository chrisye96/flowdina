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

## AI 生成 (Vercel AI Gateway)

The "AI 生成" button generates a diagram from a plain-language description. It calls
`POST /api/generate`, which routes a Claude model through the
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway). The route never embeds a key —
it reads one from the environment:

```bash
# web/.env.local
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
# optional — defaults to anthropic/claude-sonnet-4.6
AI_MODEL=anthropic/claude-sonnet-4.6
```

On Vercel, the gateway is authenticated automatically via the project's OIDC token, so no
key is needed in production. Without a key locally, the editor shows a friendly
"AI 未配置" message instead of failing.

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
