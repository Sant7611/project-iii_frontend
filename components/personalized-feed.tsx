"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { API_URL } from "@/lib/api";
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
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        const data = payload?.data ?? payload;
        return data?.["recommendation results"] ?? [];
      })
      .then((items) => Array.isArray(items) && setPosts(items))
      .catch(() => undefined);
  }, []);

  if (!signedIn || posts.length === 0) return null;

  return (
    <section className="section recommendation-section">
      <div className="section-heading">
        <div><span className="kicker"><Sparkles size={14} /> Collaborative recommendations</span><h2>Picked for you</h2></div>
        <p>Based on overlap between your likes and readers with similar interests.</p>
      </div>
      <div className="post-grid">{posts.map(post => <PostCard key={post.id} post={post} />)}</div>
    </section>
  );
}
