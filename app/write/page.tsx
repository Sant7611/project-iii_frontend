import type { Metadata } from "next";

import { WriteForm } from "@/components/write-form";

export const metadata: Metadata = {
  title: "Write a technology fact",
  description: "Contribute a clear, useful technology fact to tfacts.",
  robots: { index: false, follow: true },
};

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const edit = (await searchParams).edit;
  const editId = edit && /^\d+$/.test(edit) ? edit : undefined;
  const isEditing = Boolean(editId);

  return (
    <>
      <header className="page-heading">
        <span className="kicker">{isEditing ? "Prepare for review" : "Add to the signal"}</span>
        <h1>{isEditing ? "Revise your post." : "Share something worth knowing."}</h1>
        <p>
          {isEditing
            ? "Address the moderator feedback, then submit the revised post for another review."
            : "Teach one idea clearly. Every submission is reviewed before it appears publicly."}
        </p>
      </header>
      <div className="writer-wrap">
        <section className="writer-panel">
          <WriteForm editId={editId} />
        </section>
        <aside className="writer-tips">
          <h2>A good tfact is…</h2>
          <ol>
            <li><strong>Specific.</strong> It makes one memorable point.</li>
            <li><strong>Clear.</strong> A curious reader can understand it without jargon.</li>
            <li><strong>Grounded.</strong> It separates evidence from opinion.</li>
            <li><strong>Useful.</strong> It leaves the reader seeing technology differently.</li>
          </ol>
        </aside>
      </div>
    </>
  );
}
