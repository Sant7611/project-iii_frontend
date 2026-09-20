"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, getStoredUser } from "@/lib/auth";
import type { OwnerPost } from "@/lib/types";
import { sanitizeRichContentClient } from "@/lib/rich-content-client";
import { BlogPostView } from "./BlogPostView";
import { parsePlateContent } from "./plate/types";

export function PrivatePostDetail({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<OwnerPost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await authenticatedFetch(`${API_URL}/posts/${id}/`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        if (!cancelled) setError("This post is unavailable.");
        return;
      }
      const value = await response.json() as OwnerPost;
      if (!cancelled) setPost(value);
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function remove() {
    if (!post || !window.confirm(`Delete “${post.title}”?`)) return;
    const response = await authenticatedFetch(`${API_URL}/posts/${post.id}/`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (response.ok) router.push("/profile");
    else setError("This post could not be deleted.");
  }

  if (error) return <div className="empty-state"><p>{error}</p><Link className="button" href="/profile">Back to profile</Link></div>;
  if (!post) return <div className="empty-state"><p>Loading your post…</p></div>;

  const isOwner = post.author === getStoredUser()?.id;
  const safeContent = parsePlateContent(post.content) ? post.content : sanitizeRichContentClient(post.content);

  return (
    <article className="article-layout">
      <div>
        <Link className="text-link" href="/profile"><ArrowLeft size={16} /> Back to profile</Link>
        <header className="article-header">
          <span className={`status-badge ${post.approval_status}`}>{post.approval_status}</span>
          <h1>{post.title}</h1>
          <p className="article-deck">{post.approval_status === "pending" ? "This post is awaiting moderation." : "Private post detail"}</p>
        </header>
        {post.featured_img && <div className="article-hero"><img src={post.featured_img} alt="" /></div>}
        <BlogPostView html={safeContent} className="article-body editor-rich-content" />
        {post.approval_status === "rejected" && <div className="form-error"><strong>Moderator feedback:</strong> {post.rejection_reason}</div>}
        {isOwner && (
          <div className="owner-post-actions">
            <Link className="button button-primary" href={`/write?edit=${post.id}`}>{post.approval_status === "rejected" ? "Edit and resubmit" : "Edit post"}</Link>
            <button className="button danger" onClick={() => void remove()}><Trash2 size={15} /> Delete</button>
          </div>
        )}
      </div>
    </article>
  );
}
