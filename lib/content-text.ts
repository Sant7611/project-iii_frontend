function textFromNode(value: unknown): string {
  if (Array.isArray(value)) return value.map(textFromNode).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const own = typeof record.text === "string" ? record.text : "";
  const children = Array.isArray(record.children) ? textFromNode(record.children) : "";
  const caption = typeof record.caption === "string" ? record.caption : "";
  return [own, children, caption].filter(Boolean).join(" ");
}

export function contentPlainText(content: string): string {
  try {
    const parsed: unknown = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return textFromNode(parsed).replace(/\s+/g, " ").trim();
    }
  } catch {
    // Legacy posts may contain HTML instead of Plate JSON.
  }

  return content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentExcerpt(content: string, length = 145): string {
  const plain = contentPlainText(content);
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain;
}

export function contentWordCount(content: string): number {
  const plain = contentPlainText(content);
  return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
}
