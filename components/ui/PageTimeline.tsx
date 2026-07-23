"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const chapters = [
  { id: "about", label: "Компания" },
  { id: "cycle", label: "Полный цикл" },
  { id: "competencies", label: "Компетенции" },
  { id: "standards", label: "Нормативная база" },
  { id: "it-ai", label: "IT и ИИ" },
  { id: "experience", label: "Практика" },
  { id: "contacts", label: "Контакты" },
] as const;

type TimelineMetrics = {
  heroEnd: number;
  pageEnd: number;
  availableScroll: number;
  chapterScrolls: number[];
};

export function PageTimeline() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const metricsRef = useRef<TimelineMetrics>({
    heroEnd: 0,
    pageEnd: 1,
    availableScroll: 1,
    chapterScrolls: chapters.map(() => 0),
  });
  const [chapterPositions, setChapterPositions] = useState(() => chapters.map(() => 0));
  const [activeChapter, setActiveChapter] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const rawProgress = useMotionValue(0);
  const rawVisibility = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 95,
    damping: 24,
    mass: 0.24,
  });
  const smoothVisibility = useSpring(rawVisibility, {
    stiffness: 180,
    damping: 28,
  });
  const progress = reducedMotion ? rawProgress : smoothProgress;
  const visibility = reducedMotion ? rawVisibility : smoothVisibility;

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const { heroEnd, pageEnd, availableScroll, chapterScrolls } = metricsRef.current;
      const distanceAfterHero = window.scrollY - heroEnd;
      const nextProgress = Math.min(1, Math.max(0, distanceAfterHero / availableScroll));
      const nextActiveChapter = chapterScrolls.reduce(
        (activeIndex, chapterScroll, index) =>
          window.scrollY + 1 >= chapterScroll ? index : activeIndex,
        -1,
      );
      const nextVisibility = distanceAfterHero >= -1;

      rawProgress.set(nextProgress);
      rawVisibility.set(nextVisibility ? 1 : 0);
      setActiveChapter((current) =>
        current === nextActiveChapter ? current : nextActiveChapter,
      );
      setIsVisible((current) => (current === nextVisibility ? current : nextVisibility));
    };

    const measure = () => {
      const hero = document.getElementById("top");
      if (!hero) return;

      const heroEnd = hero.offsetTop + hero.offsetHeight;
      const pageEnd = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        heroEnd + 1,
      );
      const availableScroll = Math.max(pageEnd - heroEnd, 1);
      const chapterScrolls = chapters.map(({ id }) => {
        const section = document.getElementById(id);
        return Math.min(section?.offsetTop ?? heroEnd, pageEnd);
      });
      const nextPositions = chapterScrolls.map((chapterScroll) =>
        Math.min(1, Math.max(0, (chapterScroll - heroEnd) / availableScroll)),
      );

      metricsRef.current = { heroEnd, pageEnd, availableScroll, chapterScrolls };
      setChapterPositions((current) =>
        current.every((position, index) => Math.abs(position - nextPositions[index]) < 0.0001)
          ? current
          : nextPositions,
      );
      update();
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.body);
    chapters.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) resizeObserver.observe(section);
    });

    measure();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [rawProgress, rawVisibility]);

  return (
    <motion.nav
      className="page-timeline"
      style={{ opacity: visibility }}
      data-visible={isVisible}
      aria-label="Навигация по разделам страницы"
    >
      <span className="page-timeline-track" />
      <motion.span className="page-timeline-fill" style={{ scaleY: progress }} />
      {chapters.map((chapter, index) => {
        const isPassed = index <= activeChapter;
        const isCurrent = index === activeChapter;

        return (
          <a
            key={chapter.id}
            className={`page-timeline-checkpoint${isPassed ? " is-passed" : ""}${isCurrent ? " is-current" : ""}`}
            href={`#${chapter.id}`}
            style={{ top: `${chapterPositions[index] * 100}%` }}
            aria-label={`Перейти к разделу «${chapter.label}»`}
            aria-current={isCurrent ? "location" : undefined}
            tabIndex={isVisible ? 0 : -1}
          >
            <span>{chapter.label}</span>
            <i aria-hidden="true" />
          </a>
        );
      })}
    </motion.nav>
  );
}
