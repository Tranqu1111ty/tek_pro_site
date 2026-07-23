"use client";

import { ReactLenis } from "lenis/react";

export type DigitalCapability = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  lane: "left" | "center" | "right";
};

type StickyScrollGalleryProps = {
  intro: string;
  items: readonly DigitalCapability[];
};

function CapabilityCard({ item, featured = false }: { item: DigitalCapability; featured?: boolean }) {
  return (
    <article className={`digital-card${featured ? " digital-card-featured" : ""}`}>
      <img src={item.image} alt={item.alt} width="1536" height="1024" loading="lazy" />
      <div className="digital-card-shade" aria-hidden="true" />
      <div className="digital-card-copy">
        <span>{item.eyebrow}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

export function StickyScrollGallery({ intro, items }: StickyScrollGalleryProps) {
  const left = items.filter((item) => item.lane === "left");
  const center = items.filter((item) => item.lane === "center");
  const right = items.filter((item) => item.lane === "right");

  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
      <div className="digital-experience">
        <header className="digital-intro">
          <div>
            <h2>
              Промышленные процессы.
              <br />
              Цифровой контур.
            </h2>
          </div>
          <div className="digital-intro-copy">
            <p>{intro}</p>
            <span>10 направлений разработки и интеграции</span>
          </div>
        </header>

        <div className="digital-gallery" aria-label="Направления разработки IT- и ИИ-систем">
          <div className="digital-gallery-lane">
            {left.map((item) => <CapabilityCard key={item.title} item={item} />)}
          </div>

          <div className="digital-gallery-center">
            <div className="digital-gallery-center-sticky">
              {center.map((item) => <CapabilityCard key={item.title} item={item} featured />)}
            </div>
          </div>

          <div className="digital-gallery-lane">
            {right.map((item) => <CapabilityCard key={item.title} item={item} />)}
          </div>
        </div>

        <div className="digital-gallery-mobile" aria-label="Направления разработки IT- и ИИ-систем">
          {items.map((item) => <CapabilityCard key={item.title} item={item} />)}
        </div>
      </div>
    </ReactLenis>
  );
}
