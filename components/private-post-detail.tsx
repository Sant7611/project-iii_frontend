"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth";
import { getStoredUser } from "@/lib/auth";
import type { OwnerPost } from "@/lib/types";
import { sanitizeRichContentClient } from "@/lib/rich-content-client";

export function PrivatePostDetail({ id }: { id: string }) {
  const router = useRouter(); const [post, setPost] = useState<OwnerPost | null>(null); const [error, setError] = useState("");
  useEffect(() => { void (async () => { const response = await authenticatedFetch(`${API_URL}/posts/${id}/`, { headers: { Accept: "application/json" } }); if (!response.ok) { setError("This post is unavailable."); return; } setPost(await response.json() as OwnerPost); })(); }, [id]);
  async function remove() { if (!post || !window.confirm(`Delete “${post.title}”?`)) return; const response = await authenticatedFetch(`${API_URL}/posts/${post.id}/`, { method: "DELETE", headers: { Accept: "application/json" } }); if (response.ok) router.push("/profile"); else setError("This post could not be deleted."); }
  if (error) return <div className="empty-state"><p>{error}</p><Link className="button" href="/profile">Back to profile</Link></div>;
  if (!post) return <div className="empty-state"><p>Loading your post…</p></div>;
  const isOwner = post.author === getStoredUser()?.id;
  return <article className="article-layout"><div><Link className="text-link" href="/profile"><ArrowLeft size={16} /> Back to profile</Link><header className="article-header"><h1>{post.title}</h1><p className="article-deck">Private post detail</p></header>{post.featured_img && <div className="article-hero"><img src={post.featured_img} alt="" /></div>}<div className="article-body editor-output-wrapper editor-rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRichContentClient(post.content) }} />{post.approval_status === "rejected" && <div className="form-error"><strong>Moderator feedback:</strong> {post.rejection_reason}</div>}{isOwner && <div className="owner-post-actions"><Link className="button button-primary" href={`/write?edit=${post.id}`}>Edit and resubmit</Link><button className="button danger" onClick={() => void remove()}><Trash2 size={15} /> Delete</button></div>}</div></article>;
}
