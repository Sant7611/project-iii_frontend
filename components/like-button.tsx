"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";

type LikeState = { liked: boolean; count: number };

function readState(payload: unknown): LikeState | null {
  if (!payload || typeof payload !== "object") return null;
  const wrapped = payload as { data?: unknown };
  const value = wrapped.data && typeof wrapped.data === "object" ? wrapped.data : payload;
  if (!value || typeof value !== "object") return null;
  const record = value as { liked?: unknown; count?: unknown };
  if (typeof record.liked !== "boolean" || typeof record.count !== "number") return null;
  return { liked: record.liked, count: record.count };
}

export function LikeButton({ postId }: { postId: number }) {
  const [state, setState] = useState<LikeState>({ liked: false, count: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasAuthSession()) return;
    let cancelled = false;
    authenticatedFetch(`${API_URL}/posts/${postId}/like/`, {
      headers: { Accept: "application/json" },
    })
      .then(async response => {
        if (!response.ok) return null;
        return readState(await response.json());
      })
      .then(next => {
        if (!cancelled && next) setState(next);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [postId]);

  async function toggle() {
    if (!hasAuthSession()) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await authenticatedFetch(`${API_URL}/posts/${postId}/like/`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error("Could not update like.");
      const next = readState(payload);
      if (!next) throw new Error("The like API returned an invalid response.");
      setState(next);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not update like.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="like-control">
      <button onClick={toggle} disabled={busy} className={state.liked ? "is-liked" : ""}>
        <Heart size={17} fill={state.liked ? "currentColor" : "none"} />
        <span>{state.liked ? "Liked" : "Like"}{state.count > 0 ? ` · ${state.count}` : ""}</span>
      </button>
      {message && <small role="alert">{message}</small>}
    </div>
  );
}
