import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Eye } from "lucide-react";
import { getComments, getPost } from "@/lib/api";
import { CommentSection } from "@/components/comment-section";
import { CopyLinkButton } from "@/components/copy-link-button";
import { SavePostButton } from "@/components/save-post-button";
import { LikeButton } from "@/components/like-button";
import { BlogPostView } from "@/components/BlogPostView";
import { richTextSummary, richTextWordCount, sanitizeRichContent } from "@/lib/rich-content";
import { parsePlateContent } from "@/components/plate/types";

function summary(content: string, length = 165) { return richTextSummary(content, length); }
function readTime(content: string) { return Math.max(1, Math.ceil(richTextWordCount(content) / 210)); }

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id, slug } = await params;
  const { post } = await getPost(id);
  if (!post) return { title: "Story not found" };
  const canonical = `/articles/${post.id}/${post.slug || slug}`;
  return {
    title: post.title,
    description: summary(post.content),
    authors: [{ name: post.author_username || "TFacts" }],
    alternates: { canonical },
    openGraph: { type: "article", title: post.title, description: summary(post.content), url: canonical, publishedTime: post.created_at, modifiedTime: post.updated_at, tags: post.tags, images: post.featured_img ? [{ url: post.featured_img }] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const { post } = await getPost(id);
  if (!post) notFound();
  const comments = await getComments(post.id);
  const safeContent = parsePlateContent(post.content) ? post.content : sanitizeRichContent(post.content);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/articles/${post.id}/${post.slug}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: summary(post.content), datePublished: post.created_at, dateModified: post.updated_at, author: { "@type": "Person", name: post.author_username || "TFacts writer" }, publisher: { "@type": "Organization", name: "TFacts" }, mainEntityOfPage: url, image: post.featured_img || undefined };

  return (
    <div className="article-layout">
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <header className="article-header">
          <div className="tag-row">{post.tags.map(tag => <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div>
          <h1>{post.title}</h1>
          <p className="article-deck">{summary(post.content, 230)}</p>
          <div className="post-meta">
            <span>By {post.author_username || "TFacts writer"}</span>
            <span>{new Date(post.created_at).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span><Clock3 size={14} /> {readTime(post.content)} min read</span>
            <span><Eye size={14} /> {post.view_count.toLocaleString()} views</span>
          </div>
        </header>

        <div className={`article-hero art-${post.id % 4}`}>
          {post.featured_img ? <img src={post.featured_img} alt="" /> : <><span className="art-code">{post.short_code || "Q"}</span><div className="art-shape" /></>}
        </div>

        <div className="article-mobile-actions"><LikeButton postId={post.id} /><SavePostButton postId={post.id} /><CopyLinkButton url={url} /></div>
        <BlogPostView html={safeContent} className="article-body editor-rich-content" />
        <CommentSection postId={post.id} initialComments={comments} />
      </article>

      <aside className="article-aside" aria-label="Story actions">
        <div className="aside-box">
          <span className="kicker">Keep it close</span>
          <strong>Enjoyed this story?</strong>
          <p>Like it to improve your recommendations, save it for later, or share it.</p>
          <div className="article-action-stack"><LikeButton postId={post.id} /><SavePostButton postId={post.id} /><CopyLinkButton url={url} /></div>
        </div>
      </aside>
    </div>
  );
}
