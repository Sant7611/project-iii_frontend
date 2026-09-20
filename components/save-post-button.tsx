"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";
import { loadSavedState, rememberSavedPost } from "@/lib/saved-state";

function savedIdFromPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const wrapped = payload as { data?: unknown; id?: unknown };
  const value = wrapped.data && typeof wrapped.data === "object" ? wrapped.data as { id?: unknown } : wrapped;
  return typeof value.id === "number" ? value.id : null;
}

export function SavePostButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasAuthSession()) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    loadSavedState()
      .then(map => {
        if (!cancelled) setSaved(map.has(postId));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => { cancelled = true; };
  }, [postId]);

  async function savePost() {
    if (!hasAuthSession()) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (saved || saving) return;

    setError("");
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${API_URL}/saved/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ post: postId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error("Could not save this post. Please try again.");

      const savedId = savedIdFromPayload(payload);
      if (savedId !== null) rememberSavedPost(postId, savedId);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      className={`save-post-button ${saved ? "is-saved" : ""}`}
      type="button"
      onClick={() => void savePost()}
      disabled={checking || saving || saved}
      aria-label={saved ? "Post saved" : checking ? "Checking saved state" : "Save post"}
      title={saved ? "Saved" : "Save post"}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      {error && <span className="sr-only" role="alert">{error}</span>}
    </button>
  );
}
