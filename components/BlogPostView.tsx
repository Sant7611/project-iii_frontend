/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";
import { parsePlateContent, type PlateNode, type PlateText } from "@/components/plate/types";

type BlogPostViewProps = { html: string; className?: string };

function Text({ node }: { node: PlateText }) {
  let output: ReactNode = node.text;
  if (node.bold) output = <strong>{output}</strong>;
  if (node.italic) output = <em>{output}</em>;
  if (node.underline) output = <u>{output}</u>;
  return typeof node.link === "string" ? <a href={node.link}>{output}</a> : output;
}

function isText(node: PlateText | PlateNode): node is PlateText {
  return "text" in node;
}

function InlineContent({ nodes }: { nodes: Array<PlateText | PlateNode> }) {
  return <>{nodes.map((node, index) => isText(node) ? <Text key={index} node={node} /> : <InlineContent key={index} nodes={node.children} />)}</>;
}

/** Renders Plate JSON; HTML is accepted only for legacy, already-sanitized posts. */
export function BlogPostView({ html, className = "" }: BlogPostViewProps) {
  const value = parsePlateContent(html);
  if (!value) return <div className={`editor-output-wrapper ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
  return <article className={`editor-output-wrapper ${className}`.trim()}>{value.map((node, index) => {
    const content = <InlineContent nodes={node.children} />;
    const alignKey = String((node as any).align || "left");
    const sizeKey = String((node as any).fontSize || "18");
    const backgroundKey = String((node as any).backgroundColor || "transparent");
    const alignment = { left: "text-left", center: "text-center", right: "text-right", justify: "text-justify" }[alignKey as "left" | "center" | "right" | "justify"] || "text-left";
    const size = { "14": "text-sm", "16": "text-base", "18": "text-lg", "20": "text-xl", "22": "text-2xl", "24": "text-3xl", "26": "text-4xl" }[sizeKey as "14" | "16" | "18" | "20" | "22" | "24" | "26"] || "text-lg";
    const blockClass = `${alignment} ${size} ${backgroundKey !== "transparent" ? "rounded-lg px-4 py-2" : ""}`;
    const blockStyle = backgroundKey !== "transparent" ? { backgroundColor: backgroundKey } : undefined;
    switch (node.type) {
      case "h1": return <h1 key={index} className={blockClass} style={blockStyle}>{content}</h1>;
      case "h2": return <h2 key={index} className={blockClass} style={blockStyle}>{content}</h2>;
      case "h3": return <h3 key={index} className={blockClass} style={blockStyle}>{content}</h3>;
      case "blockquote": return <blockquote key={index} className={blockClass} style={blockStyle}>{content}</blockquote>;
      case "table": return <div key={index} className="my-7 overflow-x-auto"><table className="w-full border-collapse overflow-hidden rounded-xl border border-slate-200 text-left text-base"><tbody>{node.children.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-200 last:border-b-0">{isText(row) ? <td className="min-w-32 border-r border-slate-200 p-3 align-top last:border-r-0"><Text node={row} /></td> : row.children.map((cell, cellIndex) => <td key={cellIndex} className="min-w-32 border-r border-slate-200 p-3 align-top last:border-r-0">{isText(cell) ? <Text node={cell} /> : <InlineContent nodes={cell.children} />}</td>)}</tr>)}</tbody></table></div>;
      case "ul": return <ul key={index} className="mb-5 ml-6 list-outside list-disc">{node.children.map((child, childIndex) => <li key={childIndex} className="pl-2 leading-8">{isText(child) ? <Text node={child} /> : <InlineContent nodes={child.children} />}</li>)}</ul>;
      case "ol": { const listStyle = { decimal: "list-decimal", "lower-alpha": "list-[lower-alpha]", "upper-alpha": "list-[upper-alpha]", "lower-roman": "list-[lower-roman]", "upper-roman": "list-[upper-roman]" }[String(node.listStyle || "decimal")] || "list-decimal"; return <ol key={index} className={`mb-5 ml-6 list-outside ${listStyle}`}>{node.children.map((child, childIndex) => <li key={childIndex} className="pl-2 leading-8">{isText(child) ? <Text node={child} /> : <InlineContent nodes={child.children} />}</li>)}</ol>; }
      case "pro-tip": return <aside key={index} className="blog-callout blog-tip">💡 {content}</aside>;
      case "warning": return <aside key={index} className="blog-callout blog-warning">⚠️ {content}</aside>;
      case "info": return <aside key={index} className="blog-callout blog-summary">ℹ️ {content}</aside>;
      case "divider": return <div key={index} className="my-10 text-center text-slate-400" aria-label="Section divider">• • •</div>;
      case "hr": return <hr key={index} className="my-10 border-0 border-t border-slate-300" />;
      case "image": { const width = { "25": "w-1/4", "50": "w-1/2", "75": "w-3/4", "100": "w-full" }[String((node as any).imageWidth || "100") as "25" | "50" | "75" | "100"] || "w-full"; const ratio = { auto: "", square: "aspect-square", landscape: "aspect-[4/3]", wide: "aspect-video" }[String((node as any).imageRatio || "auto") as "auto" | "square" | "landscape" | "wide"] || ""; const position = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[alignKey as "left" | "center" | "right"] || "mr-auto"; return <figure key={index} className={`my-7 ${width} ${ratio} ${position}`}>{node.url && <img className={`h-full w-full rounded-2xl object-cover ${ratio ? "" : "h-auto"}`} src={node.url} alt={node.alt || ""} />} {node.caption && <figcaption className="mt-2 text-center text-sm text-slate-500">{node.caption}</figcaption>}</figure>; }
      case "video": return <div key={index} className="my-7 aspect-video overflow-hidden rounded-2xl bg-slate-950">{node.url && <iframe className="h-full w-full" src={node.url} title="Embedded video" allowFullScreen />}</div>;
      case "code-block": return <pre key={index} className={blockClass} style={blockStyle}><code>{content}</code></pre>;
      default: return <p key={index} className={blockClass} style={blockStyle}>{content}</p>;
    }
  })}</article>;
}
