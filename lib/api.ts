import { fallbackPosts } from "./fallback";
import type { Comment, Paginated, Post } from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:9009/api").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    next: init?.method ? undefined : { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getPosts(): Promise<{ posts: Post[]; available: boolean }> {
  try {
    const payload = await request<Paginated<Post> | Post[]>("/posts/");
    const posts = Array.isArray(payload) ? payload : payload.results;
    return posts.length ? { posts, available: true } : { posts: fallbackPosts, available: true };
  } catch {
    return { posts: fallbackPosts, available: false };
  }
}

export async function getPost(id: string): Promise<{ post: Post | null; available: boolean }> {
  const fallback = fallbackPosts.find((post) => String(post.id) === id) || null;
  if (fallback) return { post: fallback, available: false };
  try { return { post: await request<Post>(`/posts/${id}/`), available: true }; }
  catch { return { post: null, available: false }; }
}

export async function getComments(postId: number): Promise<Comment[]> {
  try {
    const payload = await request<Paginated<Comment> | Comment[]>(`/posts/${postId}/comments/`);
    return Array.isArray(payload) ? payload : payload.results;
  } catch { return []; }
}

export function articleHref(post: Post) {
  return `/articles/${post.id}/${post.slug}`;
}
