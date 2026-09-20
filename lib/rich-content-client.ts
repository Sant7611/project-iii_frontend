"use client";

import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "hr", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "mark", "aside", "ul", "ol", "li", "blockquote", "pre", "code", "a", "figure", "figcaption", "img", "table", "thead", "tbody", "tr", "th", "td"];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "width", "height", "class", "colspan", "rowspan"];

export function sanitizeRichContentClient(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
