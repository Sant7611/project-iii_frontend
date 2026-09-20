"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { API_URL, normalizePost } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";
import type { Post } from "@/lib/types";
import { PostCard } from "./post-card";

export function PersonalizedFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const active = hasAuthSession();
    setSignedIn(active);
    if (!active) return;

    authenticatedFetch(`${API_URL}/recommendation/`, { headers: { Accept: "application/json" } })
      .then(async response => {
        if (!response.ok) return [];
        const payload = await response.json();
        const data = payload?.data ?? payload;
        return Array.isArray(data?.["recommendation results"]) ? data["recommendation results"] : [];
      })
      .then(items => setPosts(items.map((item: any) => normalizePost(item))))
      .catch(() => undefined);
  }, []);

  if (!signedIn || posts.length === 0) return null;

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
