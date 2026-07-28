import nodemailer, {
  type SendMailOptions,
  type Transporter,
} from "nodemailer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_BODY_SIZE = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 5;
const MAX_TRACKED_IPS = 10_000;
const MAX_PENDING_EMAILS = 100;
const BACKGROUND_EMAIL_ATTEMPTS = 3;
const BACKGROUND_EMAIL_RETRY_MS = 2_000;
const requestsByIp = new Map<string, number[]>();
let pendingEmailCount = 0;
let transporter: Transporter | null = null;
let emailLogoContentPromise: Promise<Buffer> | null = null;

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

function getEmailLogoContent() {
  emailLogoContentPromise ??= readFile(
    join(process.cwd(), "public", "media", "brand", "tekpro-logo-email.png"),
  );
  return emailLogoContentPromise;
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

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function sendEmailInBackground(mailer: Transporter, options: SendMailOptions) {
  if (pendingEmailCount >= MAX_PENDING_EMAILS) return false;
  pendingEmailCount += 1;

  void (async () => {
    try {
      for (let attempt = 1; attempt <= BACKGROUND_EMAIL_ATTEMPTS; attempt += 1) {
        const sendStartedAt = Date.now();

        try {
          const info = await mailer.sendMail(options);
          console.info("Contact form email sent.", {
            attempt,
            durationMs: Date.now() - sendStartedAt,
            messageId: info.messageId,
          });
          return;
        } catch (error) {
          const smtpError = error as {
            code?: string;
            responseCode?: number;
            command?: string;
            message?: string;
          };
          console.error("Contact form email attempt failed.", {
            attempt,
            durationMs: Date.now() - sendStartedAt,
            code: smtpError.code,
            responseCode: smtpError.responseCode,
            command: smtpError.command,
            message: smtpError.message,
          });

          if (attempt < BACKGROUND_EMAIL_ATTEMPTS) {
            await delay(BACKGROUND_EMAIL_RETRY_MS * 2 ** (attempt - 1));
          }
        }
      }
    } finally {
      pendingEmailCount -= 1;
    }
  })();

  return true;
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

  if (company.length < 2 || normalizedCompany.tooLong) {
    errors.company = "Укажите название компании длиной от 2 до 120 символов.";
  }

  if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    errors.phone = "Введите российский номер из 10 цифр после +7.";
  }

  if (!email || normalizedEmail.tooLong || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    `Компания: ${company}`,
    `Телефон: ${phone}`,
    `Email: ${email}`,
    "",
    "Описание проекта:",
    message,
  ].join("\n");
  const html = `
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Новая заявка с tekpro.ru</title>
      </head>
      <body style="margin:0; padding:0; background:#edf1f4; color:#061426;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
          Новая заявка от ${escapeHtml(name)} — ${escapeHtml(company)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background:#edf1f4;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; overflow:hidden; border:1px solid #d9e0e6; border-radius:12px; background:#ffffff;">
                <tr>
                  <td style="padding:26px 32px; background:#061426;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td>
                          <img
                            src="cid:tekpro-logo-email@tekpro.ru"
                            width="246"
                            height="27"
                            alt="ТЭКПРО"
                            style="display:block; width:246px; max-width:100%; height:auto; border:0;"
                          >
                        </td>
                        <td align="right" style="font-family:Arial,Helvetica,sans-serif; font-size:14px;">
                          <a href="https://tekpro.ru" style="color:#bfcfe0; text-decoration:none;">tekpro.ru</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 32px 36px;">
                    <h1 style="margin:0; color:#061426; font-family:Arial,Helvetica,sans-serif; font-size:28px; font-weight:500; line-height:1.2;">
                      Новая заявка
                    </h1>
                    <p style="margin:10px 0 0; color:#5b6b7e; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.55;">
                      Клиент оставил контакты и описание проекта через форму на сайте.
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; margin-top:28px; border-top:1px solid #dfe5ea;">
                      <tr>
                        <td width="132" valign="top" style="padding:15px 16px 15px 0; border-bottom:1px solid #dfe5ea; color:#6b7888; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5;">
                          Имя
                        </td>
                        <td valign="top" style="padding:15px 0; border-bottom:1px solid #dfe5ea; color:#061426; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:600; line-height:1.5; overflow-wrap:anywhere;">
                          ${escapeHtml(name)}
                        </td>
                      </tr>
                      <tr>
                        <td width="132" valign="top" style="padding:15px 16px 15px 0; border-bottom:1px solid #dfe5ea; color:#6b7888; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5;">
                          Компания
                        </td>
                        <td valign="top" style="padding:15px 0; border-bottom:1px solid #dfe5ea; color:#061426; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:600; line-height:1.5; overflow-wrap:anywhere;">
                          ${escapeHtml(company)}
                        </td>
                      </tr>
                      <tr>
                        <td width="132" valign="top" style="padding:15px 16px 15px 0; border-bottom:1px solid #dfe5ea; color:#6b7888; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5;">
                          Телефон
                        </td>
                        <td valign="top" style="padding:15px 0; border-bottom:1px solid #dfe5ea; color:#061426; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:600; line-height:1.5;">
                          <a href="tel:+${phoneDigits}" style="color:#061426; text-decoration:none;">${escapeHtml(phone)}</a>
                        </td>
                      </tr>
                      <tr>
                        <td width="132" valign="top" style="padding:15px 16px 15px 0; border-bottom:1px solid #dfe5ea; color:#6b7888; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5;">
                          Email
                        </td>
                        <td valign="top" style="padding:15px 0; border-bottom:1px solid #dfe5ea; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:600; line-height:1.5; overflow-wrap:anywhere;">
                          <a href="mailto:${escapeHtml(email)}" style="color:#1f5f99; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px;">${escapeHtml(email)}</a>
                        </td>
                      </tr>
                    </table>

                    <h2 style="margin:30px 0 12px; color:#061426; font-family:Arial,Helvetica,sans-serif; font-size:18px; font-weight:600; line-height:1.35;">
                      О проекте
                    </h2>
                    <div style="padding:20px 22px; border-radius:8px; background:#f3f6f8;">
                      <p style="margin:0; color:#27384c; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.65; overflow-wrap:anywhere;">
                        ${escapeHtml(message).replaceAll("\n", "<br>")}
                      </p>
                    </div>

                    <p style="margin:26px 0 0; color:#738091; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.55;">
                      Это письмо было отправлено автоматически, не отвечайте на него. <br>Чтобы связаться с клиентом - напишите на указанный в графе адрес почты.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  let emailLogoContent: Buffer;
  try {
    emailLogoContent = await getEmailLogoContent();
  } catch (error) {
    console.error("Contact form email logo is unavailable.", {
      message: error instanceof Error ? error.message : "Unknown file error",
    });
    return json("Форма временно недоступна. Напишите нам на info@tekpro.ru.", 503);
  }

  const accepted = sendEmailInBackground(mailer, {
    from: {
      name: process.env.SMTP_FROM_NAME || "Сайт ТЭКПРО",
      address: fromAddress,
    },
    to: toAddress,
    replyTo: email,
    subject: `[tekpro.ru] Новая обращение — ${safeName}`,
    text,
    html,
    attachments: [
      {
        filename: "tekpro-logo-email.png",
        content: emailLogoContent,
        contentType: "image/png",
        contentDisposition: "inline",
        cid: "tekpro-logo-email@tekpro.ru",
      },
    ],
  });

  if (!accepted) {
    console.error("Contact form background email limit reached.");
    return json("Форма временно недоступна. Напишите нам на info@tekpro.ru.", 503);
  }

  return json("Заявка принята.", 202);
}
