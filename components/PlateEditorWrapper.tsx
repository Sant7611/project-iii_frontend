"use client";

import dynamic from "next/dynamic";
import type { PlateValue } from "@/components/plate/types";

const PlateEditor = dynamic(() => import("@/components/PlateEditor").then((module) => module.PlateEditor), {
  ssr: false,
  loading: () => <div className="rich-text-editor-loading">Loading editor…</div>,
});

export function PlateEditorWrapper({ value, onChange, disabled = false }: { value: PlateValue; onChange: (value: PlateValue) => void; disabled?: boolean }) {
  return <PlateEditor value={value} onChange={onChange} disabled={disabled} />;
}
