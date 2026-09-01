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
  assert.match(html, /<meta name="description" content="ТЭКПРО — инжиниринговая компания/);
  assert.match(html, /<meta property="og:site_name" content="ТЭКПРО"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/tekpro\.ru\/media\/company-cycle\.png"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /https:\/\/schema\.org/);
  assert.match(html, /"@type":"Organization"/);
  assert.match(html, /"@type":"WebSite"/);
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

test("serves crawl directives and the canonical sitemap", async () => {
  const robotsResponse = await fetch(`${origin}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  assert.match(robotsResponse.headers.get("content-type") ?? "", /^text\/plain\b/i);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \//i);
  assert.match(robots, /Disallow: \/api\//i);
  assert.match(robots, /Sitemap: https:\/\/tekpro\.ru\/sitemap\.xml/i);

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type") ?? "", /application\/xml/i);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /<loc>https:\/\/tekpro\.ru\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/tekpro\.ru\/cookie-policy<\/loc>/);
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
    message: "Проверьте выделенные поля.",
    errors: {
      name: "Укажите имя длиной от 2 до 80 символов.",
      company: "Укажите название компании длиной от 2 до 120 символов.",
      phone: "Введите российский номер из 10 цифр после +7.",
      email: "Проверьте адрес электронной почты.",
      message: "Опишите проект: от 10 до 3000 символов.",
    },
  });
});

test("rejects non-object contact payloads", async () => {
  const response = await fetch(`${origin}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "null",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "Некорректный формат заявки.",
  });
});

test("keeps required public assets and production components", async () => {
  const requiredFiles = [
    "../public/media/hero/hero-timeline-desktop-v1.mp4",
    "../public/media/hero/hero-timeline-mobile-v1.mp4",
    "../public/media/logo6.png",
    "../public/media/sertificate.jpg",
    "../public/media/brand/tekpro-logo-email.png",
    "../public/documents/ptekpropd.pdf",
    "../components/cinematic/CinematicHero.tsx",
    "../components/ui/sticky-scroll.tsx",
    "../components/ui/dynamic-wave-canvas-background.tsx",
    "../app/robots.ts",
    "../app/sitemap.ts",
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, import.meta.url))));

  const [page, footer, consent, contactRoute, projectModal, cinematicHero, globalStyles, caddyfile] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/layout/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/privacy/CookieConsent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/contact/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/contact/ProjectInquiryModal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/cinematic/CinematicHero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../Caddyfile", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<StickyScrollGallery/);
  assert.doesNotMatch(page, /post-hero-content/);
  assert.doesNotMatch(page, /DroneStage|DroneScene/);
  assert.match(footer, /DynamicWaveCanvasBackground/);
  assert.match(footer, /Обсудим ваш проект/);
  assert.match(footer, /footer-cta-note/);
  assert.match(consent, /localStorage\.setItem/);
  assert.match(consent, /accepted/);
  assert.match(consent, /rejected/);
  assert.match(contactRoute, /RATE_LIMIT_REQUESTS/);
  assert.match(contactRoute, /sendEmailInBackground/);
  assert.match(contactRoute, /"Заявка принята\.", 202/);
  assert.match(contactRoute, /BACKGROUND_EMAIL_ATTEMPTS = 3/);
  assert.match(contactRoute, /secure: true/);
  assert.match(contactRoute, /minVersion: "TLSv1\.2"/);
  assert.match(contactRoute, /rejectUnauthorized: true/);
  assert.match(contactRoute, /disableFileAccess: true/);
  assert.match(contactRoute, /pool: true/);
  assert.match(contactRoute, /connectionTimeout: 8_000/);
  assert.match(contactRoute, /escapeHtml\(message\)/);
  assert.match(contactRoute, /role="presentation"/);
  assert.match(contactRoute, /Чтобы связаться с клиентом/);
  assert.match(contactRoute, /href="mailto:\$\{escapeHtml\(email\)\}"/);
  assert.match(
    contactRoute,
    /src="cid:tekpro-logo-email@tekpro\.ru"/,
  );
  assert.match(contactRoute, /alt="ТЭКПРО"/);
  assert.match(contactRoute, /contentDisposition: "inline"/);
  assert.match(contactRoute, /cid: "tekpro-logo-email@tekpro\.ru"/);
  assert.match(contactRoute, /getEmailLogoContent/);
  assert.doesNotMatch(contactRoute, /border-left:3px/);
  assert.match(caddyfile, /\/media\/\*/);
  assert.match(caddyfile, /\/media\/hero\/\*/);
  assert.match(caddyfile, /max-age=31536000, immutable/);
  assert.match(caddyfile, /@legacy_pages path \/cgi-bin\/\*/);
  assert.match(caddyfile, /redir @legacy_pages https:\/\/tekpro\.ru\/ permanent/);
  assert.match(cinematicHero, /hero-timeline-desktop-v1\.mp4/);
  assert.match(cinematicHero, /hero-timeline-mobile-v1\.mp4/);
  assert.match(cinematicHero, /FIRST_SCENE_DURATION = 4\.041667/);
  assert.match(cinematicHero, /SECOND_SCENE_DURATION = 8\.041667/);
  assert.match(cinematicHero, /THIRD_SCENE_DURATION = 6\.041667/);
  assert.match(cinematicHero, /MODELING_STAGE_END = FIRST_SCENE_DURATION \/ 2/);
  assert.match(cinematicHero, /PROJECT_STAGE_END = FIRST_SCENE_DURATION/);
  assert.match(cinematicHero, /RESEARCH_STAGE_END = PROJECT_STAGE_END \+ SECOND_SCENE_DURATION \/ 2/);
  assert.match(cinematicHero, /PREPARATION_STAGE_END = PROJECT_STAGE_END \+ SECOND_SCENE_DURATION/);
  assert.match(cinematicHero, /BUILD_STAGE_END = PREPARATION_STAGE_END \+ 3/);
  assert.match(cinematicHero, /timelineTime = stickyProgress \* TOTAL_DURATION/);
  assert.match(cinematicHero, /targetTimeRef\.current = timelineTime/);
  assert.match(cinematicHero, /MIN_FULL_HERO_SCROLL_DURATION_MS = 7_000/);
  assert.match(cinematicHero, /maximumPixelsPerMillisecond/);
  assert.match(cinematicHero, /window\.addEventListener\("wheel", handleWheel, \{ passive: false, capture: true \}\)/);
  assert.match(cinematicHero, /event\.stopImmediatePropagation\(\)/);
  assert.match(cinematicHero, /toggleAttribute\("data-lenis-prevent-wheel", preventsLenisWheel\)/);
  assert.match(cinematicHero, /removeAttribute\("data-lenis-prevent-wheel"\)/);
  assert.doesNotMatch(cinematicHero, /data-reduced-motion=\{reducedMotion\}\s+data-lenis-prevent-wheel/);
  assert.match(cinematicHero, /startsNewGesture/);
  assert.match(cinematicHero, /wheelGestureLocked/);
  assert.match(cinematicHero, /STAGE_END_TIMES\.find/);
  assert.match(cinematicHero, /targetTimelineTime \/ TOTAL_DURATION/);
  assert.doesNotMatch(cinematicHero, /wheelTarget \+ delta/);
  assert.match(cinematicHero, /HERO_EXIT_SCROLL_DURATION_MS = 900/);
  assert.match(cinematicHero, /wheelAnimationMode: "stage" \| "exit" \| "enter" \| "release"/);
  assert.match(cinematicHero, /document\.getElementById\("about"\)/);
  assert.match(cinematicHero, /easedProgress/);
  assert.match(cinematicHero, /completedMode === "exit"/);
  assert.match(cinematicHero, /returningToHero/);
  assert.match(cinematicHero, /wheelAnimationMode = "enter"/);
  assert.match(cinematicHero, /heroIsVisible/);
  assert.match(cinematicHero, /transitionIsActive/);
  assert.match(cinematicHero, /controlsSectionBoundary/);
  assert.match(cinematicHero, /continuingPastHero/);
  assert.match(cinematicHero, /wheelAnimationMode = "release"/);
  assert.match(cinematicHero, /ref=\{videoRef\}/);
  assert.doesNotMatch(cinematicHero, /HERO_SCENES|locateScene|assignSceneToSlot|slotScenesRef/);
  assert.doesNotMatch(cinematicHero, /HERO_STICKY_END_TIME|releasedProgress/);
  assert.match(cinematicHero, /locateStage\(timelineTime\)/);
  assert.doesNotMatch(cinematicHero, /hero-post-translate/);
  assert.doesNotMatch(cinematicHero, /stageIndexes/);
  assert.doesNotMatch(cinematicHero, /scene-[123]-(?:desktop|mobile)-v\d+\.mp4/);
  assert.doesNotMatch(cinematicHero, /Моделируем/);
  assert.match(cinematicHero, /site-loading-screen/);
  assert.match(cinematicHero, /video\.seeking/);
  assert.doesNotMatch(cinematicHero, /posterSrc|\.webp/);
  assert.doesNotMatch(cinematicHero, /video_loop\.mp4/);
  assert.match(globalStyles, /\.cinematic-media\s*\{[^}]*opacity:\s*1/s);
  assert.match(projectModal, /fetch\("\/api\/contact"/);
  assert.match(projectModal, /formatRussianPhone/);
  assert.match(projectModal, /deleteContentBackward/);
  assert.match(projectModal, /deleteContentForward/);
  assert.match(projectModal, /data-lenis-prevent-wheel/);
  assert.match(projectModal, /aria-invalid/);
  assert.match(projectModal, /Компания \*/);
  assert.match(projectModal, /Email \*/);
});
