"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";

export function SavePostButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      if (response.ok) setSaved(true);
      else setError("Could not save this post. Please try again.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      className={`save-post-button ${saved ? "is-saved" : ""}`}
      type="button"
      onClick={() => void savePost()}
      disabled={saving || saved}
      aria-label={saved ? "Post saved" : "Save post"}
      title={saved ? "Saved" : "Save post"}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      {error && <span className="sr-only" role="alert">{error}</span>}
    </button>
  );
}
