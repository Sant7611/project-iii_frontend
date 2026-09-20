"use client";

import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { API_URL } from "@/lib/api";
import {
  AUTH_CHANGE_EVENT,
  authenticatedFetch,
  getStoredUser,
  hasAuthSession,
} from "@/lib/auth";
import type { Comment } from "@/lib/types";

export function CommentSection({
  postId,
  initialComments,
}: {
  postId: number;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [authenticated, setAuthenticated] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [loadingReplies, setLoadingReplies] = useState<number | null>(null);

  useEffect(() => {
    const syncAuth = () => setAuthenticated(hasAuthSession());
    const initialSync = window.setTimeout(syncAuth, 0);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${postId}/comments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ content: trimmedContent }),
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) {
        if (response.status === 401) setAuthenticated(false);
        throw new Error(commentError(payload, response.status));
      }

      const createdComment = parseCreatedComment(payload);
      setComments((current) => [createdComment, ...current]);
      setContent("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your comment could not be posted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(
    event: FormEvent<HTMLFormElement>,
    parentId: number,
  ) {
    event.preventDefault();
    const trimmedContent = replyContent.trim();
    if (!trimmedContent || replySubmitting) return;

    setReplySubmitting(true);
    setReplyError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${postId}/comments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ content: trimmedContent, parent: parentId }),
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) {
        if (response.status === 401) setAuthenticated(false);
        throw new Error(commentError(payload, response.status));
      }

      const createdReply = parseCreatedComment(payload);
      setComments((current) =>
        current.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: [createdReply, ...(comment.replies || [])],
                reply_count: (comment.reply_count || 0) + 1,
              }
            : comment,
        ),
      );
      setExpandedReplies((current) =>
        current.includes(parentId) ? current : [...current, parentId],
      );
      setReplyingTo(null);
      setReplyContent("");
    } catch (reason) {
      setReplyError(
        reason instanceof Error
          ? reason.message
          : "Your reply could not be posted.",
      );
    } finally {
      setReplySubmitting(false);
    }
  }

  async function toggleReplies(comment: Comment) {
    if (expandedReplies.includes(comment.id)) {
      setExpandedReplies((current) =>
        current.filter((commentId) => commentId !== comment.id),
      );
      return;
    }

    if (comment.replies === undefined && (comment.reply_count || 0) > 0) {
      setLoadingReplies(comment.id);
      setReplyError("");
      try {
        const response = await fetch(
          `${API_URL}/posts/${postId}/comments/${comment.id}/`,
          { headers: { Accept: "application/json" } },
        );
        const payload = await readResponse(response);
        if (!response.ok) {
          throw new Error("Replies could not be loaded.");
        }
        const replies = readReplies(payload);
        setComments((current) =>
          current.map((item) =>
            item.id === comment.id ? { ...item, replies } : item,
          ),
        );
      } catch (reason) {
        setReplyError(
          reason instanceof Error ? reason.message : "Replies could not be loaded.",
        );
        return;
      } finally {
        setLoadingReplies(null);
      }
    }

    setExpandedReplies((current) => [...current, comment.id]);
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="comments-heading">
        <div>
          <span className="kicker">Join the discussion</span>
          <h2 id="comments-title">Conversation</h2>
        </div>
        <span className="comment-count">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {authenticated ? (
        <form className="comment-form" onSubmit={submitComment}>
          <label htmlFor="comment-content">Add a comment</label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add something thoughtful to the conversation…"
            maxLength={2000}
            required
          />
          <div className="comment-form-footer">
            <span>{content.length}/2000</span>
            <button
              className="button button-primary"
              disabled={submitting || !content.trim()}
            >
              <Send size={16} />
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="comment-signin">
          <MessageCircle size={24} />
          <div>
            <strong>Have something to add?</strong>
            <p>
              <Link href="/login">Sign in</Link> to join the conversation.
            </p>
          </div>
        </div>
      )}

      <div className="comment-list">
        {comments.length ? (
          comments.map((comment) => {
            const authorName = commentAuthorName(comment.author);
            const isExpanded = expandedReplies.includes(comment.id);
            const replyCount = comment.reply_count || 0;

            return (
              <article className="comment" key={comment.id}>
                <div className="comment-author" aria-hidden="true">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{authorName}</strong>
                  <p>{comment.content}</p>
                  <time dateTime={comment.created_at}>
                    {formatCommentDate(comment.created_at)}
                  </time>
                  <div className="comment-actions">
                    {authenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextId = replyingTo === comment.id ? null : comment.id;
                          setReplyingTo(nextId);
                          setReplyContent("");
                          setReplyError("");
                        }}
                        aria-expanded={replyingTo === comment.id}
                      >
                        Reply
                      </button>
                    )}
                    {replyCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void toggleReplies(comment)}
                        aria-expanded={isExpanded}
                        disabled={loadingReplies === comment.id}
                      >
                        {loadingReplies === comment.id
                          ? "Loading replies…"
                          : isExpanded
                            ? "Hide replies"
                            : `Show ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
                      </button>
                    )}
                  </div>

                  {replyingTo === comment.id && (
                    <form
                      className="comment-reply-form"
                      onSubmit={(event) => void submitReply(event, comment.id)}
                    >
                      <label htmlFor={`reply-${comment.id}`}>Reply to {authorName}</label>
                      <textarea
                        id={`reply-${comment.id}`}
                        value={replyContent}
                        onChange={(event) => setReplyContent(event.target.value)}
                        placeholder="Write a reply…"
                        maxLength={2000}
                        required
                      />
                      <div className="comment-reply-footer">
                        <span>{replyContent.length}/2000</span>
                        <div>
                          <button
                            type="button"
                            className="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                              setReplyError("");
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="button button-primary"
                            disabled={replySubmitting || !replyContent.trim()}
                          >
                            {replySubmitting ? "Posting…" : "Post reply"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {replyingTo === comment.id && replyError && (
                    <p className="form-error" role="alert">
                      {replyError}
                    </p>
                  )}

                  {isExpanded && comment.replies && (
                    <div className="comment-replies">
                      {comment.replies.map((reply) => {
                        const replyAuthor = commentAuthorName(reply.author);
                        return (
                          <article className="comment comment-reply" key={reply.id}>
                            <div className="comment-author" aria-hidden="true">
                              {replyAuthor.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{replyAuthor}</strong>
                              <p>{reply.content}</p>
                              <time dateTime={reply.created_at}>
                                {formatCommentDate(reply.created_at)}
                              </time>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="comments-empty">
            <MessageCircle size={28} />
            <p>No comments yet. Be the first to add context.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function commentAuthorName(author: Comment["author"]): string {
  if (typeof author === "string" && author.trim()) return author.trim();
  if (typeof author === "number") return `User ${author}`;
  if (author && typeof author === "object") {
    if (typeof author.username === "string" && author.username.trim()) {
      return author.username.trim();
    }
    const fullName = [author.first_name, author.last_name]
      .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
      .join(" ")
      .trim();
    if (fullName) return fullName;
  }
  return "Unknown user";
}

function parseCreatedComment(payload: unknown): Comment {
  if (!payload || typeof payload !== "object") {
    throw new Error("The server returned an invalid comment.");
  }

  const comment = payload as Partial<Comment>;
  if (
    typeof comment.id !== "number" ||
    typeof comment.content !== "string" ||
    typeof comment.created_at !== "string"
  ) {
    throw new Error("The server returned an invalid comment.");
  }

  const currentUsername = getStoredUser()?.username;
  return {
    ...comment,
    id: comment.id,
    author: currentUsername || comment.author || null,
    parent: typeof comment.parent === "number" ? comment.parent : null,
    content: comment.content,
    created_at: comment.created_at,
  };
}

function readReplies(payload: unknown): Comment[] {
  if (!payload || typeof payload !== "object") return [];
  const replies = (payload as { replies?: unknown }).replies;
  return Array.isArray(replies) ? (replies as Comment[]) : [];
}

function formatCommentDate(value: string): string {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function commentError(payload: unknown, status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (!payload || typeof payload !== "object") {
    return "Your comment could not be posted.";
  }

  const details = payload as Record<string, unknown>;
  if (typeof details.detail === "string") return details.detail;
  if (typeof details.message === "string") return details.message;
  if (Array.isArray(details.content)) return details.content.join(" ");
  return "Your comment could not be posted.";
}
