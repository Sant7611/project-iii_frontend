import type { Metadata } from "next";
import { WriteForm } from "@/components/write-form";

export const metadata: Metadata = {
  title: "Write a story",
  description: "Publish a thoughtful story to the TFacts community.",
  robots: { index: false, follow: true },
};

export default async function WritePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const edit = (await searchParams).edit;
  const editId = edit && /^\d+$/.test(edit) ? edit : undefined;
  const isEditing = Boolean(editId);

  return (
    <>
      <header className="page-heading">
        <span className="kicker">{isEditing ? "Prepare for review" : "Publish with purpose"}</span>
        <h1>{isEditing ? "Revise your story." : "Write something worth reading."}</h1>
        <p>{isEditing ? "Address moderator feedback, then resubmit your revised post." : "Share one clear idea. Every submission is reviewed before it appears publicly."}</p>
      </header>
      <div className="writer-wrap">
        <section className="writer-panel"><WriteForm editId={editId} /></section>
        <aside className="writer-tips">
          <h2>A strong TFacts post is…</h2>
          <ol>
            <li><strong>Focused.</strong> It has one clear reason to exist.</li>
            <li><strong>Readable.</strong> It respects the reader’s time.</li>
            <li><strong>Grounded.</strong> It separates evidence from opinion.</li>
            <li><strong>Useful.</strong> It leaves the reader with something worth remembering.</li>
          </ol>
        </aside>
      </div>
    </>
  );
}
