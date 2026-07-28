"use client";

import { useRef, useState } from "react";

import { ProjectInquiryModal } from "@/components/contact/ProjectInquiryModal";
import { content } from "@/data/content";

const links = [
  ["Компания", "#about"],
  ["Полный цикл", "#cycle"],
  ["Компетенции", "#competencies"],
  ["IT и ИИ", "#it-ai"],
  ["Контакты", "#contacts"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const openProjectModal = (trigger: HTMLButtonElement) => {
    projectTriggerRef.current = trigger;
    setProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    window.requestAnimationFrame(() => projectTriggerRef.current?.focus());
  };

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ТЭКПРО — на главную">
          <img src="/media/brand/tekpro-logo-compact.svg" alt="ТЭКПРО" />
        </a>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span>{open ? "Закрыть" : "Меню"}</span>
          <i aria-hidden="true" />
        </button>
        <nav
          id="main-navigation"
          className={open ? "site-nav is-open" : "site-nav"}
          aria-label="Основная навигация"
        >
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <button
            className="site-nav-project"
            type="button"
            aria-haspopup="dialog"
            aria-controls="project-inquiry-dialog"
            onClick={(event) => openProjectModal(event.currentTarget)}
          >
            Обсудить проект
          </button>
        </nav>
        <div className="site-header-actions">
          <div className="site-header-contact">
            <a href="tel:+74953320053">{content.contacts.phone}</a>
            <a href={`mailto:${content.contacts.email}`}>{content.contacts.email}</a>
          </div>
          <button
            className="site-header-cta"
            type="button"
            aria-haspopup="dialog"
            aria-controls="project-inquiry-dialog"
            onClick={(event) => openProjectModal(event.currentTarget)}
          >
            Обсудить проект
          </button>
        </div>
      </header>
      {projectModalOpen ? <ProjectInquiryModal onClose={closeProjectModal} /> : null}
    </>
  );
}
