import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { PersonalizedFeed } from "@/components/personalized-feed";
import { getPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "TFacts — Ideas worth reading",
  description: "Discover thoughtful blog posts with relevance search, personalized recommendations, likes, comments, saves, and community publishing.",
};

export default async function HomePage() {
  const { posts, available } = await getPosts();
  const [featured, ...rest] = posts;
  const tags = [...new Set(posts.flatMap(post => post.tags || []))].slice(0, 10);

  return (
    <>
      <section className="quillora-hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> A smarter way to discover writing</span>
          <h1>Stories that stay with you.</h1>
          <p>Read thoughtful posts, find ideas with relevance-ranked search, and discover recommendations shaped by what you genuinely like.</p>
          <div className="hero-actions">
            <Link href="/explore" className="button button-primary">Explore stories <ArrowRight size={17} /></Link>
            <Link href="/write" className="button button-secondary">Start writing</Link>
          </div>
          <div className="hero-proof">
            <span><Search size={16} /> TF-IDF relevance search</span>
            <span><Sparkles size={16} /> Collaborative recommendations</span>
            <span><BookOpen size={16} /> Community publishing</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="paper-card paper-one"><span>01</span><strong>Find what matters.</strong></div>
          <div className="paper-card paper-two"><span>02</span><strong>Read deeply.</strong></div>
          <div className="paper-card paper-three"><span>03</span><strong>Join the conversation.</strong></div>
        </div>
      </section>

      {!available && <div className="notice">The Django API is currently unreachable. TFacts will populate automatically when the backend is running.</div>}

      {featured && (
        <section className="section">
          <div className="section-heading"><div><span className="kicker">Featured</span><h2>A story worth opening</h2></div><Link href="/explore">See all <ArrowRight size={15} /></Link></div>
          <PostCard post={featured} featured />
        </section>
      )}

      <PersonalizedFeed />

      <section className="section">
        <div className="section-heading"><div><span className="kicker">Latest</span><h2>Fresh from the community</h2></div><Link href="/explore">Explore all <ArrowRight size={15} /></Link></div>
        <div className="post-grid">{rest.slice(0, 6).map(post => <PostCard key={post.id} post={post} />)}</div>
      </section>

      {tags.length > 0 && (
        <section className="topic-panel">
          <div><span className="kicker">Browse interests</span><h2>Follow your curiosity.</h2><p>Jump into the topics writers are publishing about right now.</p></div>
          <div className="topic-cloud">{tags.map(tag => <Link href={`/explore?tag=${encodeURIComponent(tag)}`} key={tag}>{tag}</Link>)}</div>
        </section>
      )}
    </>
  );
}
