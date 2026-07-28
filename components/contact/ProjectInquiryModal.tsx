"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type ProjectInquiryModalProps = {
  onClose: () => void;
};

type SubmissionState = "idle" | "submitting" | "success" | "error";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ProjectInquiryModal({ onClose }: ProjectInquiryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      abortControllerRef.current?.abort();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        signal: controller.signal,
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.message || "Не удалось отправить заявку. Попробуйте ещё раз.");
      }

      form.reset();
      setSubmissionState("success");
    } catch (error) {
      if (controller.signal.aborted) return;
      setSubmissionState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div
      className="project-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        id="project-inquiry-dialog"
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-inquiry-title"
        onKeyDown={handleKeyDown}
      >
        <button
          className="project-modal-close"
          type="button"
          aria-label="Закрыть форму"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        {submissionState === "success" ? (
          <div className="project-modal-success" role="status">
            <span>Заявка отправлена</span>
            <h2 id="project-inquiry-title">Спасибо за обращение</h2>
            <p>Мы получили информацию о проекте и свяжемся с вами в ближайшее рабочее время.</p>
            <button className="project-form-submit" type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <header className="project-modal-heading">
              <span>Новый проект</span>
              <h2 id="project-inquiry-title">Расскажите о вашей задаче</h2>
              <p>Оставьте контакты и краткое описание — мы свяжемся с вами для обсуждения.</p>
            </header>

            <form className="project-form" onSubmit={handleSubmit}>
              <label className="project-form-field">
                <span>Ваше имя *</span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>

              <label className="project-form-field">
                <span>Компания</span>
                <input
                  name="company"
                  type="text"
                  autoComplete="organization"
                  maxLength={120}
                />
              </label>

              <label className="project-form-field">
                <span>Телефон *</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  minLength={7}
                  maxLength={32}
                  required
                />
              </label>

              <label className="project-form-field">
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" maxLength={120} />
              </label>

              <label className="project-form-field project-form-field-wide">
                <span>Кратко о проекте *</span>
                <textarea name="message" rows={4} minLength={10} maxLength={3000} required />
              </label>

              <label className="project-form-honeypot" aria-hidden="true">
                <span>Сайт</span>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>

              <label className="project-form-consent project-form-field-wide">
                <input name="consent" type="checkbox" value="accepted" required />
                <span>
                  Я согласен на обработку персональных данных в соответствии с{" "}
                  <a href="/documents/ptekpropd.pdf" target="_blank" rel="noreferrer">
                    политикой конфиденциальности
                  </a>
                  .
                </span>
              </label>

              <div className="project-form-actions project-form-field-wide">
                <p
                  className={
                    submissionState === "error"
                      ? "project-form-feedback is-error"
                      : "project-form-feedback"
                  }
                  role="status"
                  aria-live="polite"
                >
                  {errorMessage}
                </p>
                <button
                  className="project-form-submit"
                  type="submit"
                  disabled={submissionState === "submitting"}
                >
                  {submissionState === "submitting" ? "Отправляем…" : "Отправить заявку"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
