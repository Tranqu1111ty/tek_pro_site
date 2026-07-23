"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface AccordionProps {
  summary: string;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ summary, children, className }: AccordionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = React.useId();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn("accordion", isOpen && "is-open", className)}>
      <button
        type="button"
        className="accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{summary}</span>
        <i className="accordion-chevron" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            className="accordion-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: shouldReduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" },
            }}
          >
            <div className="accordion-content">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
