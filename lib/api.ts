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

export async function getPosts(): Promise<{ posts: Post[]; available: boolean }> {
  try {
    const payload = await request<Paginated<Post> | Post[]>("/posts/");
    return { posts: listFrom(payload), available: true };
  } catch {
    return { posts: [], available: false };
  }
}

export async function getPost(id: string): Promise<{ post: Post | null; available: boolean }> {
  try { return { post: await request<Post>(`/posts/${id}/`), available: true }; }
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
  const payload = await request<{ query: string; count: number; results: Post[] }>(
    `/search/?q=${encodeURIComponent(query.trim())}`
  );
  return payload.results || [];
}

export function articleHref(post: Post) {
  return `/articles/${post.id}/${post.slug}`;
}
