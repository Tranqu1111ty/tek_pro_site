"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ProjectInquiryModalProps = {
  onClose: () => void;
};

type SubmissionState = "idle" | "submitting" | "success" | "error";
type FieldName = "name" | "company" | "phone" | "email" | "message" | "consent";
type FieldErrors = Partial<Record<FieldName, string>>;

type ContactResponse = {
  message?: string;
  errors?: FieldErrors;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasUnsafeCharacters(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    const isBidiControl =
      (codePoint >= 0x202a && codePoint <= 0x202e) ||
      (codePoint >= 0x2066 && codePoint <= 0x2069);
    const isDisallowedControl =
      (codePoint <= 0x08) ||
      codePoint === 0x0b ||
      codePoint === 0x0c ||
      (codePoint >= 0x0e && codePoint <= 0x1f) ||
      codePoint === 0x7f;

    return isBidiControl || isDisallowedControl;
  });
}

function getRussianPhoneDigits(input: string) {
  let digits = input.replace(/\D/g, "");

  if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

function formatRussianPhone(input: string) {
  const digits = getRussianPhoneDigits(input);

  if (!digits) return "";

  let result = `(${digits.slice(0, 3)}`;
  if (digits.length >= 3) result += ")";
  if (digits.length > 3) result += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) result += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) result += `-${digits.slice(8, 10)}`;

  return result;
}

function validateFields(formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const name = String(formData.get("name") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const phone = String(formData.get("phone") || "");
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const phoneDigits = phone.replace(/\D/g, "");

  if (name.length < 2 || name.length > 80 || hasUnsafeCharacters(name)) {
    errors.name = "Укажите имя длиной от 2 до 80 символов.";
  }

  if (company.length < 2 || company.length > 120 || hasUnsafeCharacters(company)) {
    errors.company = "Укажите название компании длиной от 2 до 120 символов.";
  }

  if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    errors.phone = "Введите российский номер из 10 цифр после +7.";
  }

  if (!email || email.length > 120 || !emailPattern.test(email)) {
    errors.email = "Проверьте адрес электронной почты.";
  }

  if (message.length < 10 || message.length > 3000 || hasUnsafeCharacters(message)) {
    errors.message = "Опишите проект: от 10 до 3000 символов.";
  }

  if (formData.get("consent") !== "accepted") {
    errors.consent = "Подтвердите согласие на обработку персональных данных.";
  }

  return errors;
}

