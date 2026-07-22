"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "../../data/content";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const mobile = useMediaQuery("(max-width: 800px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section || mobile || reducedMotion) return;

    const update = () => {
      frameRef.current = null;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const next = Math.min(1, Math.max(0, -rect.top / distance));
      setProgress(next);
      setStage(
        Math.min(
          content.hero.keywords.length - 1,
          Math.floor(next * content.hero.keywords.length),
        ),
      );
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const target = next * Math.max(0, video.duration - 0.06);
        if (Math.abs(video.currentTime - target) > 0.04) video.currentTime = target;
      }
    };

    const onScroll = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    video.addEventListener("loadedmetadata", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video.removeEventListener("loadedmetadata", update);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [mobile, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className={`cinematic-hero${reducedMotion ? " is-reduced" : ""}`}
      style={{ "--hero-progress": progress } as React.CSSProperties}
    >
      <div className="cinematic-sticky">
        <video
          ref={videoRef}
          className="cinematic-video"
          muted
          playsInline
          preload="metadata"
          poster="/media/cinematic-poster.jpg"
          autoPlay={mobile && !reducedMotion}
          loop={mobile && !reducedMotion}
          aria-label="Трансформация лесной территории в подготовленную промышленную площадку"
        >
          <source src="/media/cinematic.mp4" type="video/mp4" />
        </video>
        <div className="cinematic-shade" />
        <div className="hero-blueprint" aria-hidden="true">
          <span className="axis axis-x">X / 01</span>
          <span className="axis axis-y">Y / 01</span>
          <i className="line line-a" />
          <i className="line line-b" />
        </div>
        <div className="hero-copy">
          <p className="utility-label">{content.hero.eyebrow}</p>
          <h1>{content.hero.title}</h1>
          <p className="hero-subtitle">{content.hero.subtitle}</p>
        </div>
        <div className="keyword-track" aria-live="polite">
          <span className="keyword-index">
            {String(stage + 1).padStart(2, "0")} / {String(content.hero.keywords.length).padStart(2, "0")}
          </span>
          <p>{content.hero.keywords[stage]}</p>
        </div>
        <div className="scroll-meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <a className="scroll-cue" href="#about">
          Смотреть структуру проекта <span>↓</span>
        </a>
      </div>
    </section>
  );
}
