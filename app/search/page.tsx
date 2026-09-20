import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/api";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = ((await searchParams).q || "").trim();
  const { posts } = await getPosts();
  const words = query.toLowerCase();
  const results = query.length > 1 ? posts.filter((post) => [post.title, post.content, post.author_username, ...post.tags].join(" ").toLowerCase().includes(words)) : [];
  return (
    <>
      <header className="page-heading"><span className="kicker">Search tfacts</span><h1>{query ? `Results for “${query}”` : "What are you curious about?"}</h1><p>{query ? `${results.length} ${results.length === 1 ? "story" : "stories"} matched your search.` : "Use the search field above to find a fact, topic, or idea."}</p></header>
      {results.length ? <div className="post-grid">{results.map((post) => <PostCard key={post.id} post={post} />)}</div> : <div className="empty-state"><SearchX size={34} /><h2>No matching facts yet</h2><p>Try a shorter phrase or browse all topics.</p><Link className="button button-primary" href="/explore">Explore topics</Link></div>}
    </>
  );
}
