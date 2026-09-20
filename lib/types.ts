export type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  author?: number;
  author_username: string;
  view_count: number;
  featured_img: string | null;
  short_code: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CommentAuthor =
  | string
  | number
  | {
      username?: string;
      first_name?: string;
      last_name?: string;
    }
  | null;

export type Comment = {
  id: number;
  author: CommentAuthor;
  parent: number | null;
  content: string;
  created_at: string;
  reply_count?: number;
  replies?: Comment[];
};

export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export type UserProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone: string;
  profile: { bio: string; avatar: string | null; address: string };
};

export type OwnerPost = Post & {
  approval_status: "approved" | "pending" | "rejected";
  rejection_reason?: string;
  reviewed_by?: number | null;
  reviewed_by_username?: string | null;
  reviewed_at?: string | null;
};
