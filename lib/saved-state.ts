"use client";

import { API_URL } from "./api";
import { authenticatedFetch, getStoredUser } from "./auth";

type SavedRecord = {
  id: number;
  post: number | { id?: number };
};

let cache: Map<number, number> | null = null;
let cachedUserId: number | null = null;
let loading: Promise<Map<number, number>> | null = null;

function recordsFromPayload(payload: unknown): SavedRecord[] {
  if (Array.isArray(payload)) return payload as SavedRecord[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as {
    results?: unknown;
    data?: unknown;
  };
  if (Array.isArray(record.results)) return record.results as SavedRecord[];
  if (Array.isArray(record.data)) return record.data as SavedRecord[];
  if (record.data && typeof record.data === "object") {
    const nested = record.data as { results?: unknown };
    if (Array.isArray(nested.results)) return nested.results as SavedRecord[];
  }
  return [];
}

function toMap(records: SavedRecord[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const record of records) {
    const postId = typeof record.post === "number" ? record.post : record.post?.id;
    if (typeof postId === "number" && typeof record.id === "number") {
      map.set(postId, record.id);
    }
  }
  return map;
}

function syncCacheOwner(): number | null {
  const userId = getStoredUser()?.id ?? null;
  if (cachedUserId !== userId) {
    cache = null;
    loading = null;
    cachedUserId = userId;
  }
  return userId;
}

export async function loadSavedState(): Promise<Map<number, number>> {
  const userId = syncCacheOwner();
  if (!userId) return new Map<number, number>();
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    const response = await authenticatedFetch(`${API_URL}/saved/`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return new Map<number, number>();
    const map = toMap(recordsFromPayload(await response.json()));
    cache = map;
    return map;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export function rememberSavedPost(postId: number, savedId: number): void {
  syncCacheOwner();
  if (!cache) cache = new Map();
  cache.set(postId, savedId);
}

export function forgetSavedPost(postId: number): void {
  syncCacheOwner();
  cache?.delete(postId);
}

export function getSavedRecordId(postId: number): number | undefined {
  syncCacheOwner();
  return cache?.get(postId);
}
