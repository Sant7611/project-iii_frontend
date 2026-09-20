import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Explore stories",
  description: "Browse approved TFacts stories by topic and discover new writers and ideas.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const { posts } = await getPosts();
  const tags = [...new Set(posts.flatMap(post => post.tags))];
  const filtered = tag ? posts.filter(post => post.tags.some(item => item.toLowerCase() === tag.toLowerCase())) : posts;
  return (
    <>
      <header className="page-heading"><span className="kicker">Discover more</span><h1>Explore ideas from the community.</h1><p>Browse approved stories by topic, writer, and interest.</p></header>
      <nav className="filter-row" aria-label="Filter by topic"><Link className={`filter-chip ${!tag ? "active" : ""}`} href="/explore">All topics</Link>{tags.map(item => <Link className={`filter-chip ${tag?.toLowerCase() === item.toLowerCase() ? "active" : ""}`} href={`/explore?tag=${encodeURIComponent(item)}`} key={item}>{item}</Link>)}</nav>
      <div className="post-grid explore-grid">{filtered.map(post => <PostCard key={post.id} post={post} />)}</div>
    </>
  );
}
