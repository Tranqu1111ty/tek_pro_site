"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { content } from "@/data/content";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type SourceMode = "desktop" | "mobile";

const HERO_VIDEO = {
  desktopSrc: "/media/hero/hero-timeline-desktop-v1.mp4",
  mobileSrc: "/media/hero/hero-timeline-mobile-v1.mp4",
} as const;

const FIRST_SCENE_DURATION = 4.041667;
const SECOND_SCENE_DURATION = 8.041667;
const THIRD_SCENE_DURATION = 6.041667;
const TOTAL_DURATION = FIRST_SCENE_DURATION + SECOND_SCENE_DURATION + THIRD_SCENE_DURATION;
const MODELING_STAGE_END = FIRST_SCENE_DURATION / 2;
const PROJECT_STAGE_END = FIRST_SCENE_DURATION;
const RESEARCH_STAGE_END = PROJECT_STAGE_END + SECOND_SCENE_DURATION / 2;
const PREPARATION_STAGE_END = PROJECT_STAGE_END + SECOND_SCENE_DURATION;
const BUILD_STAGE_END = PREPARATION_STAGE_END + 3;
const STAGE_END_TIMES = [
  MODELING_STAGE_END,
  PROJECT_STAGE_END,
  RESEARCH_STAGE_END,
  PREPARATION_STAGE_END,
  BUILD_STAGE_END,
  TOTAL_DURATION,
] as const;
const INTRO_REVEAL_PORTION = 0.05;
const MIN_FULL_HERO_SCROLL_DURATION_MS = 7_000;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function locateStage(timelineTime: number) {
  let stageStart = 0;

  for (let stageIndex = 0; stageIndex < STAGE_END_TIMES.length; stageIndex += 1) {
    const stageEnd = STAGE_END_TIMES[stageIndex];
    if (timelineTime < stageEnd || stageIndex === STAGE_END_TIMES.length - 1) {
      return {
        stageIndex,
        stageProgress: clamp((timelineTime - stageStart) / (stageEnd - stageStart)),
      };
    }
    stageStart = stageEnd;
  }

  return { stageIndex: STAGE_END_TIMES.length - 1, stageProgress: 1 };
}

