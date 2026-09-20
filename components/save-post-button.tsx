"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";
import {
  forgetSavedPost,
  getSavedRecordId,
  loadSavedState,
  rememberSavedPost,
} from "@/lib/saved-state";

function savedIdFromPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const wrapped = payload as { data?: unknown; id?: unknown };
  const value =
    wrapped.data && typeof wrapped.data === "object"
      ? (wrapped.data as { id?: unknown })
      : wrapped;
  return typeof value.id === "number" ? value.id : null;
}

export function SavePostButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [savedId, setSavedId] = useState<number | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saved = savedId !== null;

  useEffect(() => {
    if (!hasAuthSession()) {
      const timer = window.setTimeout(() => setChecking(false), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    loadSavedState()
      .then((map) => {
        if (!cancelled) setSavedId(map.get(postId) ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function toggleSaved() {
    if (!hasAuthSession()) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    if (saving) return;

    setError("");
    setSaving(true);

    try {
      if (saved) {
        const recordId = savedId ?? getSavedRecordId(postId);
        if (!recordId) {
          throw new Error("The saved-post record could not be found.");
        }

        const response = await authenticatedFetch(
          `${API_URL}/saved/${recordId}/`,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
          },
        );
        if (!response.ok) {
          throw new Error("Could not remove this saved post. Please try again.");
        }

        forgetSavedPost(postId);
        setSavedId(null);
        return;
      }

      const response = await authenticatedFetch(`${API_URL}/saved/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ post: postId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error("Could not save this post. Please try again.");
      }

      const nextSavedId = savedIdFromPayload(payload);
      if (nextSavedId === null) {
        throw new Error("The saved-post API returned an invalid response.");
      }

      rememberSavedPost(postId, nextSavedId);
      setSavedId(nextSavedId);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      className={`save-post-button ${saved ? "is-saved" : ""}`}
      type="button"
      onClick={() => void toggleSaved()}
      disabled={checking || saving}
      aria-label={
        saved
          ? "Remove saved post"
          : checking
            ? "Checking saved state"
            : "Save post"
      }
      title={saved ? "Remove from saved" : "Save post"}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </button>
  );
}
