import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Sparkles } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { searchPosts } from "@/lib/api";

export const metadata: Metadata = { title: "Search | Quillora", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = ((await searchParams).q || "").trim();
  let results = [];
  let unavailable = false;

  if (query.length >= 3) {
    try { results = await searchPosts(query); }
    catch { unavailable = true; }
  }

  return (
    <>
      <header className="page-heading search-heading">
        <span className="kicker"><Sparkles size={14} /> Backend relevance search</span>
        <h1>{query ? `Results for “${query}”` : "Search Quillora"}</h1>
        <p>Results are ranked by the project’s TF-IDF search algorithm using words from each post title and body.</p>
      </header>

      {query.length > 0 && query.length < 3 && <div className="notice">Enter at least 3 characters to search.</div>}
      {unavailable && <div className="notice">The search API could not be reached.</div>}

      {results.length > 0 ? (
        <div className="post-grid">{results.map((post: any) => <PostCard key={post.id} post={post} />)}</div>
      ) : query.length >= 3 && !unavailable ? (
        <div className="empty-state"><SearchX size={34} /><h2>No matching stories</h2><p>Try a different phrase or browse the full feed.</p><Link className="button button-primary" href="/explore">Explore stories</Link></div>
      ) : null}
    </>
  );
}
