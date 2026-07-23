"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function PageTimeline() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
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
  const markerTop = useTransform(progress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const hero = document.getElementById("top");
      if (!hero) return;

      const heroEnd = hero.offsetTop + hero.offsetHeight;
      const pageEnd = document.documentElement.scrollHeight - window.innerHeight;
      const availableScroll = Math.max(pageEnd - heroEnd, 1);
      const distanceAfterHero = window.scrollY - heroEnd;
      const nextProgress = Math.min(1, Math.max(0, distanceAfterHero / availableScroll));

      rawProgress.set(nextProgress);
      rawVisibility.set(distanceAfterHero >= -1 ? 1 : 0);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [rawProgress, rawVisibility]);

  return (
    <motion.div className="page-timeline" style={{ opacity: visibility }} aria-hidden="true">
      <span className="page-timeline-track" />
      <motion.span className="page-timeline-fill" style={{ scaleY: progress }} />
      <motion.i className="page-timeline-marker" style={{ top: markerTop }} />
    </motion.div>
  );
}
