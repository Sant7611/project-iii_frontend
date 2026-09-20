import assert from "node:assert/strict";
import test from "node:test";

async function request(path = "/", accept = "text/html") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Quillora home page", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Quillora — Ideas worth reading \| Quillora<\/title>/i);
  assert.match(html, /Stories that stay with you/i);
  assert.match(html, /Quillora/i);
  assert.doesNotMatch(html, /tfacts|codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("serves crawl controls", async () => {
  const robots = await request("/robots.txt", "text/plain");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: .*\/sitemap\.xml/);

  const sitemap = await request("/sitemap.xml", "application/xml");
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /<urlset/);
});
