"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, ImagePlus, Info, Italic, Lightbulb, List, ListOrdered, LoaderCircle, Minus, PaintBucket, Plus, Quote, TriangleAlert, Underline, Video } from "lucide-react";
import { BoldPlugin, BlockquotePlugin, H1Plugin, H2Plugin, H3Plugin, ItalicPlugin, UnderlinePlugin } from "@platejs/basic-nodes/react";
import { ParagraphPlugin, Plate, PlateContent, createPlatePlugin, usePlateEditor } from "platejs/react";
import type { PlateElementProps } from "platejs/react";
import type { PlateValue } from "@/components/plate/types";
import { API_URL } from "@/lib/api";
import { authenticatedFetch } from "@/lib/auth";

type Props = { value: PlateValue; onChange: (value: PlateValue) => void; disabled?: boolean };
function ToolbarButton({ label, children, onClick, active = false, disabled = false }: { label: string; children: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) { return <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={active} disabled={disabled} className={`grid size-9 place-items-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-wait disabled:opacity-50 ${active ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>{children}</button>; }

function CalloutElement({ attributes, children, element }: PlateElementProps) {
  const type = String(element.type);
  const tones: Record<string, string> = { "pro-tip": "border-emerald-200 bg-emerald-50 text-emerald-950", warning: "border-amber-200 bg-amber-50 text-amber-950", info: "border-sky-200 bg-sky-50 text-sky-950" };
  const icons: Record<string, string> = { "pro-tip": "💡", warning: "⚠️", info: "ℹ️" };
  return <aside {...attributes} className={`my-5 rounded-xl border-l-4 p-4 font-sans text-sm leading-6 ${tones[type] || "border-slate-200 bg-slate-50"}`}><span className="mr-2" aria-hidden>{icons[type]}</span>{children}</aside>;
}

function ListElement({ attributes, children, element }: PlateElementProps) {
  const Tag = element.type === "ol" ? "ol" : "ul";
  const style = { decimal: "list-decimal", "lower-alpha": "list-[lower-alpha]", "upper-alpha": "list-[upper-alpha]", "lower-roman": "list-[lower-roman]", "upper-roman": "list-[upper-roman]" }[String((element as any).listStyle || "decimal")] || "list-decimal";
  return <Tag {...attributes} className={`mb-5 ml-6 list-outside ${element.type === "ol" ? style : "list-disc"}`}>{children}</Tag>;
}

function ListItemElement({ attributes, children }: PlateElementProps) {
  return <li {...attributes} className="pl-2 leading-8">{children}</li>;
}

function TableElement({ attributes, children }: PlateElementProps) {
  return <div {...attributes} className="my-7 overflow-x-auto"><table className="w-full border-collapse overflow-hidden rounded-xl border border-slate-200 text-left text-base"><tbody>{children}</tbody></table></div>;
}

function TableRowElement({ attributes, children }: PlateElementProps) {
  return <tr {...attributes} className="border-b border-slate-200 last:border-b-0">{children}</tr>;
}

function TableCellElement({ attributes, children }: PlateElementProps) {
  return <td {...attributes} className="min-w-32 border-r border-slate-200 p-3 align-top last:border-r-0">{children}</td>;
}

function MediaElement({ attributes, children, element }: PlateElementProps) {
  const url = typeof element.url === "string" ? element.url : "";
  if (element.type === "divider") return <div {...attributes} className="my-10 text-center text-slate-400" contentEditable={false}>• • •{children}</div>;
  if (element.type === "image") { const width = { "25": "w-1/4", "50": "w-1/2", "75": "w-3/4", "100": "w-full" }[String((element as any).imageWidth || "100")] || "w-full"; const ratio = { auto: "", square: "aspect-square", landscape: "aspect-[4/3]", wide: "aspect-video" }[String((element as any).imageRatio || "auto")] || ""; const position = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[String((element as any).align || "left")] || "mr-auto"; return <figure {...attributes} className={`my-7 ${width} ${ratio} ${position}`} contentEditable={false}>{url && <img className={`h-full w-full rounded-2xl object-cover shadow-lg ${ratio ? "" : "h-auto"}`} src={url} alt={typeof element.alt === "string" ? element.alt : ""} />}<figcaption className="mt-2 text-center text-sm text-slate-500">{typeof element.caption === "string" ? element.caption : ""}</figcaption>{children}</figure>; }
  if (element.type === "video") return <div {...attributes} className="my-7 aspect-video overflow-hidden rounded-2xl bg-slate-950" contentEditable={false}>{url && <iframe className="h-full w-full" src={url} title="Embedded video" allowFullScreen />}{children}</div>;
  return <div {...attributes}>{children}</div>;
}

function TextBlockElement({ attributes, children, element }: PlateElementProps) {
  const type = String(element.type);
  const align = { left: "text-left", center: "text-center", right: "text-right", justify: "text-justify" }[String((element as any).align || "left")] || "text-left";
  const size = { "14": "text-sm", "16": "text-base", "18": "text-lg", "20": "text-xl", "22": "text-2xl", "24": "text-3xl", "26": "text-4xl" }[String((element as any).fontSize || "18")] || "text-lg";
  const backgroundColor = String((element as any).backgroundColor || "transparent");
  const classes: Record<string, string> = { p: `${size} mb-5 leading-8 text-slate-800`, h1: "mb-6 mt-10 font-serif text-5xl font-bold leading-tight tracking-tight text-slate-950", h2: "mb-4 mt-10 border-b border-slate-200 pb-3 font-serif text-3xl font-bold tracking-tight text-slate-900", h3: "mb-3 mt-8 font-serif text-2xl font-bold text-slate-900", blockquote: "my-7 border-l-4 border-indigo-300 bg-indigo-50/50 py-2 pl-6 pr-4 text-xl italic leading-8 text-slate-600", "code-block": "my-7 overflow-x-auto rounded-xl bg-slate-900 p-5 font-mono text-sm leading-7 text-slate-100" };
  const Tag = type === "h1" ? "h1" : type === "h2" ? "h2" : type === "h3" ? "h3" : type === "blockquote" ? "blockquote" : type === "code-block" ? "pre" : "p";
  return <Tag {...attributes} className={`${classes[type] || classes.p} ${align} ${backgroundColor !== "transparent" ? "rounded-lg px-4 py-2" : ""}`} style={backgroundColor !== "transparent" ? { backgroundColor } : undefined}>{children}</Tag>;
}

function Leaf({ attributes, children, leaf }: any) {
  let output = children;
  if (leaf.bold) output = <strong>{output}</strong>;
  if (leaf.italic) output = <em>{output}</em>;
  if (leaf.underline) output = <u>{output}</u>;
  if (typeof leaf.link === "string") output = <a className="text-indigo-600 underline underline-offset-4" href={leaf.link}>{output}</a>;
  return <span {...attributes}>{output}</span>;
}

const ProTipPlugin = createPlatePlugin({ key: "pro-tip", node: { isElement: true } }).withComponent(CalloutElement);
const WarningPlugin = createPlatePlugin({ key: "warning", node: { isElement: true } }).withComponent(CalloutElement);
const InfoPlugin = createPlatePlugin({ key: "info", node: { isElement: true } }).withComponent(CalloutElement);
const ImageBlockPlugin = createPlatePlugin({ key: "image", node: { isElement: true, isVoid: true } }).withComponent(MediaElement);
const VideoBlockPlugin = createPlatePlugin({ key: "video", node: { isElement: true, isVoid: true } }).withComponent(MediaElement);
const DividerPlugin = createPlatePlugin({ key: "divider", node: { isElement: true, isVoid: true } }).withComponent(MediaElement);
const HrPlugin = createPlatePlugin({ key: "hr", node: { isElement: true, isVoid: true } }).withComponent(({ attributes, children }: PlateElementProps) => <div {...attributes} className="my-10" contentEditable={false}><hr className="border-0 border-t-2 border-slate-300" />{children}</div>);
const UnorderedListPlugin = createPlatePlugin({ key: "ul", node: { isElement: true } }).withComponent(ListElement);
const OrderedListPlugin = createPlatePlugin({ key: "ol", node: { isElement: true } }).withComponent(ListElement);
const ListItemPlugin = createPlatePlugin({ key: "li", node: { isElement: true } }).withComponent(ListItemElement);
const TablePlugin = createPlatePlugin({ key: "table", node: { isElement: true } }).withComponent(TableElement);
const TableRowPlugin = createPlatePlugin({ key: "tr", node: { isElement: true } }).withComponent(TableRowElement);
const TableCellPlugin = createPlatePlugin({ key: "td", node: { isElement: true } }).withComponent(TableCellElement);
const BACKGROUND_PRESETS = [{ name: "Slate", value: "#e2e8f0" }, { name: "Lavender", value: "#ede9fe" }, { name: "Mint", value: "#d1fae5" }, { name: "Sun", value: "#fef3c7" }, { name: "Rose", value: "#ffe4e6" }];

export function PlateEditor({ value, onChange, disabled = false }: Props) {
  const editor = usePlateEditor({ plugins: [ParagraphPlugin.withComponent(TextBlockElement), BoldPlugin, ItalicPlugin, UnderlinePlugin, H1Plugin.withComponent(TextBlockElement), H2Plugin.withComponent(TextBlockElement), H3Plugin.withComponent(TextBlockElement), BlockquotePlugin.withComponent(TextBlockElement), HrPlugin, UnorderedListPlugin, OrderedListPlugin, ListItemPlugin, TablePlugin, TableRowPlugin, TableCellPlugin, ProTipPlugin, WarningPlugin, InfoPlugin, ImageBlockPlugin, VideoBlockPlugin, DividerPlugin], value });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const [activeBlock, setActiveBlock] = useState("p");
  const [activeMarks, setActiveMarks] = useState({ bold: false, italic: false, underline: false });
  const [uploading, setUploading] = useState(false);
  const [textSize, setTextSize] = useState(18);
  const [alignment, setAlignment] = useState("left");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundPreset, setBackgroundPreset] = useState("none");
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [imageWidth, setImageWidth] = useState("100");
  const [imageRatio, setImageRatio] = useState("auto");
  const [orderedListStyle, setOrderedListStyle] = useState("decimal");
  useEffect(() => {
    const closeColorMenu = (event: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) setColorMenuOpen(false);
    };
    document.addEventListener("mousedown", closeColorMenu);
    return () => document.removeEventListener("mousedown", closeColorMenu);
  }, []);
  const setBlock = useCallback((type: string) => { const nextType = activeBlock === type ? "p" : type; editor.tf.setNodes({ type: nextType }); setActiveBlock(nextType); }, [activeBlock, editor]);
  const toggleList = useCallback((type: "ul" | "ol") => {
    const isCurrentList = activeBlock === type;
    if (isCurrentList) {
      editor.tf.setNodes({ type: "p" } as any);
      editor.tf.unwrapNodes({ match: (node) => (node as any).type === type });
      setActiveBlock("p");
      return;
    }
    editor.tf.setNodes({ type: "li" } as any);
    editor.tf.wrapNodes({ type, listStyle: type === "ol" ? orderedListStyle : undefined, children: [] } as any);
    setActiveBlock(type);
  }, [activeBlock, editor, orderedListStyle]);
  const changeOrderedListStyle = useCallback((listStyle: string) => {
    setOrderedListStyle(listStyle);
    const list = editor.api.above({ match: (node) => (node as any).type === "ol" });
    if (list) editor.tf.setNodes({ listStyle } as any, { at: list[1] });
  }, [editor]);
  const insertTable = useCallback(() => {
    const rows = Math.min(8, Math.max(1, Number.parseInt(window.prompt("Number of table rows", "2") || "2", 10) || 2));
    const columns = Math.min(6, Math.max(1, Number.parseInt(window.prompt("Number of table columns", "2") || "2", 10) || 2));
    const table = { type: "table", children: Array.from({ length: rows }, () => ({ type: "tr", children: Array.from({ length: columns }, () => ({ type: "td", children: [{ text: "" }] })) })) };
    editor.tf.insertNodes([table, { type: "p", children: [{ text: "" }] }] as any);
  }, [editor]);
  const insertMedia = useCallback((type: "image" | "video") => {
    const url = window.prompt(type === "image" ? "Image URL" : "YouTube/Vimeo embed URL");
    if (url) editor.tf.insertNodes({ type, url, children: [{ text: "" }] });
  }, [editor]);
  const toggleMark = useCallback((mark: "bold" | "italic" | "underline") => { editor.tf[mark].toggle(); setActiveMarks((current) => ({ ...current, [mark]: !current[mark] })); }, [editor]);
  const setBlockAttribute = useCallback((attribute: "align" | "fontSize" | "backgroundColor" | "imageWidth" | "imageRatio", nextValue: string | number) => editor.tf.setNodes({ [attribute]: nextValue } as any), [editor]);
  const changeTextSize = useCallback((delta: number) => { const next = Math.min(26, Math.max(14, textSize + delta)); setTextSize(next); setBlockAttribute("fontSize", next); }, [setBlockAttribute, textSize]);
  const editImageCaption = useCallback(() => {
    const image = editor.api.block()?.[0] as Record<string, unknown> | undefined;
    if (image?.type !== "image") return;
    const caption = window.prompt("Image caption", typeof image.caption === "string" ? image.caption : "");
    if (caption !== null) editor.tf.setNodes({ caption });
  }, [editor]);
  const syncToolbarWithSelection = useCallback(() => {
    if (!editor.selection) return;
    const entry = editor.api.block();
    const block = entry?.[0] as Record<string, unknown> | undefined;
    const marks = editor.api.marks() as Record<string, unknown> | null;
    const list = editor.api.above({ match: (node) => ["ul", "ol"].includes(String((node as any).type)) })?.[0] as Record<string, unknown> | undefined;
    setActiveBlock(typeof list?.type === "string" ? list.type : typeof block?.type === "string" ? block.type : "p");
    setOrderedListStyle(typeof list?.listStyle === "string" ? list.listStyle : "decimal");
    setActiveMarks({ bold: Boolean(marks?.bold), italic: Boolean(marks?.italic), underline: Boolean(marks?.underline) });
    setTextSize(typeof block?.fontSize === "number" ? block.fontSize : 18);
    setAlignment(typeof block?.align === "string" ? block.align : "left");
    const selectedBackground = typeof block?.backgroundColor === "string" ? block.backgroundColor : "transparent";
    setBackgroundColor(selectedBackground !== "transparent" ? selectedBackground : "#ffffff");
    setBackgroundPreset(BACKGROUND_PRESETS.some((preset) => preset.value === selectedBackground) ? selectedBackground : "none");
    setImageWidth(typeof block?.imageWidth === "string" ? block.imageWidth : "100");
    setImageRatio(typeof block?.imageRatio === "string" ? block.imageRatio : "auto");
  }, [editor]);
  const uploadImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append("image", file);
      const response = await authenticatedFetch(`${API_URL}/upload/`, { method: "POST", headers: { Accept: "application/json" }, body });
      const payload = await response.json() as { data?: { url?: string }; message?: string };
      if (!response.ok || !payload.data?.url) throw new Error(payload.message || "Image upload failed.");
      editor.tf.insertNodes([{ type: "image", url: payload.data.url, alt: file.name, caption: "", children: [{ text: "" }] }, { type: "p", children: [{ text: "" }] }] as any);
    } catch (error) { window.alert(error instanceof Error ? error.message : "Image upload failed."); }
    finally { setUploading(false); }
  }, [editor]);
  return <div className="rich-text-editor w-full min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
    <input ref={imageInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void uploadImage(event)} />
    <div className="plate-editor-toolbar flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white/95 p-2 backdrop-blur-md" role="toolbar" aria-label="Editor formatting">
      <select aria-label="Block type" value={["h1", "h2", "h3"].includes(activeBlock) ? activeBlock : "p"} onChange={(event) => setBlock(event.target.value)} className="h-9 rounded-lg border-0 bg-slate-100 px-3 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-200"><option value="p">Text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
      <div className="flex h-9 items-center rounded-lg bg-slate-100"><ToolbarButton label="Decrease text size" onClick={() => changeTextSize(-2)}><Minus size={16} /></ToolbarButton><output className="w-8 text-center text-sm font-semibold text-slate-700">{textSize}</output><ToolbarButton label="Increase text size" onClick={() => changeTextSize(2)}><Plus size={16} /></ToolbarButton></div>
      <select aria-label="Text alignment" value={alignment} onChange={(event) => { setAlignment(event.target.value); setBlockAttribute("align", event.target.value); }} className="h-9 rounded-lg border-0 bg-slate-100 px-2 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-200"><option value="left">Align left</option><option value="center">Align center</option><option value="right">Align right</option><option value="justify">Justify</option></select>
      <div ref={colorMenuRef} className="relative"><ToolbarButton label="Background color" active={backgroundPreset !== "none" || backgroundColor !== "#ffffff"} onClick={() => setColorMenuOpen((open) => !open)}><PaintBucket size={18} /></ToolbarButton>{colorMenuOpen && <div className="absolute left-0 top-11 z-20 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Background</p><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => { setBackgroundPreset("none"); setBackgroundColor("#ffffff"); setBlockAttribute("backgroundColor", "transparent"); }} className={`h-9 rounded-md border text-xs font-medium ${backgroundPreset === "none" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>None</button>{BACKGROUND_PRESETS.map((preset) => <button key={preset.value} type="button" aria-label={preset.name} title={preset.name} onClick={() => { setBackgroundPreset(preset.value); setBackgroundColor(preset.value); setBlockAttribute("backgroundColor", preset.value); }} className={`h-9 rounded-md border ${backgroundPreset === preset.value ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`} style={{ backgroundColor: preset.value }} />)}</div><label className="mt-3 flex items-center justify-between text-xs font-medium text-slate-600">Custom color<input type="color" aria-label="Custom background color" value={backgroundColor} disabled={backgroundPreset !== "none"} onChange={(event) => { setBackgroundColor(event.target.value); setBlockAttribute("backgroundColor", event.target.value); }} className="size-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-40" /></label></div>}</div>
      <select aria-label="Image width" value={imageWidth} disabled={activeBlock !== "image"} onChange={(event) => { setImageWidth(event.target.value); setBlockAttribute("imageWidth", event.target.value); }} className="h-9 rounded-lg border-0 bg-slate-100 px-2 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"><option value="100">Image 100%</option><option value="75">Image 75%</option><option value="50">Image 50%</option><option value="25">Image 25%</option></select><select aria-label="Image ratio" value={imageRatio} disabled={activeBlock !== "image"} onChange={(event) => { setImageRatio(event.target.value); setBlockAttribute("imageRatio", event.target.value); }} className="h-9 rounded-lg border-0 bg-slate-100 px-2 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"><option value="auto">Original ratio</option><option value="square">1:1</option><option value="landscape">4:3</option><option value="wide">16:9</option></select><ToolbarButton label="Edit image caption" disabled={activeBlock !== "image"} onClick={editImageCaption}><span className="text-xs font-bold">CAP</span></ToolbarButton><span className="mx-1 h-6 w-px bg-slate-200" /><ToolbarButton label="Unordered list" active={activeBlock === "ul"} onClick={() => toggleList("ul")}><List size={18} /></ToolbarButton><ToolbarButton label="Ordered list" active={activeBlock === "ol"} onClick={() => toggleList("ol")}><ListOrdered size={18} /></ToolbarButton><select aria-label="Ordered-list style" disabled={activeBlock !== "ol"} value={orderedListStyle} onChange={(event) => changeOrderedListStyle(event.target.value)} className="h-9 rounded-lg border-0 bg-slate-100 px-2 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"><option value="decimal">1. 2. 3.</option><option value="lower-alpha">a. b. c.</option><option value="upper-alpha">A. B. C.</option><option value="lower-roman">i. ii. iii.</option><option value="upper-roman">I. II. III.</option></select><ToolbarButton label="Quote" active={activeBlock === "blockquote"} onClick={() => setBlock("blockquote")}><Quote size={18} /></ToolbarButton><ToolbarButton label="Pro tip" active={activeBlock === "pro-tip"} onClick={() => setBlock("pro-tip")}><Lightbulb size={18} /></ToolbarButton><ToolbarButton label="Warning" active={activeBlock === "warning"} onClick={() => setBlock("warning")}><TriangleAlert size={18} /></ToolbarButton><ToolbarButton label="Info" active={activeBlock === "info"} onClick={() => setBlock("info")}><Info size={18} /></ToolbarButton><span className="mx-1 h-6 w-px bg-slate-200" /><ToolbarButton label="Bold" active={activeMarks.bold} onClick={() => toggleMark("bold")}><Bold size={18} /></ToolbarButton><ToolbarButton label="Italic" active={activeMarks.italic} onClick={() => toggleMark("italic")}><Italic size={18} /></ToolbarButton><ToolbarButton label="Underline" active={activeMarks.underline} onClick={() => toggleMark("underline")}><Underline size={18} /></ToolbarButton><span className="mx-1 h-6 w-px bg-slate-200" /><ToolbarButton label="Upload image" disabled={uploading} onClick={() => imageInputRef.current?.click()}>{uploading ? <LoaderCircle className="animate-spin" size={18} /> : <ImagePlus size={18} />}</ToolbarButton><ToolbarButton label="Video embed" onClick={() => insertMedia("video")}><Video size={18} /></ToolbarButton><ToolbarButton label="Horizontal line" onClick={() => editor.tf.insertNodes([{ type: "hr", children: [{ text: "" }] }, { type: "p", children: [{ text: "" }] }] as any)}><Minus size={18} /></ToolbarButton><ToolbarButton label="Dot divider" onClick={() => editor.tf.insertNodes({ type: "divider", children: [{ text: "" }] })}><span className="text-base">•••</span></ToolbarButton>
      <ToolbarButton label="Insert table" onClick={insertTable}><span className="text-lg leading-none">▦</span></ToolbarButton>
    </div>
    <Plate editor={editor} onValueChange={({ value: nextValue }) => onChange(nextValue as PlateValue)} renderLeaf={Leaf}>
      <PlateContent disabled={disabled} onMouseUp={syncToolbarWithSelection} onKeyUp={syncToolbarWithSelection} onSelect={syncToolbarWithSelection} onKeyDown={(event) => { if (event.key === "Enter" && ["h1", "h2", "h3", "pro-tip", "warning", "info"].includes(activeBlock)) window.setTimeout(() => { editor.tf.setNodes({ type: "p" }); setActiveBlock("p"); }, 0); }} className="plate-editor-content min-h-[460px] px-6 py-10 font-serif text-lg leading-8 text-slate-800 outline-none sm:px-12" placeholder="Write something worth sharing…" />
    </Plate>
  </div>;
}
