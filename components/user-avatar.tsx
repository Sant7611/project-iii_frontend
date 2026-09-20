"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch, getStoredUser } from "@/lib/auth";

const cache = new Map<number, string | null>();
export const AVATAR_CHANGE_EVENT = "tfacts-avatar-change";

export function UserAvatar({
  userId,
  size = 34,
  className = "",
  avatarUrl,
  username = "",
}: {
  userId?: number;
  size?: number;
  className?: string;
  avatarUrl?: string | null;
  username?: string;
}) {
  const [avatar, setAvatar] = useState<string | null>(
    avatarUrl !== undefined ? avatarUrl : userId ? cache.get(userId) ?? null : null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAvatar(force = false) {
      if (avatarUrl !== undefined) {
        if (!cancelled) setAvatar(avatarUrl);
        return;
      }

      const currentUser = getStoredUser();
      const id = userId || currentUser?.id;
      if (!id || id !== currentUser?.id) {
        if (!cancelled) setAvatar(null);
        return;
      }

      if (!force && cache.has(id)) {
        if (!cancelled) setAvatar(cache.get(id) || null);
        return;
      }

      try {
        const response = await authenticatedFetch(`${API_URL}/profile/me/`, {
          headers: { Accept: "application/json" },
        });
        const data = response.ok ? await response.json() : null;
        const value = data?.profile?.avatar || null;
        cache.set(id, value);
        if (!cancelled) setAvatar(value);
      } catch {
        cache.set(id, null);
        if (!cancelled) setAvatar(null);
      }
    }

    const refreshCurrentAvatar = () => {
      const currentUser = getStoredUser();
      const id = userId || currentUser?.id;
      if (!id || id !== currentUser?.id || avatarUrl !== undefined) return;
      cache.delete(id);
      void loadAvatar(true);
    };

    void loadAvatar();
    window.addEventListener(AVATAR_CHANGE_EVENT, refreshCurrentAvatar);

    return () => {
      cancelled = true;
      window.removeEventListener(AVATAR_CHANGE_EVENT, refreshCurrentAvatar);
    };
  }, [avatarUrl, userId]);

  const initial = (username || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <span className={`user-avatar ${className}`} style={{ width: size, height: size }}>
      {avatar ? <img src={avatar} alt="" /> : <span className="user-avatar-initial">{initial}</span>}
    </span>
  );
}
