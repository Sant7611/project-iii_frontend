import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Explore technology facts",
  description: "Browse practical technology facts and explainers across AI, software, security, the web, and more.",
  alternates: { canonical: "/explore" },
};

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const { posts } = await getPosts();
  const tags = [...new Set(posts.flatMap((post) => post.tags))];
  const filtered = tag ? posts.filter((post) => post.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) : posts;
  return (
    <>
      <header className="page-heading"><span className="kicker">Keep looking closer</span><h1>Explore the curious side of tech.</h1><p>Facts, context, and clear explanations—organized for wandering minds.</p></header>
      <nav className="filter-row" aria-label="Filter by topic"><Link className={`filter-chip ${!tag ? "active" : ""}`} href="/explore">All topics</Link>{tags.map((item) => <Link className={`filter-chip ${tag?.toLowerCase() === item.toLowerCase() ? "active" : ""}`} href={`/explore?tag=${encodeURIComponent(item)}`} key={item}>{item}</Link>)}</nav>
      <div className="post-grid explore-grid">{filtered.map((post) => <PostCard key={post.id} post={post} />)}</div>
    </>
  );
}
