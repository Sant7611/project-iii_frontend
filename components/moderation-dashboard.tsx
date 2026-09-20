"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, getStoredUser, hasAuthSession } from "@/lib/auth";
import type { OwnerPost, Paginated } from "@/lib/types";
import { PostCard } from "./post-card";
import { sanitizeRichContentClient } from "@/lib/rich-content-client";
import { BlogPostView } from "./BlogPostView";
import { parsePlateContent } from "./plate/types";

type Filter = "pending" | "approved" | "rejected" | "all";
type ModerationAction = "accept" | "reject";

export function ModerationDashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<OwnerPost[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rejectingPostId, setRejectingPostId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actingPostId, setActingPostId] = useState<number | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      if (!hasAuthSession()) {
        router.replace("/login?next=%2Fmoderation");
        return;
      }

      const actor = getStoredUser();
      if (!actor || !["moderator", "super_admin"].includes(actor.role)) {
        if (!cancelled) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setAllowed(true);

      try {
        const items = await fetchModerationPosts();
        if (cancelled) return;
        setPosts(items);
      } catch {
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const counts = useMemo(
    () => ({
      all: posts.length,
      pending: posts.filter((post) => post.approval_status === "pending").length,
      approved: posts.filter((post) => post.approval_status === "approved").length,
      rejected: posts.filter((post) => post.approval_status === "rejected").length,
    }),
    [posts],
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? posts
        : posts.filter((post) => post.approval_status === filter),
    [posts, filter],
  );

  function openRejectionForm(postId: number) {
    setMessage("");
    setError("");
    setRejectingPostId(postId);
    setRejectionReason("");
  }

  function closeRejectionForm() {
    setRejectingPostId(null);
    setRejectionReason("");
    setError("");
  }

  function togglePreview(postId: number) {
    setExpandedPostId((current) => (current === postId ? null : postId));
  }

  async function submitRejection(
    event: FormEvent<HTMLFormElement>,
    post: OwnerPost,
  ) {
    event.preventDefault();
    const reason = rejectionReason.trim();
    if (!reason) {
      setError("A rejection reason is required.");
      return;
    }
    await moderate(post, "reject", reason);
  }

  async function moderate(
    post: OwnerPost,
    action: ModerationAction,
    reason = "",
  ) {
    if (actingPostId !== null) return;

    const nextStatus = action === "accept" ? "approved" : "rejected";
    const optimisticPost: OwnerPost = {
      ...post,
      approval_status: nextStatus,
      rejection_reason: action === "reject" ? reason : "",
    };

    setMessage("");
    setError("");
    setActingPostId(post.id);

    // Move the item out of the Pending queue immediately. If the API call
    // fails, the original post is restored below.
    setPosts((items) =>
      items.map((item) => (item.id === post.id ? optimisticPost : item)),
    );

    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${post.id}/${action}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: action === "reject" ? JSON.stringify({ reason }) : "{}",
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(moderationError(payload));

      const returnedPost = extractPost(payload);
      if (returnedPost) {
        setPosts((items) =>
          items.map((item) => (item.id === post.id ? returnedPost : item)),
        );
      }

      setRejectingPostId(null);
      setRejectionReason("");
      setExpandedPostId((current) => (current === post.id ? null : current));
      setMessage(
        action === "accept"
          ? `“${post.title}” was approved and removed from the pending queue.`
          : `“${post.title}” was rejected and removed from the pending queue.`,
      );
    } catch (reasonCaught) {
      setPosts((items) =>
        items.map((item) => (item.id === post.id ? post : item)),
      );
      setError(
        reasonCaught instanceof Error
          ? reasonCaught.message
          : "The moderation action could not be completed.",
      );
    } finally {
      setActingPostId(null);
    }
  }

  if (loading)
    return (
      <div className="empty-state">
        <p>Checking moderation access…</p>
      </div>
    );

  if (!allowed)
    return (
      <div className="empty-state">
        <ShieldAlert size={36} />
        <h2>Moderator access required</h2>
        <p>
          This workspace is available only to moderators and super admins.
        </p>
      </div>
    );

  return (
    <>
      <header className="page-heading">
        <span className="kicker">Keep the signal clear</span>
        <h1>Post moderation</h1>
        <p>
          Review submissions, approve strong posts, and return anything that
          needs stronger context.
        </p>
      </header>

      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}

      <section className="profile-stats">
        <div>
          <strong>{counts.all}</strong>
          <span>Total loaded</span>
        </div>
        <div>
          <strong>
            {counts.pending}
          </strong>
          <span>Pending</span>
        </div>
        <div>
          <strong>
            {counts.approved}
          </strong>
          <span>Approved</span>
        </div>
        <div>
          <strong>
            {counts.rejected}
          </strong>
          <span>Rejected</span>
        </div>
      </section>

      <div className="filter-row moderation-filters">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map(
          (item) => (
            <button
              className={`filter-chip ${filter === item ? "active" : ""}`}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item[0].toUpperCase() + item.slice(1)} ({counts[item]})
            </button>
          ),
        )}
      </div>

      {visible.length ? (
        <div className="post-grid">
          {visible.map((post) => (
            <div className="owner-post moderation-post" key={post.id}>
              <span className={`status-badge ${post.approval_status}`}>
                {post.approval_status}
              </span>
              <PostCard
                post={post}
                href={`#moderation-preview-${post.id}`}
                onPostClick={() => togglePreview(post.id)}
              />
              <button
                className="moderation-preview-toggle"
                type="button"
                aria-expanded={expandedPostId === post.id}
                onClick={() => setExpandedPostId((current) => current === post.id ? null : post.id)}
              >
                {expandedPostId === post.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expandedPostId === post.id ? "Hide full post" : "View full post"}
              </button>
              {expandedPostId === post.id && (
                <article className="moderation-full-preview" id={`moderation-preview-${post.id}`}>
                  <header>
                    <span className="kicker">Full submission preview</span>
                    <h2>{post.title}</h2>
                    <p>By {post.author_username || "TFacts writer"}</p>
                  </header>
                  {post.featured_img && (
                    <img className="moderation-preview-image" src={post.featured_img} alt="" />
                  )}
                  <BlogPostView
                    html={parsePlateContent(post.content) ? post.content : sanitizeRichContentClient(post.content)}
                    className="article-body editor-rich-content"
                  />
                  <div className="tag-row moderation-preview-tags">
                    {post.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </article>
              )}
              {post.approval_status === "pending" &&
                (rejectingPostId === post.id ? (
                  <form
                    className="moderation-rejection-form"
                    onSubmit={(event) => submitRejection(event, post)}
                  >
                    <label htmlFor={`rejection-reason-${post.id}`}>
                      Reason for rejection
                    </label>
                    <textarea
                      id={`rejection-reason-${post.id}`}
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      placeholder="Explain clearly what the author should improve…"
                      maxLength={1000}
                      required
                    />
                    <div className="moderation-rejection-footer">
                      <span>{rejectionReason.length}/1000</span>
                      <div>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={closeRejectionForm}
                          disabled={actingPostId === post.id}
                        >
                          Cancel
                        </button>
                        <button
                          className="button reject-button"
                          disabled={
                            !rejectionReason.trim() || actingPostId === post.id
                          }
                        >
                          <X size={16} />
                          {actingPostId === post.id
                            ? "Rejecting…"
                            : "Confirm rejection"}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="moderation-actions">
                    <button
                      className="button approve-button"
                      onClick={() => moderate(post, "accept")}
                      disabled={actingPostId !== null}
                    >
                      <Check size={16} />
                      {actingPostId === post.id ? "Approving…" : "Approve"}
                    </button>
                    <button
                      className="button reject-button"
                      onClick={() => openRejectionForm(post.id)}
                      disabled={actingPostId !== null}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Check size={36} />
          <h2>Queue is clear</h2>
          <p>
            There are no {filter === "all" ? "" : filter} posts to review.
          </p>
        </div>
      )}
    </>
  );
}

async function fetchModerationPosts() {
  let url: string | null = `${API_URL}/posts/`;
  const items: OwnerPost[] = [];
  let pages = 0;

  while (url && pages < 20) {
    const response: Response = await authenticatedFetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error();
    const data: Paginated<OwnerPost> | OwnerPost[] = await response.json();
    if (Array.isArray(data)) {
      items.push(...data);
      url = null;
    } else {
      items.push(...data.results);
      url = data.next;
    }
    pages += 1;
  }

  return items;
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

function moderationError(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "The backend could not complete that moderation action.";
  }
  const details = payload as Record<string, unknown>;
  if (typeof details.message === "string") return details.message;
  if (typeof details.detail === "string") return details.detail;
  return "The backend could not complete that moderation action.";
}

function extractPost(payload: unknown): OwnerPost | null {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as { data?: { post?: OwnerPost } };
  return response.data?.post || null;
}
