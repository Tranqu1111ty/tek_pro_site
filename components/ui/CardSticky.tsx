"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface CardStickyProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  incrementY?: number;
  incrementZ?: number;
}

function useSequenceEndAlignment() {
  const stackRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const stack = stackRef.current;
    const sequence = stack?.closest<HTMLElement>(".split-sequence");
    const section = stack?.closest<HTMLElement>("section");
    const copy = sequence?.querySelector<HTMLElement>(".sequence-copy");
    const lastCard = stack?.lastElementChild as HTMLElement | null;

    if (!stack || !section || !copy || !lastCard) return;

    let frame = 0;
    const alignEndFrame = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const copyStyle = window.getComputedStyle(copy);
        const copyTop = Number.parseFloat(copyStyle.top);

        if (copyStyle.position !== "sticky" || !Number.isFinite(copyTop)) {
          stack.style.removeProperty("--stack-end-space");
          stack.style.removeProperty("--stack-top");
          copy.style.removeProperty("--copy-end-space");
          return;
        }

        const sectionPaddingBottom = Number.parseFloat(
          window.getComputedStyle(section).paddingBottom,
        );
        const copyHeight = copy.getBoundingClientRect().height;
        const cardHeight = lastCard.getBoundingClientRect().height;
        const copyCenter = copyTop + copyHeight / 2;
        const stackBottomAtSectionEnd =
          window.innerHeight - sectionPaddingBottom;
        const endSpace = Math.max(
          0,
          stackBottomAtSectionEnd - copyCenter - cardHeight / 2,
        );
        const copyEndSpace = Math.max(
          0,
          stackBottomAtSectionEnd - copyTop - copyHeight,
        );

        stack.style.setProperty(
          "--stack-top",
          `${(copyCenter - cardHeight / 2).toFixed(2)}px`,
        );
        stack.style.setProperty("--stack-end-space", `${endSpace.toFixed(2)}px`);
        copy.style.setProperty(
          "--copy-end-space",
          `${copyEndSpace.toFixed(2)}px`,
        );
      });
    };

    const resizeObserver = new ResizeObserver(alignEndFrame);
    resizeObserver.observe(copy);
    resizeObserver.observe(lastCard);
    window.addEventListener("resize", alignEndFrame, { passive: true });
    alignEndFrame();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", alignEndFrame);
    };
  }, []);

  return stackRef;
}

const ContainerScroll = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative w-full", className)}
      style={props.style}
      {...props}
    >
      {children}
    </div>
  );
});
ContainerScroll.displayName = "ContainerScroll";

const CardSticky = React.forwardRef<HTMLDivElement, CardStickyProps>(
  (
    {
      index,
      incrementY = 10,
      incrementZ = 10,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const y = index * incrementY;
    const zIndex = (index + 1) * incrementZ;

    return (
      <div
        ref={ref}
        style={{
          top: `calc(var(--stack-top, 104px) + ${y}px)`,
          zIndex,
          ...style,
        }}
        className={cn("sticky", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardSticky.displayName = "CardSticky";

export { ContainerScroll, CardSticky, useSequenceEndAlignment };