export function ProjectInquiryModal({ onClose }: ProjectInquiryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [shakeCycle, setShakeCycle] = useState(0);
  const [phone, setPhone] = useState("");

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

  const clearFieldError = (field: FieldName) => {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    clearFieldError(event.currentTarget.name as FieldName);
    setErrorMessage("");
    if (submissionState === "error") setSubmissionState("idle");
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const previousDigits = getRussianPhoneDigits(phone);
    let nextDigits = getRussianPhoneDigits(input.value);
    const inputType = (event.nativeEvent as InputEvent).inputType;
    const isDeletion =
      inputType === "deleteContentBackward" ||
      inputType === "deleteContentForward";

    if (
      isDeletion &&
      nextDigits === previousDigits &&
      previousDigits.length > 0
    ) {
      const caretPosition = input.selectionStart ?? input.value.length;
      const digitsBeforeCaret = input.value
        .slice(0, caretPosition)
        .replace(/\D/g, "").length;
      const digitIndex =
        inputType === "deleteContentBackward"
          ? Math.max(0, digitsBeforeCaret - 1)
          : Math.min(previousDigits.length - 1, digitsBeforeCaret);

      nextDigits =
        previousDigits.slice(0, digitIndex) +
        previousDigits.slice(digitIndex + 1);
    }

    setPhone(formatRussianPhone(nextDigits));
    handleFieldChange(event);
  };

  const focusFirstInvalidField = (errors: FieldErrors) => {
    const firstField = (Object.keys(errors) as FieldName[])[0];
    if (!firstField) return;

    window.requestAnimationFrame(() => {
      const field = formRef.current?.elements.namedItem(firstField);
      if (field instanceof HTMLElement) field.focus();
    });
  };

  const showFieldErrors = (errors: FieldErrors) => {
    setFieldErrors(errors);
    setShakeCycle((cycle) => cycle + 1);
    setSubmissionState("idle");
    focusFirstInvalidField(errors);
  };

  const fieldClassName = (field: FieldName, baseClass: string) => {
    if (!fieldErrors[field]) return baseClass;
    return `${baseClass} is-invalid shake-${shakeCycle % 2 === 0 ? "a" : "b"}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("phone", phone ? `+7 ${phone}` : "+7");
    const validationErrors = validateFields(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage("");
      showFieldErrors(validationErrors);
      return;
    }

    setSubmissionState("submitting");
    setFieldErrors({});
    setErrorMessage("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        signal: controller.signal,
      });
      const result = (await response.json().catch(() => null)) as ContactResponse | null;

      if (!response.ok && result?.errors && Object.keys(result.errors).length > 0) {
        showFieldErrors(result.errors);
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Не удалось отправить заявку. Попробуйте ещё раз.");
      }

      form.reset();
      setPhone("");
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
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        id="project-inquiry-dialog"
        className={
          submissionState === "success" ? "project-modal is-success" : "project-modal"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-inquiry-title"
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
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
              <h2 id="project-inquiry-title">Расскажите о вашей задаче</h2>
              <p>Оставьте контакты и краткое описание — мы свяжемся с вами для обсуждения.</p>
            </header>

            <form ref={formRef} className="project-form" noValidate onSubmit={handleSubmit}>
              <label className={fieldClassName("name", "project-form-field")}>
                <span className="project-form-label">Ваше имя *</span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "project-name-error" : undefined}
                  onChange={handleFieldChange}
                />
                {fieldErrors.name ? (
                  <span id="project-name-error" className="project-field-error-sr">
                    {fieldErrors.name}
                  </span>
                ) : null}
              </label>

              <label className={fieldClassName("company", "project-form-field")}>
                <span className="project-form-label">Компания *</span>
                <input
                  name="company"
                  type="text"
                  autoComplete="organization"
                  required
                  minLength={2}
                  maxLength={120}
                  aria-invalid={Boolean(fieldErrors.company)}
                  aria-describedby={fieldErrors.company ? "project-company-error" : undefined}
                  onChange={handleFieldChange}
                />
                {fieldErrors.company ? (
                  <span id="project-company-error" className="project-field-error-sr">
                    {fieldErrors.company}
                  </span>
                ) : null}
              </label>

              <label className={fieldClassName("phone", "project-form-field")}>
                <span className="project-form-label">Телефон *</span>
                <div className={phone ? "project-phone-control has-value" : "project-phone-control"}>
                  <span className="project-phone-prefix" aria-hidden="true">
                    +7
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={15}
                    value={phone}
                    aria-label="Телефон после +7"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? "project-phone-error" : undefined}
                    onChange={handlePhoneChange}
                  />
                </div>
                {fieldErrors.phone ? (
                  <span id="project-phone-error" className="project-field-error-sr">
                    {fieldErrors.phone}
                  </span>
                ) : null}
              </label>

              <label className={fieldClassName("email", "project-form-field")}>
                <span className="project-form-label">Email *</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={120}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "project-email-error" : undefined}
                  onChange={handleFieldChange}
                />
                {fieldErrors.email ? (
                  <span id="project-email-error" className="project-field-error-sr">
                    {fieldErrors.email}
                  </span>
                ) : null}
              </label>

              <label
                className={fieldClassName(
                  "message",
                  "project-form-field project-form-field-wide",
                )}
              >
                <span className="project-form-label">Кратко о проекте *</span>
                <textarea
                  name="message"
                  rows={4}
                  minLength={10}
                  maxLength={3000}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={fieldErrors.message ? "project-message-error" : undefined}
                  onChange={handleFieldChange}
                />
                {fieldErrors.message ? (
                  <span id="project-message-error" className="project-field-error-sr">
                    {fieldErrors.message}
                  </span>
                ) : null}
              </label>

              <label className="project-form-honeypot" aria-hidden="true">
                <span>Сайт</span>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>

              <label
                className={fieldClassName(
                  "consent",
                  "project-form-consent project-form-field-wide",
                )}
              >
                <input
                  name="consent"
                  type="checkbox"
                  value="accepted"
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "project-consent-error" : undefined}
                  onChange={handleFieldChange}
                />
                <span>
                  Я согласен на обработку персональных данных в соответствии с{" "}
                  <a href="/documents/ptekpropd.pdf" target="_blank" rel="noreferrer">
                    политикой конфиденциальности
                  </a>
                  .
                </span>
                {fieldErrors.consent ? (
                  <span id="project-consent-error" className="project-field-error-sr">
                    {fieldErrors.consent}
                  </span>
                ) : null}
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
