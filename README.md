# Quillora frontend

Quillora is the redesigned frontend for the `project-iii` Django blog backend. It is a responsive community publishing experience built with React and Vinext/Next-compatible routing.

## Core product features

- Approved public story feed and article detail pages
- TF-IDF relevance search through `GET /api/search/?q=`
- Collaborative-filtering recommendations through `GET /api/recommendation/`
- Like state/count and toggle through `GET/POST /api/posts/{id}/like/`
- JWT login, registration, token refresh, and role-aware navigation
- Rich post creation/editing and inline image upload
- Threaded comments and replies
- Saved posts
- Profile editing and author post status tracking
- Moderator approval/rejection workflow
- Role-safe account management and moderator creation
- REST + WebSocket notifications

## Setup

Requirements: Node.js 22.13+ and the `project-iii` Django backend.

```bash
copy .env.example .env.local
npm ci
npm run dev
```

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Backend compatibility notes

- The current management serializer does not expose an account `role` or post count. Quillora therefore treats the management list as a backend-filtered set of accounts and only displays a role when the API actually returns one.
- The current profile endpoint reliably supports JSON profile/account fields. Quillora displays existing avatars but does not expose an avatar upload control because there is no dedicated multipart avatar-update contract.
- Likes use one authenticated toggle endpoint: `GET` reads state/count and `POST` toggles liked/unliked.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test
```
