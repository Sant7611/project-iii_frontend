"use client";

import Link from "next/link";
import { MessageCircle, Pencil, Send, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { API_URL } from "@/lib/api";
import {
  AUTH_CHANGE_EVENT,
  authenticatedFetch,
  getStoredUser,
  hasAuthSession,
} from "@/lib/auth";
import type { Comment } from "@/lib/types";
import { UserAvatar } from "./user-avatar";

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
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [loadingReplies, setLoadingReplies] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingBusy, setEditingBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const syncAuth = () => setAuthenticated(hasAuthSession());
    const initial = window.setTimeout(syncAuth, 0);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const currentUsername = authenticated ? getStoredUser()?.username || "" : "";

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = content.trim();
    if (!value || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${postId}/comments/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ content: value }),
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(commentError(payload, response.status));

      const created = parseComment(payload, currentUsername);
      setComments(current => [created, ...current]);
      setContent("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your comment could not be posted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(event: FormEvent<HTMLFormElement>, parentId: number) {
    event.preventDefault();
    const value = replyContent.trim();
    if (!value || replySubmitting) return;

    setReplySubmitting(true);
    setActionError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${postId}/comments/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ content: value, parent: parentId }),
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(commentError(payload, response.status));

      const created = parseComment(payload, currentUsername);
      setComments(current =>
        current.map(comment =>
          comment.id === parentId
            ? {
                ...comment,
                replies: [created, ...(comment.replies || [])],
                reply_count: (comment.reply_count || 0) + 1,
              }
            : comment,
        ),
      );
      setExpandedReplies(current =>
        current.includes(parentId) ? current : [...current, parentId],
      );
      setReplyingTo(null);
      setReplyContent("");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Your reply could not be posted.");
    } finally {
      setReplySubmitting(false);
    }
  }

  async function toggleReplies(comment: Comment) {
    if (expandedReplies.includes(comment.id)) {
      setExpandedReplies(current => current.filter(id => id !== comment.id));
      return;
    }

    if (comment.replies === undefined && (comment.reply_count || 0) > 0) {
      setLoadingReplies(comment.id);
      setActionError("");
      try {
        const response = await fetch(
          `${API_URL}/posts/${postId}/comments/${comment.id}/`,
          { headers: { Accept: "application/json" } },
        );
        const payload = await readResponse(response);
        if (!response.ok) throw new Error("Replies could not be loaded.");
        const replies = readReplies(payload);
        setComments(current =>
          current.map(item => item.id === comment.id ? { ...item, replies } : item),
        );
      } catch (reason) {
        setActionError(reason instanceof Error ? reason.message : "Replies could not be loaded.");
        return;
      } finally {
        setLoadingReplies(null);
      }
    }

    setExpandedReplies(current => [...current, comment.id]);
  }

  function beginEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditingContent(comment.content);
    setActionError("");
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>, commentId: number) {
    event.preventDefault();
    const value = editingContent.trim();
    if (!value || editingBusy) return;

    setEditingBusy(true);
    setActionError("");
    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${postId}/comments/${commentId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ content: value }),
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) throw new Error(commentError(payload, response.status));
      setComments(current => updateCommentContent(current, commentId, value));
      setEditingId(null);
      setEditingContent("");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The comment could not be updated.");
    } finally {
      setEditingBusy(false);
    }
  }

  async function deleteComment(commentId: number) {
    if (!window.confirm("Delete this comment?")) return;
    setDeletingId(commentId);
    setActionError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/posts/${postId}/comments/${commentId}/`,
        { method: "DELETE", headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        const payload = await readResponse(response);
        throw new Error(commentError(payload, response.status));
      }
      setComments(current => removeComment(current, commentId));
      if (editingId === commentId) {
        setEditingId(null);
        setEditingContent("");
      }
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The comment could not be deleted.");
    } finally {
      setDeletingId(null);
    }
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
            onChange={event => setContent(event.target.value)}
            placeholder="Add something thoughtful to the conversation…"
            maxLength={2000}
            required
          />
          <div className="comment-form-footer">
            <span>{content.length}/2000</span>
            <button className="button button-primary" disabled={submitting || !content.trim()}>
              <Send size={16} />
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      ) : (
        <div className="comment-signin">
          <MessageCircle size={24} />
          <div>
            <strong>Have something to add?</strong>
            <p><Link href="/login">Sign in</Link> to join the conversation.</p>
          </div>
        </div>
      )}

      {actionError && <p className="form-error" role="alert">{actionError}</p>}

      <div className="comment-list">
        {comments.length ? comments.map(comment => {
          const authorName = commentAuthorName(comment.author);
          const own = Boolean(currentUsername && authorName === currentUsername);
          const isExpanded = expandedReplies.includes(comment.id);
          const replyCount = comment.reply_count || 0;

          return (
            <article className="comment" key={comment.id}>
              <UserAvatar avatarUrl={comment.author_avatar} username={authorName} size={38} className="comment-author-avatar" />
              <div>
                <strong>{authorName}</strong>

                {editingId === comment.id ? (
                  <EditForm
                    id={comment.id}
                    value={editingContent}
                    busy={editingBusy}
                    onChange={setEditingContent}
                    onCancel={() => { setEditingId(null); setEditingContent(""); }}
                    onSubmit={submitEdit}
                  />
                ) : (
                  <p>{comment.content}</p>
                )}

                <time dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
                <div className="comment-actions">
                  {authenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyContent("");
                        setActionError("");
                      }}
                    >
                      Reply
                    </button>
                  )}
                  {own && editingId !== comment.id && (
                    <button type="button" onClick={() => beginEdit(comment)}>
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                  {own && (
                    <button
                      type="button"
                      className="danger-action"
                      onClick={() => void deleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                    >
                      <Trash2 size={12} /> {deletingId === comment.id ? "Deleting…" : "Delete"}
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
                  <form className="comment-reply-form" onSubmit={event => void submitReply(event, comment.id)}>
                    <label htmlFor={`reply-${comment.id}`}>Reply to {authorName}</label>
                    <textarea
                      id={`reply-${comment.id}`}
                      value={replyContent}
                      onChange={event => setReplyContent(event.target.value)}
                      placeholder="Write a reply…"
                      maxLength={2000}
                      required
                    />
                    <div className="comment-reply-footer">
                      <span>{replyContent.length}/2000</span>
                      <div>
                        <button type="button" className="button" onClick={() => { setReplyingTo(null); setReplyContent(""); }}>Cancel</button>
                        <button className="button button-primary" disabled={replySubmitting || !replyContent.trim()}>
                          {replySubmitting ? "Posting…" : "Post reply"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {isExpanded && comment.replies && (
                  <div className="comment-replies">
                    {comment.replies.map(reply => {
                      const replyAuthor = commentAuthorName(reply.author);
                      const ownReply = Boolean(currentUsername && replyAuthor === currentUsername);
                      return (
                        <article className="comment comment-reply" key={reply.id}>
                          <UserAvatar avatarUrl={reply.author_avatar} username={replyAuthor} size={32} className="comment-author-avatar" />
                          <div>
                            <strong>{replyAuthor}</strong>
                            {editingId === reply.id ? (
                              <EditForm
                                id={reply.id}
                                value={editingContent}
                                busy={editingBusy}
                                onChange={setEditingContent}
                                onCancel={() => { setEditingId(null); setEditingContent(""); }}
                                onSubmit={submitEdit}
                              />
                            ) : (
                              <p>{reply.content}</p>
                            )}
                            <time dateTime={reply.created_at}>{formatCommentDate(reply.created_at)}</time>
                            {ownReply && (
                              <div className="comment-actions">
                                {editingId !== reply.id && <button type="button" onClick={() => beginEdit(reply)}><Pencil size={12} /> Edit</button>}
                                <button
                                  type="button"
                                  className="danger-action"
                                  onClick={() => void deleteComment(reply.id)}
                                  disabled={deletingId === reply.id}
                                >
                                  <Trash2 size={12} /> {deletingId === reply.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          );
        }) : (
          <div className="comments-empty">
            <MessageCircle size={28} />
            <p>No comments yet. Be the first to add context.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function EditForm({
  id,
  value,
  busy,
  onChange,
  onCancel,
  onSubmit,
}: {
  id: number;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: number) => Promise<void>;
}) {
  return (
    <form className="comment-reply-form" onSubmit={event => void onSubmit(event, id)}>
      <label htmlFor={`edit-comment-${id}`}>Edit comment</label>
      <textarea
        id={`edit-comment-${id}`}
        value={value}
        onChange={event => onChange(event.target.value)}
        maxLength={2000}
        required
      />
      <div className="comment-reply-footer">
        <span>{value.length}/2000</span>
        <div>
          <button type="button" className="button" onClick={onCancel}>Cancel</button>
          <button className="button button-primary" disabled={busy || !value.trim()}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}

function updateCommentContent(comments: Comment[], id: number, content: string): Comment[] {
  return comments.map(comment => {
    if (comment.id === id) return { ...comment, content };
    if (!comment.replies) return comment;
    return {
      ...comment,
      replies: comment.replies.map(reply => reply.id === id ? { ...reply, content } : reply),
    };
  });
}

function removeComment(comments: Comment[], id: number): Comment[] {
  if (comments.some(comment => comment.id === id)) {
    return comments.filter(comment => comment.id !== id);
  }

  return comments.map(comment => {
    if (!comment.replies?.some(reply => reply.id === id)) return comment;
    return {
      ...comment,
      replies: comment.replies.filter(reply => reply.id !== id),
      reply_count: Math.max(0, (comment.reply_count || 0) - 1),
    };
  });
}

function commentAuthorName(author: Comment["author"]): string {
  if (typeof author === "string" && author.trim()) return author.trim();
  if (typeof author === "number") return `User ${author}`;
  if (author && typeof author === "object") {
    if (typeof author.username === "string" && author.username.trim()) return author.username.trim();
    const fullName = [author.first_name, author.last_name]
      .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
      .join(" ")
      .trim();
    if (fullName) return fullName;
  }
  return "Unknown user";
}

function parseComment(payload: unknown, currentUsername: string): Comment {
  const value = payload && typeof payload === "object" && "data" in payload
    ? (payload as { data?: unknown }).data
    : payload;

  if (!value || typeof value !== "object") {
    throw new Error("The server returned an invalid comment.");
  }

  const comment = value as Partial<Comment>;
  if (
    typeof comment.id !== "number" ||
    typeof comment.content !== "string" ||
    typeof comment.created_at !== "string"
  ) {
    throw new Error("The server returned an invalid comment.");
  }

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
  const value = payload && typeof payload === "object" && "data" in payload
    ? (payload as { data?: unknown }).data
    : payload;
  if (!value || typeof value !== "object") return [];
  const replies = (value as { replies?: unknown }).replies;
  return Array.isArray(replies) ? replies as Comment[] : [];
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
  try { return JSON.parse(text); }
  catch { return { message: text }; }
}

function commentError(payload: unknown, status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (!payload || typeof payload !== "object") return "The comment action could not be completed.";
  const details = payload as Record<string, unknown>;
  if (typeof details.detail === "string") return details.detail;
  if (typeof details.message === "string") return details.message;
  if (Array.isArray(details.content)) return details.content.join(" ");
  return "The comment action could not be completed.";
}
