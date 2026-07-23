"use client";

import { useState } from "react";

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

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="ТЭКПРО — на главную">
        <span>ТЭКПРО</span>
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
      </nav>
      <div className="site-header-actions">
        <div className="site-header-contact">
          <a href="tel:+74953320053">{content.contacts.phone}</a>
          <a href={`mailto:${content.contacts.email}`}>{content.contacts.email}</a>
        </div>
        <a className="site-header-cta" href="#contacts">Обсудить проект</a>
      </div>
    </header>
  );
}
