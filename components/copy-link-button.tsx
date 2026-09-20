"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className="icon-button"
      type="button"
      aria-label={copied ? "Article link copied" : "Copy article link"}
      title={copied ? "Copied" : "Copy article link"}
      onClick={copyLink}
    >
      {copied ? <Check size={17} /> : <Link2 size={17} />}
    </button>
  );
}
