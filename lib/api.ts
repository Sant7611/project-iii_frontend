import type { Comment, Paginated, Post } from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9009/api").replace(/\/$/, "");

type SuccessEnvelope<T> = { success?: boolean; message?: string; data?: T };

function unwrap<T>(payload: T | SuccessEnvelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as SuccessEnvelope<T>).data;
    if (data !== undefined) return data;
  }
  return payload as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    next: init?.method ? undefined : { revalidate: 45 },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return unwrap(await response.json() as T | SuccessEnvelope<T>);
}

function listFrom<T>(payload: Paginated<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : payload.results || [];
}

export function normalizePost(value: Partial<Post> & { author?: unknown; excerpt?: string }): Post {
  return {
    id: Number(value.id || 0),
    title: String(value.title || "Untitled"),
    slug: String(value.slug || ""),
    content: String(value.content || value.excerpt || ""),
    author: typeof value.author === "number" ? value.author : undefined,
    author_username: String(value.author_username || (typeof value.author === "string" ? value.author : "") || "TFacts writer"),
    view_count: Number(value.view_count || 0),
    featured_img: value.featured_img || null,
    short_code: value.short_code || null,
    tags: Array.isArray(value.tags) ? value.tags : [],
    created_at: String(value.created_at || new Date(0).toISOString()),
    updated_at: String(value.updated_at || value.created_at || new Date(0).toISOString()),
  };
}

export async function getPosts(): Promise<{ posts: Post[]; available: boolean }> {
  try {
    const payload = await request<Paginated<Post> | Post[]>("/posts/");
    return { posts: listFrom(payload).map(item => normalizePost(item)), available: true };
  } catch {
    return { posts: [], available: false };
  }
}

export async function getPost(id: string): Promise<{ post: Post | null; available: boolean }> {
  try { return { post: normalizePost(await request<Post>(`/posts/${id}/`)), available: true }; }
  catch { return { post: null, available: false }; }
}

export async function getComments(postId: number): Promise<Comment[]> {
  try {
    const payload = await request<Paginated<Comment> | Comment[]>(`/posts/${postId}/comments/`);
    return listFrom(payload);
  } catch { return []; }
}

export async function searchPosts(query: string): Promise<Post[]> {
  if (query.trim().length < 3) return [];
  const payload = await request<{ query: string; count: number; results: Array<Partial<Post> & { author?: string; excerpt?: string }> }>(
    `/search/?q=${encodeURIComponent(query.trim())}`
  );
  return (payload.results || []).map(item => normalizePost(item));
}

export function articleHref(post: Post) {
  return `/articles/${post.id}/${post.slug}`;
}
