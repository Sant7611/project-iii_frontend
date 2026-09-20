# tfacts frontend API contract

The frontend uses `NEXT_PUBLIC_API_URL` as its base, normally `http://127.0.0.1:8000/api`.

## Existing routes conssumed

- `GET /posts/` — approved public posts; moderator/admin responses also include `approval_status`, `rejection_reason`, and review data.
- `GET /posts/{id}/` — public post detail.
- `POST /posts/` — authenticated multipart post creation with `title`, `content`, repeated `tags`, and optional `featured_img`.
- `GET /posts/my-posts/` — signed-in author’s paginated posts with moderation status.
- `POST /posts/{id}/accept/` — moderator/admin approval.
- `POST /posts/{id}/reject/` — moderator/admin rejection; JSON body `{ "reason": "..." }`.
- `GET /posts/{id}/comments/` — post comments.
- `POST /auth/login/` — email/password login.
- `POST /auth/register/` — account registration.
- `GET/PATCH /profile/{user_id}/` — profile view/update.

## Required additions

### Authentication role

Add `role` to `POST /auth/login/` response data so the frontend can hide privileged navigation. Allowed values: `user`, `moderator`, `super_admin`.

### Profile avatar update

- Keep `PATCH /profile/{user_id}/` for the existing JSON text-field update with nested `profile.bio` and `profile.address`. Only the account owner may update it.
- Add `PATCH /profile/{user_id}/avatar/` as `multipart/form-data` with one `avatar` file. Only the account owner may update it.
- Both successful responses should return the full nested user/profile shape, either directly or under `data`.

### Role-safe account management

- `GET /management/users/` — paginated list. Moderator sees regular users only. Super admin sees regular users and moderators. Never return a super-admin account in this list.
- `GET /management/users/{id}/` — read-only user detail plus all their posts. Apply the same hierarchy as the list route.
- `DELETE /management/users/{id}/` — soft-delete the permitted target. Moderator can remove regular users. Super admin can remove regular users or moderators. Neither role can remove a super admin. Return `204 No Content`.

List item fields:

```json
{
  "id": 12,
  "username": "reader",
  "first_name": "Tara",
  "last_name": "Shah",
  "email": "tara@example.com",
  "phone": "",
  "role": "user",
  "is_active": true,
  "post_count": 4,
  "profile": { "avatar": null, "bio": "", "address": "" }
}
```

Detail response:

```json
{
  "user": { "id": 12, "username": "reader", "role": "user", "profile": { "avatar": null, "bio": "", "address": "" } },
  "posts": []
}
```

## Backend corrections discovered

- Protect `ProfileView` so users cannot list, edit, or delete other profiles.
- Import/fix the missing names used by post approval/rejection (`PostStatus` and `Notification`) or reference `Post.PostStatus` consistently.
- Return category data if categories should appear independently from tags.
- Ensure media URLs are absolute in API responses and allow the deployed frontend origin in CORS.
