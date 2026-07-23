"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { content } from "@/data/content";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const STAGE_INTERVAL = 2400;

export function CinematicHero() {
  const [stage, setStage] = useState(0);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      setStage((current) => (current + 1) % content.hero.keywords.length);
    }, STAGE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const activeStage = reducedMotion ? 0 : stage;

  return (
    <section className="cinematic" id="top" aria-label="Полный цикл проектирования">
      <div className="cinematic-frame">
        <video
          className="cinematic-media"
          src="/media/video_loop.mp4"
          muted
          playsInline
          autoPlay={!reducedMotion}
          loop
          preload="auto"
          aria-hidden="true"
        />
        <div className="cinematic-shade" aria-hidden="true" />

        <div className="cinematic-copy">
          <p className="hero-kicker">Инжиниринговая компания / ТЭКПРО</p>
          <h1>Полный цикл<br />проектирования<br />месторождений</h1>
          <p className="hero-subtitle">От исходных данных до работающей инфраструктуры</p>
        </div>

        <div className="hero-stage">
          <div className="hero-stage-meta">
            <span>Полный цикл работ</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong
              key={content.hero.keywords[activeStage]}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.hero.keywords[activeStage]}
            </motion.strong>
          </AnimatePresence>
          <div className="hero-stage-progress" aria-hidden="true">
            {content.hero.keywords.map((keyword, index) => (
              <span
                key={keyword}
                className={
                  index < activeStage
                    ? "is-complete"
                    : index === activeStage
                      ? "is-active"
                      : undefined
                }
              >
                {index === activeStage && (
                  <motion.i
                    key={`${keyword}-progress`}
                    initial={reducedMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: reducedMotion ? 0 : STAGE_INTERVAL / 1000,
                      ease: "linear",
                    }}
                  />
                )}
              </span>
            ))}
          </div>
          <p className="hero-stage-note">От изысканий до сопровождения объекта</p>
        </div>
      </div>
    </section>
  );
}
