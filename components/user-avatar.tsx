"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authenticatedFetch, getStoredUser } from "@/lib/auth";

const cache = new Map<number, string | null>();

export function UserAvatar({ userId, size = 34, className = "" }: { userId?: number; size?: number; className?: string }) {
  const [avatar, setAvatar] = useState<string | null>(userId ? cache.get(userId) ?? null : null);
  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      const currentUser = getStoredUser();
      const id = userId || currentUser?.id;
      if (!id || id !== currentUser?.id) {
        if (!cancelled) setAvatar(null);
        return;
      }
      if (cache.has(id)) {
        if (!cancelled) setAvatar(cache.get(id) || null);
        return;
      }

      try {
        const response = await authenticatedFetch(`${API_URL}/profile/me/`, { headers: { Accept: "application/json" } });
        const data = response.ok ? await response.json() : null;
        const value = data?.profile?.avatar || null;
        cache.set(id, value);
        if (!cancelled) setAvatar(value);
      } catch {
        cache.set(id, null);
      }
    }

    void loadAvatar();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return <span className={`user-avatar ${className}`} style={{ width: size, height: size }}>{avatar ? <img src={avatar} alt="" /> : null}</span>;
}
