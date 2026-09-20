import { articleHref, getPosts } from "@/lib/api";
function escape(value: string) { return value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]!); }
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; const { posts } = await getPosts();
  const urls = [`<url><loc>${escape(base)}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`, `<url><loc>${escape(`${base}/explore`)}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`, ...posts.map((post) => `<url><loc>${escape(`${base}${articleHref(post)}`)}</loc><lastmod>${new Date(post.updated_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)].join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
