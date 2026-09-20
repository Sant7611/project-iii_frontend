# Quillora frontend

Quillora is the redesigned frontend for the `project-iii` Django blog backend. It is a responsive community publishing experience built with React and Vinext/Next-compatible routing.

## Core product features

- Approved public story feed and article detail pages
- TF-IDF relevance search through `GET /api/search/?q=`
- Collaborative-filtering recommendations through `GET /api/recommendation/`
- JWT login, registration, token refresh, and role-aware navigation
- Rich post creation/editing and inline image upload
- Threaded comments and replies
- Saved posts
- Profile editing and author post status tracking
- Moderator approval/rejection workflow
- Super-admin/moderator user management
- Notifications
- Like UI prepared for the backend's intended `/posts/{id}/like/` and `/unlike/` routes

## Setup

Requirements: Node.js 22.13+ and the `project-iii` Django backend.

```bash
copy .env.example .env.local
npm install
npm run dev
```

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Important backend note

The current backend `main` branch contains the `Like` model and uses likes for collaborative recommendations, but its like/unlike routes are not active. The Quillora like control reports that clearly instead of pretending a local-only like was persisted. Enable the intended backend routes to make likes fully functional.

## Validation

```bash
npm run build
npx tsc --noEmit
npm test
```
