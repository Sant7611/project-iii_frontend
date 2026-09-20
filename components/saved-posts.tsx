"use client";

import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth";
import { forgetSavedPost, rememberSavedPost } from "@/lib/saved-state";
import type { Paginated, Post } from "@/lib/types";
import { PostCard } from "./post-card";

type SavedRecord = { id: number; post: Post | number };
type SavedItem = { id: number; post: Post };

export function SavedPosts() {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authenticatedFetch(`${API_URL}/saved/`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Your saved posts could not be loaded.");
        const records = readSavedRecords(await response.json());
        const resolved = await Promise.all(records.map(resolveSavedPost));
        if (!cancelled) {
          const items = resolved.filter((item): item is SavedItem => item !== null);
          items.forEach(item => rememberSavedPost(item.post.id, item.id));
          setItems(items);
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Your saved posts could not be loaded.");
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  async function remove(item: SavedItem) {
    const previous = items;
    setItems((current) => current?.filter((saved) => saved.id !== item.id) || []);
    try {
      const response = await authenticatedFetch(`${API_URL}/saved/${item.id}/`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) setItems(previous);
      else forgetSavedPost(item.post.id);
    } catch {
      setItems(previous);
    }
  }

  return (
    <>
      <header className="page-heading"><span className="kicker">Your collection</span><h1>Saved for a thoughtful moment.</h1><p>Stories you bookmark will wait here for you.</p></header>
      {error && <div className="form-error" role="alert">{error}</div>}
      {items === null ? <div className="empty-state"><p>Loading saved posts…</p></div> : items.length ? <div className="post-grid saved-post-grid">{items.map((item) => <PostCard key={item.id} post={item.post} actions={<button className="button button-secondary danger" onClick={() => void remove(item)}><Trash2 size={15} /> Remove</button>} />)}</div> : <div className="empty-state"><Bookmark size={34} /><h2>Nothing saved yet</h2><p>Use the bookmark on any story to build your personal reading list.</p><Link className="button button-primary" href="/explore">Find a story</Link></div>}
    </>
  );
}

function readSavedRecords(payload: unknown): SavedRecord[] {
  if (Array.isArray(payload)) return payload as SavedRecord[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as {
    results?: SavedRecord[];
    data?: SavedRecord[] | Paginated<SavedRecord>;
  };
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.data)) return record.data;
  if (record.data) return record.data.results || [];
  return [];
}

async function resolveSavedPost(record: SavedRecord): Promise<SavedItem | null> {
  if (typeof record.post !== "number") return { id: record.id, post: record.post };
  const response = await authenticatedFetch(`${API_URL}/posts/${record.post}/`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return { id: record.id, post: await response.json() as Post };
}
