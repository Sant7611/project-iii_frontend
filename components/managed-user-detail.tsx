"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth";
import type { OwnerPost, Paginated } from "@/lib/types";
import { PostCard } from "./post-card";
import { PostReviewDetails } from "./post-review-details";
import type { ManagedUser } from "./user-management";

type UserDetailData = {
  user: ManagedUser;
  posts: OwnerPost[] | null;
};

export function ManagedUserDetail({ id }: { id: string }) {
  const [data, setData] = useState<UserDetailData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setMessage("");
      try {
        const response = await authenticatedFetch(
          `${API_URL}/management/users/${id}/`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          throw new Error("This account could not be found.");
        }
        if (!response.ok) {
          throw new Error("You cannot view this account.");
        }

        const payload: unknown = await response.json();
        const detail = readUserDetail(payload);
        setData(detail);

        if (detail.posts === null) {
          try {
            const posts = await fetchPostsForUser(
              detail.user.id,
              controller.signal,
            );
            if (!controller.signal.aborted) {
              setData({ user: detail.user, posts });
            }
          } catch {
            if (!controller.signal.aborted) {
              setMessage(
                "The profile loaded, but this account’s posts could not be loaded.",
              );
            }
          }
        }
      } catch (reason) {
        if (controller.signal.aborted) return;
        setMessage(
          reason instanceof Error
            ? reason.message
            : "The account detail could not be loaded.",
        );
      }
    }

    void loadUser();
    return () => controller.abort();
  }, [id]);

  if (!data) {
    return (
      <>
        <BackToUsers />
        <div className="empty-state management-empty">
          <UserRound size={35} />
          <h2>Account detail unavailable</h2>
          <p>{message || "Loading account data…"}</p>
        </div>
      </>
    );
  }

  const { user, posts } = data;
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <>
      <BackToUsers />
      <section className="profile-hero management-profile">
        <div className="profile-avatar">
          {user.profile?.avatar ? (
            <img src={user.profile.avatar} alt={`${user.username}'s avatar`} />
          ) : null}
        </div>
        <div>
          <span className="kicker">Read-only account view</span>
          <h1>{displayName}</h1>
          <p>
            @{user.username} · {user.email} · {user.role ? user.role.replace("_", " ") : "managed account"}
          </p>
          <p className="profile-bio">
            {user.profile?.bio || "No bio provided."}
          </p>
        </div>
      </section>

      <section className="management-details" aria-label="Account information">
        <div>
          <Mail size={17} />
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div>
          <Phone size={17} />
          <span>Phone</span>
          <strong>{user.phone || "Not provided"}</strong>
        </div>
        <div>
          <MapPin size={17} />
          <span>Address</span>
          <strong>{user.profile?.address || "Not provided"}</strong>
        </div>
      </section>

      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="kicker">Contributions</span>
            <h2>{posts === null ? "Posts unavailable" : `${posts.length} posts`}</h2>
          </div>
        </div>

        {posts === null ? (
          <div className="empty-state">
            <p>The backend user-detail response does not include this user&apos;s posts.</p>
          </div>
        ) : posts.length ? (
          <div className="post-grid">
            {posts.map((post) => (
              <div className="owner-post" key={post.id}>
                <span className={`status-badge ${post.approval_status}`}>
                  {post.approval_status}
                </span>
                <PostCard post={post} />
                <PostReviewDetails post={post} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>This user has not submitted any posts.</p>
          </div>
        )}
      </section>
    </>
  );
}

function BackToUsers() {
  return (
    <Link className="text-link" href="/users">
      <ArrowLeft size={16} /> Back to users
    </Link>
  );
}

async function fetchPostsForUser(
  userId: number,
  signal: AbortSignal,
): Promise<OwnerPost[]> {
  let url: string | null = `${API_URL}/posts/`;
  const posts: OwnerPost[] = [];
  let pages = 0;

  while (url && pages < 20) {
    const response: Response = await authenticatedFetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) throw new Error();
    const payload: Paginated<OwnerPost> | OwnerPost[] = await response.json();
    if (Array.isArray(payload)) {
      posts.push(...payload.filter((post) => post.author === userId));
      url = null;
    } else {
      posts.push(
        ...payload.results.filter((post) => post.author === userId),
      );
      url = payload.next;
    }
    pages += 1;
  }

  return posts;
}

function readUserDetail(payload: unknown): UserDetailData {
  const unwrapped = unwrapData(payload);

  if (isRecord(unwrapped) && isManagedUser(unwrapped.user)) {
    return {
      user: unwrapped.user,
      posts: Array.isArray(unwrapped.posts)
        ? (unwrapped.posts as OwnerPost[])
        : null,
    };
  }

  if (isManagedUser(unwrapped)) {
    return { user: unwrapped, posts: null };
  }

  throw new Error("The backend returned an invalid account-detail response.");
}

function unwrapData(payload: unknown): unknown {
  if (isRecord(payload) && "data" in payload) return payload.data;
  return payload;
}

function isManagedUser(value: unknown): value is ManagedUser {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    typeof value.username === "string" &&
    typeof value.first_name === "string" &&
    typeof value.last_name === "string" &&
    typeof value.email === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
