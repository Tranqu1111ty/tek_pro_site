import nodemailer, { type Transporter } from "nodemailer";

const MAX_BODY_SIZE = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 5;
const MAX_TRACKED_IPS = 10_000;
const requestsByIp = new Map<string, number[]>();

type ContactRequest = {
  name?: unknown;
  company?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
  consent?: unknown;
  website?: unknown;
};

type ContactField = "name" | "company" | "phone" | "email" | "message" | "consent";
type ContactErrors = Partial<Record<ContactField, string>>;

let transporter: Transporter | null = null;

function json(message: string, status: number, errors?: ContactErrors) {
  return Response.json(
    { message, ...(errors ? { errors } : {}) },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function normalizeText(value: unknown, maxLength: number, multiline = false) {
  if (typeof value !== "string") {
    return { value: "", tooLong: false };
  }

  const normalized = value.normalize("NFKC");
  const sanitized = Array.from(normalized)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      const isBidiControl =
        (codePoint >= 0x202a && codePoint <= 0x202e) ||
        (codePoint >= 0x2066 && codePoint <= 0x2069);
      const isAllowedMultilineWhitespace =
        multiline && (codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d);
      const isControl = (codePoint <= 0x1f || codePoint === 0x7f) && !isAllowedMultilineWhitespace;

      return !isControl && !isBidiControl;
    })
    .join("")
    .trim();

  return {
    value: sanitized.slice(0, maxLength),
    tooLong: sanitized.length > maxLength,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();

  if (requestsByIp.size >= MAX_TRACKED_IPS && !requestsByIp.has(ip)) {
    for (const [trackedIp, timestamps] of requestsByIp) {
      if (!timestamps.some((timestamp) => timestamp > now - RATE_LIMIT_WINDOW_MS)) {
        requestsByIp.delete(trackedIp);
      }
    }

    if (requestsByIp.size >= MAX_TRACKED_IPS) {
      requestsByIp.clear();
    }
  }

  const recentRequests = (requestsByIp.get(ip) || []).filter(
    (timestamp) => timestamp > now - RATE_LIMIT_WINDOW_MS,
  );

  if (recentRequests.length >= RATE_LIMIT_REQUESTS) {
    requestsByIp.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestsByIp.set(ip, recentRequests);
  return false;
}

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || "465");

  if (!host || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    host,
    port,
    secure: true,
    name: "tekpro.ru",
    connectionTimeout: 8_000,
    greetingTimeout: 5_000,
    socketTimeout: 15_000,
    auth: {
      user,
      pass: password,
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  return transporter;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const contentLength = Number(request.headers.get("content-length") || "0");

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json("Ожидается JSON-запрос.", 415);
  }

  if (contentLength > MAX_BODY_SIZE) {
    return json("Размер заявки превышает допустимый.", 413);
  }

  let payload: ContactRequest;

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
      return json("Размер заявки превышает допустимый.", 413);
    }
    const parsedPayload = JSON.parse(rawBody) as unknown;
    if (
      !parsedPayload ||
      typeof parsedPayload !== "object" ||
      Array.isArray(parsedPayload)
    ) {
      return json("Некорректный формат заявки.", 400);
    }
    payload = parsedPayload as ContactRequest;
  } catch {
    return json("Некорректный формат заявки.", 400);
  }

  const website = normalizeText(payload.website, 200).value;
  if (website) {
    return json("Заявка отправлена.", 200);
  }

  const normalizedName = normalizeText(payload.name, 80);
  const normalizedCompany = normalizeText(payload.company, 120);
  const normalizedPhone = normalizeText(payload.phone, 32);
  const normalizedEmail = normalizeText(payload.email, 120);
  const normalizedMessage = normalizeText(payload.message, 3000, true);
  const name = normalizedName.value;
  const company = normalizedCompany.value;
  const phone = normalizedPhone.value;
  const email = normalizedEmail.value.toLowerCase();
  const message = normalizedMessage.value;
  const phoneDigits = phone.replace(/\D/g, "");
  const errors: ContactErrors = {};

  if (name.length < 2 || normalizedName.tooLong) {
    errors.name = "Укажите имя длиной от 2 до 80 символов.";
  }

  if (normalizedCompany.tooLong) {
    errors.company = "Название компании не должно превышать 120 символов.";
  }

  if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    errors.phone = "Введите российский номер из 10 цифр после +7.";
  }

  if (email && (normalizedEmail.tooLong || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    errors.email = "Проверьте адрес электронной почты.";
  }

  if (message.length < 10 || normalizedMessage.tooLong) {
    errors.message = "Опишите проект: от 10 до 3000 символов.";
  }

  if (payload.consent !== "accepted") {
    errors.consent = "Подтвердите согласие на обработку персональных данных.";
  }

  if (Object.keys(errors).length > 0) {
    return json("Проверьте выделенные поля.", 400, errors);
  }

  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return json("Слишком много заявок. Попробуйте снова через 15 минут.", 429);
  }

  const mailer = getTransporter();
  const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const toAddress = process.env.CONTACT_TO_EMAIL || "info@tekpro.ru";

  if (!mailer || !fromAddress || /[\r\n]/.test(fromAddress) || /[\r\n]/.test(toAddress)) {
    console.error("Contact form SMTP settings are incomplete.");
    return json("Форма временно недоступна. Напишите нам на info@tekpro.ru.", 503);
  }

  const safeName = name.replace(/[\r\n]/g, " ");
  const text = [
    `Имя: ${name}`,
    `Компания: ${company || "не указана"}`,
    `Телефон: ${phone}`,
    `Email: ${email || "не указан"}`,
    "",
    "Описание проекта:",
    message,
  ].join("\n");

  const html = `
    <h2>Новая заявка с tekpro.ru</h2>
    <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
    <p><strong>Компания:</strong> ${escapeHtml(company || "не указана")}</p>
    <p><strong>Телефон:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email || "не указан")}</p>
    <h3>Описание проекта</h3>
    <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
  `;

  const sendStartedAt = Date.now();

  try {
    const info = await mailer.sendMail({
      from: {
        name: process.env.SMTP_FROM_NAME || "Сайт ТЭКПРО",
        address: fromAddress,
      },
      to: toAddress,
      replyTo: email || undefined,
      subject: `[tekpro.ru] Новая заявка — ${safeName}`,
      text,
      html,
    });
    console.info("Contact form email sent.", {
      durationMs: Date.now() - sendStartedAt,
      messageId: info.messageId,
    });
  } catch (error) {
    const smtpError = error as {
      code?: string;
      responseCode?: number;
      command?: string;
      message?: string;
    };
    console.error("Failed to send contact form email.", {
      durationMs: Date.now() - sendStartedAt,
      code: smtpError.code,
      responseCode: smtpError.responseCode,
      command: smtpError.command,
      message: smtpError.message,
    });
    return json("Не удалось отправить заявку. Напишите нам на info@tekpro.ru.", 502);
  }

  return json("Заявка отправлена.", 200);
}
