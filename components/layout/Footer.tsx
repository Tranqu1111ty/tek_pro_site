"use client";

import { useRef, useState } from "react";

import { ProjectInquiryModal } from "@/components/contact/ProjectInquiryModal";
import { content } from "@/data/content";
import DynamicWaveCanvasBackground from "../ui/dynamic-wave-canvas-background";

export function Footer() {
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    window.requestAnimationFrame(() => projectTriggerRef.current?.focus());
  };

  return (
    <>
      <footer className="site-footer" id="contacts">
        <DynamicWaveCanvasBackground />
        <div className="footer-grid">
          <div className="footer-heading">
            <img src="/media/brand/tekpro-logo-reversed.svg" alt="ТЭКПРО" />
            <a className="footer-back-to-top" href="#top" aria-label="Наверх">
              <img src="/media/back-to-top.svg" alt="" aria-hidden="true" />
            </a>
          </div>

          <div className="footer-desktop-content">
            <div className="footer-contact-line">
              <div className="footer-cta-copy">
                <p className="footer-eyebrow">Связаться с ТЭКПРО</p>
                <h2>Обсудим ваш проект</h2>
                <p className="footer-cta-note">
                  Расскажите о задаче — подключим профильных специалистов и предложим следующий шаг.
                </p>
              </div>
              <a className="contact-primary" href={`mailto:${content.contacts.email}`}>
                <span>{content.contacts.email}</span>
                <i aria-hidden="true">↗</i>
              </a>
            </div>
            <div className="contact-register">
              <div className="contact-register-address">
                <span>Адрес</span>
                <p>{content.contacts.address}</p>
              </div>
              <div className="contact-register-phone">
                <span>Телефон</span>
                <a href="tel:+74953320053">{content.contacts.phone}</a>
              </div>
              <div className="contact-register-fax">
                <span>Факс</span>
                <p>{content.contacts.fax}</p>
              </div>
              <div className="contact-register-coordinates">
                <span>Координаты</span>
                <p>{content.contacts.navigation}</p>
              </div>
            </div>
            <FooterLegal />
          </div>

          <div className="footer-mobile-content">
            <div className="footer-mobile-intro">
              <h2>Есть задача?</h2>
              <p>Обсудим проект и предложим оптимальное решение.</p>
              <button
                ref={projectTriggerRef}
                className="footer-project-button"
                type="button"
                aria-haspopup="dialog"
                aria-controls="project-inquiry-dialog"
                onClick={() => setProjectModalOpen(true)}
              >
                <span>Обсудить проект</span>
                <i aria-hidden="true">›</i>
              </button>
            </div>

            <a className="footer-email-link" href={`mailto:${content.contacts.email}`}>
              <FooterIcon type="email" />
              <span>{content.contacts.email}</span>
            </a>

            <div className="footer-contact-card">
              <div>
                <FooterIcon type="phone" />
                <span>Телефон</span>
                <a href="tel:+74953320053">+7 (495) 332-00-53</a>
              </div>
              <div>
                <FooterIcon type="location" />
                <span>Москва</span>
                <p>ул. Наметкина, д.14, к.2</p>
              </div>
            </div>

            <div className="footer-mobile-legal">
              <p className="footer-requisites-title">Реквизиты</p>
              <dl>
                <div>
                  <dt>ИНН</dt>
                  <dd>{content.legal.inn}</dd>
                </div>
                <div>
                  <dt>КПП</dt>
                  <dd>{content.legal.kpp}</dd>
                </div>
                <div>
                  <dt>ОГРН</dt>
                  <dd>{content.legal.ogrn}</dd>
                </div>
                <div>
                  <dt>ОКВЭД</dt>
                  <dd>{content.legal.okved}</dd>
                </div>
              </dl>
            </div>

            <nav className="footer-mobile-policies" aria-label="Правовая информация">
              <a href="/documents/ptekpropd.pdf" target="_blank" rel="noreferrer">
                <span>Политика конфиденциальности</span>
                <i aria-hidden="true">›</i>
              </a>
              <a href="/cookie-policy">
                <span>Политика cookie</span>
                <i aria-hidden="true">›</i>
              </a>
            </nav>

            <p className="footer-mobile-copyright">© ТЭКПРО</p>
          </div>
        </div>
      </footer>
      {projectModalOpen ? <ProjectInquiryModal onClose={closeProjectModal} /> : null}
    </>
  );
}

function FooterLegal() {
  return (
    <div className="footer-bottom">
      <p className="footer-copyright">© ТЭКПРО</p>
      <dl className="footer-legal-strip" aria-label="Реквизиты компании">
        <div>
          <dt>ИНН</dt>
          <dd>{content.legal.inn}</dd>
        </div>
        <div>
          <dt>КПП</dt>
          <dd>{content.legal.kpp}</dd>
        </div>
        <div>
          <dt>ОГРН</dt>
          <dd>{content.legal.ogrn}</dd>
        </div>
        <div>
          <dt>ОКВЭД</dt>
          <dd>{content.legal.okved}</dd>
        </div>
      </dl>
      <nav className="footer-policy-links" aria-label="Правовая информация">
        <a href="/documents/ptekpropd.pdf" target="_blank" rel="noreferrer">
          Политика конфиденциальности
        </a>
        <a href="/cookie-policy">Политика cookie</a>
      </nav>
    </div>
  );
}

function FooterIcon({ type }: { type: "email" | "phone" | "location" }) {
  if (type === "email") {
    return (
      <svg viewBox="0 0 32 24" aria-hidden="true">
        <path d="M2 2h28v20H2zM3 3l13 11L29 3" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 3l6 7-4 4c3 5 5 7 9 9l4-4 7 6-3 4c-2 3-7 2-12-1C8 24 3 18 2 11 1 7 3 4 8 3z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 38" aria-hidden="true">
      <path d="M16 36S3 24 3 15a13 13 0 1126 0c0 9-13 21-13 21z" />
      <circle cx="16" cy="15" r="4" />
    </svg>
  );
}
