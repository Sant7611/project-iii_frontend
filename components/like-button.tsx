"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch, hasAuthSession } from "@/lib/auth";

export function LikeButton({ postId }: { postId: number }) {
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    if (!hasAuthSession()) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    setMessage("");
    const endpoint = liked ? "unlike" : "like";
    try {
      const response = await authenticatedFetch(`${API_URL}/posts/${postId}/${endpoint}/`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (response.status === 404) {
        setMessage("Like API is not enabled on the backend yet.");
        return;
      }
      if (!response.ok) throw new Error();
      setLiked(!liked);
    } catch {
      setMessage("Could not update like.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="like-control">
      <button onClick={toggle} disabled={busy} className={liked ? "is-liked" : ""}>
        <Heart size={17} fill={liked ? "currentColor" : "none"} /> {liked ? "Liked" : "Like"}
      </button>
      {message && <small>{message}</small>}
    </div>
  );
}
