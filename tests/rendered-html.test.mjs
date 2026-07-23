import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the TEKPRO corporate site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ru">/i);
  assert.match(html, /<title>ТЭКПРО — комплексное проектирование и инженерные изыскания<\/title>/i);
  assert.match(html, /Полный цикл/);
  assert.match(html, /Промышленные процессы/);
  assert.match(html, /Лаборатория механики грунтов/);
  assert.match(html, /info@tekpro\.ru/);
  assert.match(html, /Политика конфиденциальности/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("keeps required public assets and production components", async () => {
  const requiredFiles = [
    "../public/media/video_loop.mp4",
    "../public/media/logo6.png",
    "../public/media/sertificate.jpg",
    "../public/documents/ptekpropd.pdf",
    "../components/cinematic/CinematicHero.tsx",
    "../components/ui/sticky-scroll.tsx",
    "../components/ui/dynamic-wave-canvas-background.tsx",
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, import.meta.url))));

  const [page, footer] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/layout/Footer.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<StickyScrollGallery/);
  assert.doesNotMatch(page, /DroneStage|DroneScene/);
  assert.match(footer, /DynamicWaveCanvasBackground/);
});
