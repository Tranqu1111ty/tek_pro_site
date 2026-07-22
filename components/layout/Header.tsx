"use client";

import { useState } from "react";

const links = [
  ["О компании", "#about"],
  ["Компетенции", "#competencies"],
  ["Лаборатория", "#laboratory"],
  ["IT / ИИ", "#it-ai"],
  ["Контакты", "#contacts"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="ТЭКПРО — на главную">
        <img src="/media/logo6.png" alt="ТЭКПРО" />
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
    </header>
  );
}
