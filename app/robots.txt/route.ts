export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const body = [`User-agent: *`, `Allow: /`, `Disallow: /login`, `Disallow: /register`, `Disallow: /profile`, `Disallow: /saved`, `Disallow: /write`, `Disallow: /search`, `Disallow: /moderation`, `Disallow: /users`, `Sitemap: ${base}/sitemap.xml`, ``].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
