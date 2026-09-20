"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, Eye } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { articleHref } from "@/lib/api";
import { contentExcerpt, contentWordCount } from "@/lib/content-text";
import type { Post } from "@/lib/types";
import { UserAvatar } from "./user-avatar";
import { SavePostButton } from "./save-post-button";

function readTime(content: string) { return Math.max(1, Math.ceil(contentWordCount(content) / 210)); }
function date(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

export function PostCard({
  post,
  featured = false,
  onPostClick,
  href = articleHref(post),
  actions,
}: {
  post: Post;
  featured?: boolean;
  onPostClick?: () => void;
  href?: string;
  actions?: ReactNode;
}) {
  const hue = post.id % 4;
  const blockNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onPostClick) return;
    event.preventDefault();
    onPostClick();
  };

  if (featured) return (
    <article className="featured-card">
      <div className={`featured-art art-${hue}`}>
        {post.featured_img ? <img src={post.featured_img} alt="" /> : <><span className="art-code">{post.short_code || "Q"}</span><div className="art-shape" /></>}
      </div>
      <div className="featured-copy">
        <div className="tag-row">{post.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>
        <h3><Link href={href} onClick={blockNavigation}>{post.title}</Link></h3>
        <p>{contentExcerpt(post.content, 220)}</p>
        <div className="post-meta author-meta">
          <UserAvatar userId={post.author} avatarUrl={post.author_avatar} username={post.author_username} size={30} />
          <span>By {post.author_username || "TFacts writer"}</span>
          <span>{date(post.created_at)}</span>
          <span><Clock3 size={14} /> {readTime(post.content)} min read</span>
        </div>
        <Link className="read-link" href={href} onClick={blockNavigation}>Read the full story <ArrowUpRight size={17} /></Link>
      </div>
    </article>
  );

  return (
    <article className="post-card">
      <Link href={href} className={`post-art art-${hue}`} aria-label={`Read ${post.title}`} onClick={blockNavigation}>
        {post.featured_img ? <img src={post.featured_img} alt="" /> : <><span>{String(post.id).slice(-2).padStart(2, "0")}</span><div className="mini-shape" /></>}
      </Link>
      <div className="tag-row">{post.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>
      <h3><Link href={href} onClick={blockNavigation}>{post.title}</Link></h3>
      <p>{contentExcerpt(post.content)}</p>
      <div className="card-footer">
        <UserAvatar userId={post.author} avatarUrl={post.author_avatar} username={post.author_username} size={25} />
        <span>{post.author_username || "TFacts writer"}</span>
        <span><Eye size={14} /> {post.view_count.toLocaleString()}</span>
        <SavePostButton postId={post.id} />
      </div>
      {actions && <div className="post-card-actions">{actions}</div>}
    </article>
  );
}
