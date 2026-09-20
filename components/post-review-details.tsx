import type { OwnerPost } from "@/lib/types";

export function PostReviewDetails({ post }: { post: OwnerPost }) {
  if (post.approval_status === "pending") return null;

  const reviewer =
    post.reviewed_by_username ||
    (post.reviewed_by ? `User #${post.reviewed_by}` : null);

  if (!reviewer) return null;

  const action = post.approval_status === "approved" ? "Approved" : "Rejected";
  const reviewedAt = post.reviewed_at
    ? new Date(post.reviewed_at).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <p className="post-review-details">
      <strong>{action} by:</strong> {reviewer}
      {reviewedAt ? ` · ${reviewedAt}` : ""}
    </p>
  );
}
