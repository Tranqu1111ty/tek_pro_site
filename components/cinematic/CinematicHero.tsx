"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { content } from "@/data/content";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type HeroScene = {
  desktopSrc: string;
  mobileSrc: string;
  duration: number;
};

type SourceMode = "desktop" | "mobile";

const HERO_SCENES: readonly HeroScene[] = [
  {
    desktopSrc: "/media/hero/scene-1-desktop-v1.mp4",
    mobileSrc: "/media/hero/scene-1-mobile-v1.mp4",
    duration: 8.041667,
  },
  {
    desktopSrc: "/media/hero/scene-2-desktop-v1.mp4",
    mobileSrc: "/media/hero/scene-2-mobile-v1.mp4",
    duration: 6.041667,
  },
  {
    desktopSrc: "/media/hero/scene-3-desktop-v2.mp4",
    mobileSrc: "/media/hero/scene-3-mobile-v2.mp4",
    duration: 2,
  },
] as const;

const TOTAL_DURATION = HERO_SCENES.reduce((total, scene) => total + scene.duration, 0);
const FIRST_SCENE_FAST_STAGES_END = 5.5;
const SECOND_SCENE_BUILD_STAGE_END = 3;
const STAGE_END_TIMES = [
  FIRST_SCENE_FAST_STAGES_END / 3,
  (FIRST_SCENE_FAST_STAGES_END / 3) * 2,
  FIRST_SCENE_FAST_STAGES_END,
  HERO_SCENES[0].duration + SECOND_SCENE_BUILD_STAGE_END,
  HERO_SCENES[0].duration + HERO_SCENES[1].duration,
  TOTAL_DURATION,
] as const;
const INTRO_REVEAL_PORTION = 0.05;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function locateScene(progress: number) {
  const timelineTime = progress * TOTAL_DURATION;
  let elapsed = 0;

  for (let index = 0; index < HERO_SCENES.length; index += 1) {
    const scene = HERO_SCENES[index];
    const sceneEnd = elapsed + scene.duration;

    if (timelineTime < sceneEnd || index === HERO_SCENES.length - 1) {
      return {
        index,
        localTime: clamp(timelineTime - elapsed, 0, scene.duration),
      };
    }

    elapsed = sceneEnd;
  }

  return { index: HERO_SCENES.length - 1, localTime: HERO_SCENES.at(-1)!.duration };
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
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const barFillRefs = useRef<Array<HTMLElement | null>>([]);
  const slotScenesRef = useRef<Array<number | null>>([null, null]);
  const targetTimesRef = useRef([0, 0]);
  const activeSlotRef = useRef<number | null>(null);
  const readySlotsRef = useRef([false, false]);
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
    if (!section || !sourceMode) return;
    const videos = videoRefs.current.slice();
    const reduceMotion =
      reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrame = 0;
    let sectionStart = 0;
    let sectionEnd = 1;
    let lastStarted = false;
    let lastStage = -1;
    let cacheWarmingStarted = false;
    const cacheAbortController = new AbortController();

    const clearVideos = () => {
      videos.forEach((video) => {
        if (!video) return;
        video.pause();
        video.style.opacity = "0";
        video.removeAttribute("src");
        video.removeAttribute("data-scene");
        video.load();
      });
      slotScenesRef.current = [null, null];
      targetTimesRef.current = [0, 0];
      readySlotsRef.current = [false, false];
      activeSlotRef.current = null;
    };

    const measure = () => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      sectionStart = Math.max(0, sectionTop - headerHeight);
      sectionEnd = Math.max(
        sectionStart + 1,
        sectionTop + section.offsetHeight - window.innerHeight,
      );
    };

    const showOnlySlot = (slotIndex: number) => {
      if (activeSlotRef.current === slotIndex) return;
      videos.forEach((video, index) => {
        if (video) video.style.opacity = index === slotIndex ? "1" : "0";
      });
      activeSlotRef.current = slotIndex;
    };

    const assignSceneToSlot = (sceneIndex: number) => {
      const assignedSlot = slotScenesRef.current.indexOf(sceneIndex);
      if (assignedSlot >= 0) return assignedSlot;

      const slotIndex =
        activeSlotRef.current === null ? 0 : activeSlotRef.current === 0 ? 1 : 0;
      const video = videos[slotIndex];
      if (!video) return slotIndex;

      const scene = HERO_SCENES[sceneIndex];
      slotScenesRef.current[slotIndex] = sceneIndex;
      readySlotsRef.current[slotIndex] = false;
      targetTimesRef.current[slotIndex] = 0;
      video.style.opacity = "0";
      video.dataset.scene = String(sceneIndex);
      video.src = sourceMode === "mobile" ? scene.mobileSrc : scene.desktopSrc;
      video.preload = "auto";
      video.load();
      return slotIndex;
    };

    const warmRemainingVideoCache = async () => {
      if (cacheWarmingStarted) return;
      cacheWarmingStarted = true;

      for (const scene of HERO_SCENES.slice(1)) {
        const src = sourceMode === "mobile" ? scene.mobileSrc : scene.desktopSrc;
        try {
          await fetch(src, {
            cache: "force-cache",
            signal: cacheAbortController.signal,
          });
        } catch {
          if (cacheAbortController.signal.aborted) return;
        }
      }
    };

    const seekSlot = (slotIndex: number) => {
      const video = videos[slotIndex];
      if (!video || video.readyState < 1 || video.seeking) return;

      const targetTime = targetTimesRef.current[slotIndex];
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
      const progress = reduceMotion
        ? 0
        : clamp((window.scrollY - sectionStart) / (sectionEnd - sectionStart));
      const introProgress = reduceMotion ? 0 : clamp(progress / INTRO_REVEAL_PORTION);
      const timelineTime = progress * TOTAL_DURATION;
      const { index: sceneIndex, localTime } = locateScene(progress);
      const scene = HERO_SCENES[sceneIndex];
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

      const nextStarted = !reduceMotion && progress > 0.001;
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

      const targetSlot = assignSceneToSlot(sceneIndex);
      targetTimesRef.current[targetSlot] = localTime;
      seekSlot(targetSlot);

      const targetVideo = videos[targetSlot];
      if (
        targetVideo &&
        readySlotsRef.current[targetSlot] &&
        !targetVideo.seeking &&
        Math.abs(targetVideo.currentTime - targetTimesRef.current[targetSlot]) <= 0.08
      ) {
        showOnlySlot(targetSlot);
      }

      const visibleScene =
        activeSlotRef.current === null
          ? null
          : slotScenesRef.current[activeSlotRef.current];
      if (visibleScene === sceneIndex) {
        const scenePortion = localTime / scene.duration;
        if (scenePortion >= 0.35 && sceneIndex < HERO_SCENES.length - 1) {
          assignSceneToSlot(sceneIndex + 1);
        } else if (scenePortion <= 0.35 && sceneIndex > 0) {
          assignSceneToSlot(sceneIndex - 1);
        }
      }
    };

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
    };

    const handleLoadedMetadata = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      const slotIndex = videos.indexOf(video);
      if (slotIndex < 0) return;
      seekSlot(slotIndex);
      scheduleUpdate();
    };

    const handleLoadedData = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      const slotIndex = videos.indexOf(video);
      const sceneIndex = Number(video.dataset.scene);
      if (slotIndex < 0 || !Number.isInteger(sceneIndex)) return;

      readySlotsRef.current[slotIndex] = true;
      if (sceneIndex === 0) {
        setBootReady(true);
        setLoadFailed(false);
        void warmRemainingVideoCache();
      }
      scheduleUpdate();
    };

    const handleSeeked = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      const slotIndex = videos.indexOf(video);
      if (slotIndex < 0) return;
      seekSlot(slotIndex);
      scheduleUpdate();
    };

    const handleVideoError = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (video.dataset.scene === "0") setLoadFailed(true);
    };

    setBootReady(false);
    setLoadFailed(false);
    clearVideos();
    measure();
    videos.forEach((video) => {
      video?.addEventListener("loadedmetadata", handleLoadedMetadata);
      video?.addEventListener("loadeddata", handleLoadedData);
      video?.addEventListener("seeked", handleSeeked);
      video?.addEventListener("error", handleVideoError);
    });
    assignSceneToSlot(0);

    const resizeObserver = new ResizeObserver(() => {
      measure();
      scheduleUpdate();
    });
    resizeObserver.observe(section);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      cacheAbortController.abort();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      videos.forEach((video) => {
        video?.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video?.removeEventListener("loadeddata", handleLoadedData);
        video?.removeEventListener("seeked", handleSeeked);
        video?.removeEventListener("error", handleVideoError);
      });
      clearVideos();
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
      >
        <div className="cinematic-frame">
          <div className="cinematic-media-stack" aria-hidden="true">
            {[0, 1].map((slotIndex) => (
              <video
                key={slotIndex}
                ref={(node) => {
                  videoRefs.current[slotIndex] = node;
                }}
                className="cinematic-media"
                muted
                playsInline
                preload="auto"
                tabIndex={-1}
              />
            ))}
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
