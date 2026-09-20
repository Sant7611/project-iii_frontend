"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth";
import type { OwnerPost } from "@/lib/types";
import { PlateEditorWrapper } from "@/components/PlateEditorWrapper";
import { EMPTY_PLATE_VALUE, parsePlateContent, type PlateValue } from "@/components/plate/types";

export function WriteForm({ editId }: { editId?: string }) {
  const router = useRouter();
  const isEditing = Boolean(editId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<PlateValue>(EMPTY_PLATE_VALUE);
  const [tags, setTags] = useState("");
  const [post, setPost] = useState<OwnerPost | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
  }, [newImagePreview]);

  useEffect(() => {
    if (!editId) return;
    const controller = new AbortController();

    async function loadPost() {
      setLoading(true);
      setError("");
      try {
        const response = await authenticatedFetch(`${API_URL}/posts/${editId}/`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const payload = await readResponse(response);
        if (!response.ok) {
          throw new Error("This post could not be loaded for editing.");
        }
        const loadedPost = unwrapPost(payload);
        if (!loadedPost) {
          throw new Error("The server returned an invalid post.");
        }
        if (controller.signal.aborted) return;
        setPost(loadedPost);
        setTitle(loadedPost.title);
        setContent(parsePlateContent(loadedPost.content) || [{ type: "p", children: [{ text: loadedPost.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() }] }]);
        setTags(loadedPost.tags.join(", "));
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error ? reason.message : "This post could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPost();
    return () => controller.abort();
  }, [editId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || loading) return;
    setBusy(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const body = new FormData();
    body.set("title", title);
    body.set("content", JSON.stringify(content));
    tagList.forEach((tag) => body.append("tags", tag));
    const image = form.get("featured_img");
    if (image instanceof File && image.size) body.set("featured_img", image);

    try {
      const response = await authenticatedFetch(
        editId ? `${API_URL}/posts/${editId}/` : `${API_URL}/posts/`,
        {
          method: editId ? "PATCH" : "POST",
          headers: { Accept: "application/json" },
          body,
        },
      );
      const payload = await readResponse(response);
      if (!response.ok) {
        throw new Error(getApiError(payload));
      }

      if (editId) {
        router.push("/profile");
        return;
      }

      setMessage("Your fact was submitted for review.");
      setTitle("");
      setContent(EMPTY_PLATE_VALUE);
      setTags("");
      setNewImagePreview(null);
      event.currentTarget.reset();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to connect to the API.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading your post…</p>;
  if (isEditing && error) return <div className="form-error" role="alert">{error}</div>;

  return (
    <form className="form" onSubmit={submit}>
      {post?.approval_status === "rejected" && post.rejection_reason && (
        <div className="form-error" role="status">
          <strong>Moderator feedback:</strong> {post.rejection_reason}
          <br />
          Update the post, then save it to submit it for review again.
        </div>
      )}
      <div className="field">
        <label htmlFor="title">A clear, interesting title</label>
        <input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} placeholder="What surprising thing should people know?" />
      </div>
      <div className="field">
        <label htmlFor="content">The full fact</label>
        <PlateEditorWrapper value={content} onChange={setContent} disabled={busy} />
      </div>
      <div className="field">
        <label htmlFor="tags">Topics, separated by commas</label>
        <input id="tags" name="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="AI, Security, History" />
      </div>
      <div className="field">
        <label htmlFor="featured_img">Cover image (optional)</label>
        {(newImagePreview || post?.featured_img) && (
          <figure className="cover-image-preview">
            <img
              src={newImagePreview || post?.featured_img || ""}
              alt={newImagePreview ? "New cover image preview" : "Current cover image"}
            />
            <figcaption>{newImagePreview ? "New image preview" : "Current cover image"}</figcaption>
          </figure>
        )}
        <input id="featured_img" name="featured_img" type="file" accept="image/*" onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          setNewImagePreview(file ? URL.createObjectURL(file) : null);
        }} />
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {message && <div className="form-success" role="status">{message}</div>}
      <button className="button button-primary" disabled={busy}>
        {busy
          ? "Saving…"
          : isEditing
            ? "Save and resubmit for review"
            : "Submit for review"}
      </button>
    </form>
  );
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function unwrapPost(payload: unknown): OwnerPost | null {
  const value = payload && typeof payload === "object" && "data" in payload
    ? (payload as { data: unknown }).data
    : payload;
  if (!value || typeof value !== "object") return null;
  const post = value as Partial<OwnerPost>;
  return typeof post.id === "number" && typeof post.title === "string" && typeof post.content === "string" && Array.isArray(post.tags)
    ? (post as OwnerPost)
    : null;
}

function getApiError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Your post could not be saved.";
  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  return Object.entries(record)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : String(value)}`)
    .join(" ") || "Your post could not be saved.";
}
