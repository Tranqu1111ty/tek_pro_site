import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

let origin;
let server;

before(async () => {
  const { startProdServer } = await import(
    "../dist/standalone/node_modules/vinext/dist/server/prod-server.js"
  );
  const started = await startProdServer({
    host: "127.0.0.1",
    port: 0,
    outDir: fileURLToPath(new URL("../dist/standalone/dist", import.meta.url)),
  });

  server = started.server;
  origin = `http://127.0.0.1:${started.port}`;
});

after(async () => {
  if (!server) return;

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function render(path = "/") {
  return fetch(`${origin}${path}`, {
    headers: { accept: "text/html" },
  });
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
  assert.match(html, /aria-controls="project-inquiry-dialog"/);
  assert.match(html, /7726542687/);
  assert.match(html, /1067746698271/);
  assert.match(html, /Политика cookie/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("server-renders the cookie policy", async () => {
  const response = await render("/cookie-policy");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Политика использования файлов cookie/);
  assert.match(html, /локального хранилища/);
  assert.match(html, /сторонние сервисы веб-аналитики/i);
  assert.match(html, /23 июля 2026 года/);
});

test("validates project inquiry submissions on the server", async () => {
  const response = await fetch(`${origin}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "А",
      phone: "123",
      message: "Коротко",
      consent: "accepted",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "Заполните обязательные поля формы.",
  });
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

  const [page, footer, consent, contactRoute, projectModal] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/layout/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/privacy/CookieConsent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/contact/ProjectInquiryModal.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<StickyScrollGallery/);
  assert.doesNotMatch(page, /DroneStage|DroneScene/);
  assert.match(footer, /DynamicWaveCanvasBackground/);
  assert.match(consent, /localStorage\.setItem/);
  assert.match(consent, /accepted/);
  assert.match(consent, /rejected/);
  assert.match(contactRoute, /RATE_LIMIT_REQUESTS/);
  assert.match(contactRoute, /secure: true/);
  assert.match(contactRoute, /minVersion: "TLSv1\.2"/);
  assert.match(contactRoute, /rejectUnauthorized: true/);
  assert.match(contactRoute, /disableFileAccess: true/);
  assert.match(projectModal, /fetch\("\/api\/contact"/);
});
