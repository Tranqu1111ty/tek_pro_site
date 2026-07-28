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

let transporter: Transporter | null = null;

function json(message: string, status: number) {
  return Response.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function stringField(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
    host,
    port,
    secure: true,
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
    payload = JSON.parse(rawBody) as ContactRequest;
  } catch {
    return json("Некорректный формат заявки.", 400);
  }

  const website = stringField(payload.website, 200);
  if (website) {
    return json("Заявка отправлена.", 200);
  }

  const name = stringField(payload.name, 80);
  const company = stringField(payload.company, 120);
  const phone = stringField(payload.phone, 32);
  const email = stringField(payload.email, 120).toLowerCase();
  const message = stringField(payload.message, 3000);

  if (name.length < 2 || phone.length < 7 || message.length < 10) {
    return json("Заполните обязательные поля формы.", 400);
  }

  if (!/^[+\d][\d\s()+-]{5,30}\d$/.test(phone)) {
    return json("Проверьте номер телефона.", 400);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json("Проверьте адрес электронной почты.", 400);
  }

  if (payload.consent !== "accepted") {
    return json("Необходимо согласие на обработку персональных данных.", 400);
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

  try {
    await mailer.sendMail({
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
  } catch (error) {
    console.error("Failed to send contact form email.", error);
    return json("Не удалось отправить заявку. Напишите нам на info@tekpro.ru.", 502);
  }

  return json("Заявка отправлена.", 200);
}
