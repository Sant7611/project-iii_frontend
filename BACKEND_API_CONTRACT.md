# TFacts ↔ project-iii API contract

Base URL: `NEXT_PUBLIC_API_URL` (normally `http://127.0.0.1:9009/api`).

## Authentication

- `POST /auth/register/`
- `POST /auth/login/`
- `POST /token/refresh/`

Login returns access/refresh JWTs plus `user_id`, `username`, `email`, and `role`.

## Profile

- `GET /profile/me/`
- `PATCH /profile/me/`

The frontend sends JSON account fields plus nested `profile.bio` and `profile.address`. Existing avatar URLs are displayed. The current backend does not expose a dedicated multipart avatar-update route.

## Posts

- `GET /posts/`
- `GET /posts/{id}/`
- `POST /posts/`
- `PATCH /posts/{id}/`
- `DELETE /posts/{id}/`
- `GET /posts/my-posts/`
- `POST /posts/{id}/accept/`
- `POST /posts/{id}/reject/`

Post create/update uses multipart form data with `title`, `content`, repeated `tags`, and optional `featured_img`.

## Likes

- `GET /posts/{id}/like/` — returns the signed-in user's `liked` state and total `count`
- `POST /posts/{id}/like/` — toggles like/unlike and returns the new state/count

The collaborative recommender uses persisted `Like` rows.

## Comments

Nested under posts:

- `GET /posts/{post_id}/comments/`
- `POST /posts/{post_id}/comments/`
- `GET /posts/{post_id}/comments/{id}/`
- `PATCH /posts/{post_id}/comments/{id}/`
- `DELETE /posts/{post_id}/comments/{id}/`

Replies are created by posting `{ "content": "...", "parent": <comment_id> }`.

## Saved posts

- `GET /saved/`
- `POST /saved/` with `{ "post": <post_id> }`
- `DELETE /saved/{saved_id}/`

## Search and recommendation algorithms

- `GET /search/?q=...` — TF-IDF ranked approved posts
- `GET /recommendation/` — authenticated collaborative-filtering recommendations based on likes

## Rich editor uploads

- `POST /upload/` multipart field `image`
- JPEG, PNG, WebP, GIF
- maximum 5 MB
- returns `data.url`

## Notifications

REST:

- `GET /notification/`
- `PATCH /notification/{id}/`
- `DELETE /notification/{id}/`

WebSocket:

- `/ws/notifications/?token=<access JWT>`

## Account management

- `GET /management/users/`
- `GET /management/users/{id}/`
- `DELETE /management/users/{id}/`
- `POST /management/users/create_moderator/` (super-admin only)

The backend applies role hierarchy in its queryset/permissions. The current `UserManagementSerializer` returns `id`, profile, first/last name, email, username, and phone; it does not currently return role or post count for list/detail responses.
