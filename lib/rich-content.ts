import sanitizeHtml from "sanitize-html";

export function sanitizeRichContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ["p", "br", "hr", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "mark", "aside", "ul", "ol", "li", "blockquote", "pre", "code", "a", "figure", "figcaption", "img", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "class"],
      p: ["class"],
      aside: ["class"],
      mark: ["class"],
      ul: ["class"],
      li: ["class"],
      span: ["class"],
      h2: ["class"],
      h3: ["class"],
      blockquote: ["class"],
      pre: ["class"],
      figure: ["class"],
      figcaption: ["class"],
      hr: ["class"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

export function richTextSummary(content: string, length = 165): string {
  const plainText = sanitizeHtml(content, { allowedTags: [] }).replace(/\s+/g, " ").trim();
  return plainText.length > length ? `${plainText.slice(0, length).trim()}…` : plainText;
}

export function richTextWordCount(content: string): number {
  return sanitizeHtml(content, { allowedTags: [] }).trim().split(/\s+/).filter(Boolean).length;
}
