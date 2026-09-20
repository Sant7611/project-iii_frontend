"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Edit3, FileText, LogIn, Trash2, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch, getStoredUser, hasAuthSession, updateStoredUser } from "@/lib/auth";
import type { OwnerPost, Paginated, UserProfile } from "@/lib/types";
import { PostCard } from "./post-card";
import { AVATAR_CHANGE_EVENT, UserAvatar } from "./user-avatar";

type Status = "all" | "approved" | "pending" | "rejected";

export function ProfileDashboard() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(
    undefined,
  );
  const [posts, setPosts] = useState<OwnerPost[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>("all");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const user = getStoredUser();
      if (!user || !hasAuthSession()) {
        if (!cancelled) {
          setRequiresLogin(true);
          setProfile(null);
        }
        return;
      }

      setRequiresLogin(false);
      try {
        const response = await authenticatedFetch(`${API_URL}/profile/me/`, {
          headers: { Accept: "application/json" },
        });
        const payload = await readResponse(response);
        if (!response.ok) {
          if (response.status === 401 && !cancelled) setRequiresLogin(true);
          throw new Error(getApiError(payload));
        }
        if (cancelled) return;
        setProfile(unwrapProfile(payload));

        try {
          const result = await fetchAllPosts(`${API_URL}/posts/my-posts/`);
          if (cancelled) return;
          setPosts(result.posts);
          setTotal(result.total);
        } catch {
          if (!cancelled) setError("Your profile loaded, but your posts could not be loaded.");
        }
      } catch (reason) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "We could not load your profile from the API.");
        setProfile(null);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const visible = useMemo(
    () =>
      status === "all"
        ? posts
        : posts.filter((post) => post.approval_status === status),
    [posts, status],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaveError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = {
      first_name: form.get("first_name"),
      last_name: form.get("last_name"),
      email: form.get("email"),
      username: form.get("username"),
      phone: form.get("phone"),
      profile: { bio: form.get("bio"), address: form.get("address") },
    };
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/profile/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(getApiError(payload));

      const updatedProfile = unwrapProfile(payload);

      setProfile(updatedProfile);
      const storedUser = getStoredUser();
      if (storedUser) {
        updateStoredUser({
          id: updatedProfile.id,
          username: updatedProfile.username,
          email: updatedProfile.email,
          role: storedUser.role,
        });
      }
      setEditing(false);
      setMessage("Profile updated.");
    } catch (reason) {
      setSaveError(
        reason instanceof TypeError
          ? `The profile API at ${API_URL} could not be reached. Check NEXT_PUBLIC_API_URL and Django CORS settings.`
          : reason instanceof Error
            ? reason.message
            : "Profile update failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(file: File | undefined) {
    if (!file || !profile || avatarBusy) return;

    const preview = URL.createObjectURL(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(preview);
    setAvatarBusy(true);
    setAvatarError("");
    setMessage("");

    const body = new FormData();
    body.set("avatar", file);

    try {
      const response = await authenticatedFetch(`${API_URL}/profile/avatar/`, {
        method: "PATCH",
        headers: { Accept: "application/json" },
        body,
      });
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(getApiError(payload));

      const avatar = extractAvatar(payload);
      setProfile((current) =>
        current
          ? { ...current, profile: { ...current.profile, avatar } }
          : current,
      );
      setPosts((current) =>
        current.map((post) => ({ ...post, author_avatar: avatar })),
      );
      setMessage("Profile image updated.");
      window.dispatchEvent(new Event(AVATAR_CHANGE_EVENT));
    } catch (reason) {
      setAvatarError(
        reason instanceof Error ? reason.message : "Profile image update failed.",
      );
    } finally {
      URL.revokeObjectURL(preview);
      setAvatarPreview(null);
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    if (!profile?.profile?.avatar || avatarBusy) return;
    if (!window.confirm("Remove your profile image?")) return;

    setAvatarBusy(true);
    setAvatarError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(`${API_URL}/profile/avatar/`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(getApiError(payload));

      setProfile((current) =>
        current
          ? { ...current, profile: { ...current.profile, avatar: null } }
          : current,
      );
      setPosts((current) =>
        current.map((post) => ({ ...post, author_avatar: null })),
      );
      setMessage("Profile image removed.");
      window.dispatchEvent(new Event(AVATAR_CHANGE_EVENT));
    } catch (reason) {
      setAvatarError(
        reason instanceof Error ? reason.message : "Profile image removal failed.",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  async function deletePost(post: OwnerPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;

    setDeletingPostId(post.id);
    setError("");
    try {
      const response = await authenticatedFetch(`${API_URL}/posts/${post.id}/`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("This post could not be deleted.");
      }
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setTotal((current) => Math.max(0, current - 1));
      setMessage("Post deleted.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "This post could not be deleted.",
      );
    } finally {
      setDeletingPostId(null);
    }
  }

  if (profile === undefined)
    return (
      <div className="empty-state">
        <p>Loading your profile…</p>
      </div>
    );
  if (!profile && requiresLogin)
    return (
      <div className="empty-state">
        <LogIn size={34} />
        <h1>Your curious corner</h1>
        <p>
          Sign in to see your profile, edit your details, and follow every post
          you submit.
        </p>
        <Link className="button button-primary" href="/login">
          Sign in
        </Link>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  if (!profile)
    return (
      <div className="empty-state">
        <h1>We could not load your profile</h1>
        <p>{error || "Please try again after checking the API connection."}</p>
      </div>
    );

  const avatar = avatarPreview || profile.profile?.avatar;
  const profileInitial = (profile.first_name || profile.username || "?").charAt(0).toUpperCase();
  return (
    <>
      <section className="profile-hero">
        <div className="profile-avatar">
          {avatar ? (
            <img src={avatar} alt={`${profile.username}'s avatar`} />
          ) : (
            <div className="profile-avatar-initial" aria-hidden="true">{profileInitial}</div>
          )}
        </div>
        <div>
          <span className="kicker">Your curious corner</span>
          <h1>
            {profile.first_name || profile.username}
            {profile.last_name ? ` ${profile.last_name}` : ""}
          </h1>
          <p>
            @{profile.username} · {profile.email}
          </p>
          {profile.profile?.bio && (
            <p className="profile-bio">{profile.profile.bio}</p>
          )}
        </div>
        <button
          className="button button-secondary profile-edit"
          onClick={() => {
            setSaveError("");
            setEditing(true);
          }}
        >
          <Edit3 size={16} /> Edit profile
        </button>
      </section>
      {message && (
        <div className="form-success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <section className="profile-stats">
        <div>
          <strong>{total}</strong>
          <span>Total posts</span>
        </div>
        <div>
          <strong>
            {posts.filter((p) => p.approval_status === "approved").length}
          </strong>
          <span>Approved loaded</span>
        </div>
        <div>
          <strong>
            {posts.filter((p) => p.approval_status === "pending").length}
          </strong>
          <span>Pending loaded</span>
        </div>
        <div>
          <strong>
            {posts.filter((p) => p.approval_status === "rejected").length}
          </strong>
          <span>Rejected loaded</span>
        </div>
      </section>
      <section className="section profile-posts">
        <div className="section-heading">
          <div>
            <span className="kicker">Your work</span>
            <h2>Posts</h2>
          </div>
          <Link className="button button-primary" href="/write">
            Write a story
          </Link>
        </div>
        <div className="filter-row" role="group" aria-label="Filter your posts">
          {(["all", "approved", "pending", "rejected"] as Status[]).map(
            (item) => (
              <button
                key={item}
                className={`filter-chip ${status === item ? "active" : ""}`}
                onClick={() => setStatus(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ),
          )}
        </div>
        {visible.length ? (
          <div className="post-grid">
            {visible.map((post) => (
              <div className="owner-post" key={post.id}>
                <span className={`status-badge ${post.approval_status}`}>
                  {post.approval_status}
                </span>
                <PostCard
                  post={post}
                  href={post.approval_status !== "approved" ? `/profile/posts/${post.id}` : undefined}
                  actions={
                    <>
                      <Link
                        className="button button-secondary"
                        href={`/write?edit=${post.id}`}
                      >
                        {post.approval_status === "rejected"
                          ? "View feedback & resubmit"
                          : "Edit post"}
                      </Link>
                      <button
                        className="button button-secondary danger"
                        onClick={() => void deletePost(post)}
                        disabled={deletingPostId === post.id}
                      >
                        <Trash2 size={15} />
                        {deletingPostId === post.id ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={34} />
            <h2>No {status === "all" ? "" : status} posts</h2>
            <p>Your submissions in this state will appear here.</p>
          </div>
        )}
      </section>
      {editing && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <button
              className="modal-close"
              onClick={() => setEditing(false)}
              aria-label="Close profile editor"
            >
              <X size={20} />
            </button>
            <h2 id="edit-title">Edit profile</h2>
            <div className="profile-avatar-editor">
              <UserAvatar avatarUrl={avatar} username={profile.username} size={76} />
              <div>
                <strong>Profile image</strong>
                <p>JPEG, PNG or WebP, up to 5 MB.</p>
                <div className="profile-avatar-actions">
                  <label className="button button-secondary">
                    {avatarBusy ? "Updating…" : avatar ? "Change photo" : "Add photo"}
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={avatarBusy}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = "";
                        void changeAvatar(file);
                      }}
                    />
                  </label>
                  {profile.profile?.avatar && (
                    <button
                      className="button button-secondary danger"
                      type="button"
                      onClick={() => void removeAvatar()}
                      disabled={avatarBusy}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                {avatarError && <p className="form-error" role="alert">{avatarError}</p>}
              </div>
            </div>
            <form className="form" onSubmit={save}>
              <div className="form-split">
                <div className="field">
                  <label htmlFor="first_name">First name</label>
                  <input
                    id="first_name"
                    name="first_name"
                    defaultValue={profile.first_name}
                  />
                </div>
                <div className="field">
                  <label htmlFor="last_name">Last name</label>
                  <input
                    id="last_name"
                    name="last_name"
                    defaultValue={profile.last_name}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  required
                  defaultValue={profile.username}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={profile.email}
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  defaultValue={profile.phone || ""}
                />
              </div>
              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile.profile?.bio || ""}
                />
              </div>
              <div className="field">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  defaultValue={profile.profile?.address || ""}
                />
              </div>
              {saveError && (
                <div className="form-error" role="alert">
                  {saveError}
                </div>
              )}
              <button className="button button-primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getApiError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Profile update failed.";
  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  if (record.errors && typeof record.errors === "object") {
    return Object.entries(record.errors as Record<string, unknown>)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
      .join(" ");
  }
  return Object.entries(record)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
    .join(" ") || "Profile update failed.";
}

function unwrapProfile(payload: unknown): UserProfile {
  const record = payload as { data?: UserProfile };
  return record?.data || (payload as UserProfile);
}

async function fetchAllPosts(firstUrl: string) {
  let url: string | null = firstUrl;
  const posts: OwnerPost[] = [];
  let total = 0;
  let pages = 0;
  while (url && pages < 20) {
    const response: Response = await authenticatedFetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error();
    const payload: Paginated<OwnerPost> | { data?: OwnerPost[] } =
      await response.json();
    if ("results" in payload) {
      total = payload.count;
      posts.push(...payload.results);
      url = payload.next;
    } else {
      const data = payload.data || [];
      total = data.length;
      posts.push(...data);
      url = null;
    }
    pages += 1;
  }
  return { posts, total };
}

function extractAvatar(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: { avatar?: unknown }; avatar?: unknown };
  const value = record.data?.avatar ?? record.avatar;
  return typeof value === "string" ? value : null;
}