export function CinematicHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barFillRefs = useRef<Array<HTMLElement | null>>([]);
  const targetTimeRef = useRef(0);
  const [activeStage, setActiveStage] = useState(0);
  const [started, setStarted] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setSourceMode(media.matches ? "mobile" : "desktop");

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || !sourceMode) return;
    const reduceMotion =
      reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrame = 0;
    let wheelAnimationFrame = 0;
    let wheelTarget = window.scrollY;
    let lastWheelFrameTime = 0;
    let previousScrollBehavior = "";
    let sectionStart = 0;
    let sectionEnd = 1;
    let lastStarted = false;
    let lastStage = -1;

    const clearVideo = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      targetTimeRef.current = 0;
    };

    const measure = () => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      sectionStart = Math.max(0, sectionTop - headerHeight);
      sectionEnd = Math.max(
        sectionStart + 1,
        sectionTop + section.offsetHeight - window.innerHeight,
      );
      if (!wheelAnimationFrame) wheelTarget = clamp(window.scrollY, sectionStart, sectionEnd);
    };

    const stopWheelAnimation = () => {
      if (wheelAnimationFrame) window.cancelAnimationFrame(wheelAnimationFrame);
      wheelAnimationFrame = 0;
      lastWheelFrameTime = 0;
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };

    const animateWheelScroll = (frameTime: number) => {
      const currentScroll = window.scrollY;
      const distance = wheelTarget - currentScroll;

      if (Math.abs(distance) <= 0.5) {
        window.scrollTo(0, wheelTarget);
        stopWheelAnimation();
        return;
      }

      const elapsed = lastWheelFrameTime
        ? Math.min(frameTime - lastWheelFrameTime, 100)
        : 16;
      lastWheelFrameTime = frameTime;
      const maximumPixelsPerMillisecond =
        (sectionEnd - sectionStart) / MIN_FULL_HERO_SCROLL_DURATION_MS;
      const step = Math.sign(distance) * Math.min(
        Math.abs(distance),
        maximumPixelsPerMillisecond * elapsed,
      );

      window.scrollTo(0, currentScroll + step);
      wheelAnimationFrame = window.requestAnimationFrame(animateWheelScroll);
    };

    const startWheelAnimation = () => {
      if (wheelAnimationFrame) return;
      previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      lastWheelFrameTime = 0;
      wheelAnimationFrame = window.requestAnimationFrame(animateWheelScroll);
    };

    const handleWheel = (event: WheelEvent) => {
      if (reduceMotion || event.ctrlKey) return;
      const preventedWheelContainer = event.target instanceof Element
        ? event.target.closest("[data-lenis-prevent-wheel]")
        : null;
      if (preventedWheelContainer && preventedWheelContainer !== section) return;

      const currentScroll = window.scrollY;
      const insideHero = currentScroll >= sectionStart - 1 && currentScroll <= sectionEnd + 1;
      if (!insideHero) return;

      const deltaMultiplier = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      const delta = event.deltaY * deltaMultiplier;
      if (Math.abs(delta) < 0.01) return;

      const atStart = currentScroll <= sectionStart + 0.5 && wheelTarget <= sectionStart + 0.5;
      const atEnd = currentScroll >= sectionEnd - 0.5 && wheelTarget >= sectionEnd - 0.5;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (!wheelAnimationFrame) wheelTarget = clamp(currentScroll, sectionStart, sectionEnd);
      wheelTarget = clamp(wheelTarget + delta, sectionStart, sectionEnd);
      startWheelAnimation();
    };

    const seekVideo = () => {
      if (video.readyState < 1 || video.seeking) return;

      const targetTime = targetTimeRef.current;
      const safeTime = Math.min(
        Math.max(0, targetTime),
        Math.max(0, (Number.isFinite(video.duration) ? video.duration : 0) - 0.001),
      );

      if (Math.abs(video.currentTime - safeTime) > 1 / 30) {
        video.currentTime = safeTime;
      }
    };

    const update = () => {
      animationFrame = 0;
      const stickyProgress = reduceMotion
        ? 0
        : clamp((window.scrollY - sectionStart) / (sectionEnd - sectionStart));
      const introProgress = reduceMotion
        ? 0
        : clamp(stickyProgress / INTRO_REVEAL_PORTION);
      const timelineTime = stickyProgress * TOTAL_DURATION;
      const { stageIndex, stageProgress } = locateStage(timelineTime);

      section.style.setProperty("--hero-intro-progress", introProgress.toFixed(4));
      const initialSideGap = sourceMode === "mobile" ? 8 : 12;
      section.style.setProperty(
        "--hero-side-gap",
        `${((1 - introProgress) * initialSideGap).toFixed(2)}px`,
      );
      section.style.setProperty(
        "--hero-corner-radius",
        `${((1 - introProgress) * 8).toFixed(2)}px`,
      );

      const nextStarted = !reduceMotion && stickyProgress > 0.001;
      if (nextStarted !== lastStarted) {
        lastStarted = nextStarted;
        setStarted(nextStarted);
      }

      if (stageIndex !== lastStage) {
        lastStage = stageIndex;
        setActiveStage(stageIndex);
      }

      barFillRefs.current.forEach((bar, index) => {
        if (!bar) return;
        const fill = index < stageIndex ? 1 : index === stageIndex ? stageProgress : 0;
        bar.style.transform = `scaleX(${fill.toFixed(4)})`;
      });

      targetTimeRef.current = timelineTime;
      seekVideo();
    };

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
    };

    const handleLoadedMetadata = () => {
      seekVideo();
      scheduleUpdate();
    };

    const handleLoadedData = () => {
      setBootReady(true);
      setLoadFailed(false);
      scheduleUpdate();
    };

    const handleSeeked = () => {
      seekVideo();
      scheduleUpdate();
    };

    const handleVideoError = () => setLoadFailed(true);

    setBootReady(false);
    setLoadFailed(false);
    clearVideo();
    measure();
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleVideoError);
    video.src = sourceMode === "mobile" ? HERO_VIDEO.mobileSrc : HERO_VIDEO.desktopSrc;
    video.preload = "auto";
    video.load();

    const resizeObserver = new ResizeObserver(() => {
      measure();
      scheduleUpdate();
    });
    resizeObserver.observe(section);
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      stopWheelAnimation();
      resizeObserver.disconnect();
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleVideoError);
      clearVideo();
    };
  }, [reducedMotion, sourceMode]);

  return (
    <>
      <div
        className={`site-loading-screen${bootReady ? " is-ready" : ""}`}
        role="status"
        aria-live="polite"
        aria-label={loadFailed ? "Не удалось загрузить видео" : "Загрузка сайта"}
      >
        <img src="/media/brand/tekpro-logo-reversed.svg" alt="ТЭКПРО" />
        {loadFailed ? (
          <>
            <p>Не удалось загрузить стартовое видео.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Повторить
            </button>
          </>
        ) : (
          <span className="site-loading-spinner" aria-hidden="true" />
        )}
      </div>

      <section
        ref={sectionRef}
        className="cinematic"
        id="top"
        aria-label="Полный цикл проектирования"
        data-started={started}
        data-ready={bootReady}
        data-reduced-motion={reducedMotion}
        data-lenis-prevent-wheel
      >
        <div className="cinematic-frame">
          <div className="cinematic-media-stack" aria-hidden="true">
            <video
              ref={videoRef}
              className="cinematic-media"
              muted
              playsInline
              preload="auto"
              tabIndex={-1}
            />
          </div>

          <div className="cinematic-shade" aria-hidden="true" />
          <div className="cinematic-bottom-shade" aria-hidden="true" />

          <motion.div className="cinematic-copy" aria-hidden={started || undefined}>
            <p className="hero-kicker">Инжиниринговая компания / ТЭКПРО</p>
            <h1>Полный цикл<br />проектирования<br />месторождений</h1>
            <p className="hero-subtitle">От исходных данных до работающей инфраструктуры</p>
          </motion.div>

          <div className="hero-scroll-indicator" aria-hidden="true">
            <span className="hero-scroll-arrow" />
            <span className="hero-scroll-arrow" />
          </div>

          <div className="hero-stage" aria-hidden={!started || undefined}>
            <div className="hero-stage-meta">
              <span>Полный цикл работ</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong
                key={content.hero.keywords[activeStage]}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {content.hero.keywords[activeStage]}
              </motion.strong>
            </AnimatePresence>
            <div className="hero-stage-progress" aria-hidden="true">
              {content.hero.keywords.map((keyword, index) => (
                <span key={keyword}>
                  <i
                    ref={(node) => {
                      barFillRefs.current[index] = node;
                    }}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
