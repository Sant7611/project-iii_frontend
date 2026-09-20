import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Technology facts and practical explainers",
  description: "Discover clear, practical stories about software, AI, the web, and the ideas shaping technology.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { posts, available } = await getPosts();
  const [featured, ...latest] = posts;
  const tags = [...new Set(posts.flatMap((post) => post.tags))].slice(0, 8);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "tfacts",
    description: "Technology facts and explainers, made clear.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero" aria-labelledby="home-title">
        <div className="eyebrow"><Sparkles size={15} /> Curious by default</div>
        <h1 id="home-title">Technology is better<br />when it <em>makes sense.</em></h1>
        <p>Short facts, useful context, and thoughtful explainers for people who want to understand what’s next—not just scroll past it.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="#latest">Start exploring <ArrowRight size={17} /></Link>
          <Link className="button button-secondary" href="/write">Share a fact</Link>
        </div>
        <div className="hero-orbit orbit-one" aria-hidden="true">01</div>
        <div className="hero-orbit orbit-two" aria-hidden="true">AI</div>
        <div className="hero-orbit orbit-three" aria-hidden="true">101</div>
      </section>

      {!available && (
        <div className="notice" role="status">
          <span>API preview</span> Start the Django backend to replace this sample editorial content with live approved posts.
        </div>
      )}

      <section className="section" aria-labelledby="featured-title">
        <div className="section-heading">
          <div><span className="kicker">Editor’s pick</span><h2 id="featured-title">One idea worth your time</h2></div>
          <span className="section-index">01 / Featured</span>
        </div>
        {featured && <PostCard post={featured} featured />}
      </section>

      <section className="section" id="latest" aria-labelledby="latest-title">
        <div className="section-heading">
          <div><span className="kicker">Freshly decoded</span><h2 id="latest-title">Latest facts</h2></div>
          <Link className="text-link" href="/explore">Explore all <ArrowRight size={16} /></Link>
        </div>
        <div className="post-grid">
          {latest.slice(0, 6).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>

      <section className="topic-panel" aria-labelledby="topics-title">
        <div>
          <span className="kicker">Find your rabbit hole</span>
          <h2 id="topics-title">Browse by topic</h2>
          <p>Follow the threads that make you curious.</p>
        </div>
        <div className="topic-cloud">
          {(tags.length ? tags : ["Artificial intelligence", "Web", "Security", "Software", "Data", "Future tech"]).map((tag, index) => (
            <Link href={`/explore?tag=${encodeURIComponent(tag)}`} key={tag} className={`topic-pill color-${index % 4}`}>
              <Compass size={16} /> {tag}
            </Link>
          ))}
        </div>
      </section>

      <section className="newsletter" aria-labelledby="newsletter-title">
        <div><span className="kicker">A smarter inbox</span><h2 id="newsletter-title">One useful tech idea.<br />Every week.</h2></div>
        <div><p>No hot takes. No noise. Just one clear idea worth knowing.</p><a className="button button-dark" href="mailto:hello@tfacts.dev?subject=Subscribe%20to%20tfacts">Join the curious <ArrowRight size={17} /></a></div>
      </section>
    </>
  );
}
