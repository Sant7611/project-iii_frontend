# tfacts frontend

`tfacts` is a light, responsive technology-facts publication built with Next.js-compatible Vinext and React. It consumes the Django REST API in the sibling `blog_project` workspace.

## Setup

Requirements: Node.js 22.13 or newer and the Django backend running locally.

```bash
copy .env.example .env.local
npm install
npm run dev
```

The frontend defaults to `http://localhost:3000`; the Django API defaults to `http://127.0.0.1:8000/api`.

## Environment

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set `NEXT_PUBLIC_SITE_URL` to the production origin so canonical URLs and the sitemap use the final domain. The Django backend must allow that origin through CORS.

## Main routes

- `/` — editorial home and featured posts
- `/explore` — tag-filtered post discovery
- `/articles/{id}/{slug}` — crawlable article pages
- `/search` — post search
- `/write` — authenticated post submission
- `/profile` — editable profile and filtered personal posts
- `/moderation` — moderator/admin approval queue
- `/users` and `/users/{id}` — role-safe account management
- `/login` and `/register` — API authentication
- `/robots.txt` and `/sitemap.xml` — SEO crawl controls

See [BACKEND_API_CONTRACT.md](./BACKEND_API_CONTRACT.md) for existing endpoints, required additions, permission rules, and response shapes.

## Validation

```bash
npm run build
npx tsc --noEmit
npm test
```
