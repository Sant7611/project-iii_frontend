import { PrivatePostDetail } from "@/components/private-post-detail";

export default async function PrivatePostPage({ params }: { params: Promise<{ id: string }> }) {
  return <PrivatePostDetail id={(await params).id} />;
}
