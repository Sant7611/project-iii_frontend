export type PlateText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; link?: string };
export type PlateNode = { type: string; children: Array<PlateText | PlateNode>; url?: string; alt?: string; caption?: string; language?: string; listStyle?: string };
export type PlateValue = PlateNode[];

export const EMPTY_PLATE_VALUE: PlateValue = [{ type: "p", children: [{ text: "" }] }];

export function parsePlateContent(content: string): PlateValue | null {
  try {
    const value: unknown = JSON.parse(content);
    return Array.isArray(value) ? value as PlateValue : null;
  } catch {
    return null;
  }
}
