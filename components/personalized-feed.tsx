"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { API_URL, normalizePost } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";
import type { Post } from "@/lib/types";
import { PostCard } from "./post-card";

type RecommendationItem = Partial<Post> & { author?: string; excerpt?: string };

export function PersonalizedFeed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!hasAuthSession()) return;
    let cancelled = false;

    authenticatedFetch(`${API_URL}/recommendation/`, { headers: { Accept: "application/json" } })
      .then(async response => {
        if (!response.ok) return [] as RecommendationItem[];
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object") return [] as RecommendationItem[];
        const wrapped = payload as { data?: unknown };
        const data = wrapped.data && typeof wrapped.data === "object" ? wrapped.data : payload;
        if (!data || typeof data !== "object") return [] as RecommendationItem[];
        const record = data as Record<string, unknown>;
        const items = record["recommendation results"];
        return Array.isArray(items) ? items as RecommendationItem[] : [];
      })
      .then(items => {
        if (!cancelled) setPosts(items.map(item => normalizePost(item)));
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="section recommendation-section">
      <div className="section-heading">
        <div><span className="kicker"><Sparkles size={14} /> Collaborative recommendations</span><h2>Picked for you</h2></div>
        <p className="section-note">Based on readers who liked some of the same stories you did.</p>
      </div>
      <div className="post-grid">{posts.map(post => <PostCard key={post.id} post={post} />)}</div>
    </section>
  );
}
