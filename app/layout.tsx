import type { Metadata } from "next";

import { CookieConsent } from "@/components/privacy/CookieConsent";
import { content } from "@/data/content";
import "./globals.css";

const siteTitle = "ТЭКПРО — комплексное проектирование и инженерные изыскания";
const siteDescription =
  "ТЭКПРО — инжиниринговая компания полного цикла: инженерные изыскания, проектирование нефтегазовой инфраструктуры, сопровождение объектов и цифровые решения.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tekpro.ru"),
  applicationName: "ТЭКПРО",
  title: {
    default: siteTitle,
    template: "%s | ТЭКПРО",
  },
  description: siteDescription,
  keywords: [
    "ТЭКПРО",
    "инженерные изыскания",
    "комплексное проектирование",
    "нефтегазовая инфраструктура",
    "проектная документация",
    "авторский надзор",
    "строительный контроль",
    "инженерная защита",
  ],
  authors: [{ name: "ТЭКПРО", url: "https://tekpro.ru" }],
  creator: "ТЭКПРО",
  publisher: "ТЭКПРО",
  category: "Инжиниринг и проектирование",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "ТЭКПРО",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/media/company-cycle.png",
        width: 1536,
        height: 1024,
        alt: "ТЭКПРО — полный цикл инженерного проектирования",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/media/company-cycle.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://tekpro.ru/#organization",
  name: "ТЭКПРО",
  legalName: content.legal.companyName,
  url: "https://tekpro.ru/",
  logo: "https://tekpro.ru/media/brand/tekpro-logo-primary.svg",
  email: content.contacts.email,
  telephone: "+7 495 332-00-53",
  taxID: content.legal.inn,
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Наметкина, д. 14, к. 2",
    postalCode: "117420",
    addressLocality: "Москва",
    addressCountry: "RU",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+7 495 332-00-53",
    email: content.contacts.email,
    contactType: "customer service",
    areaServed: "RU",
    availableLanguage: "Russian",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://tekpro.ru/#website",
  url: "https://tekpro.ru/",
  name: "ТЭКПРО",
  description: siteDescription,
  inLanguage: "ru-RU",
  publisher: {
    "@id": "https://tekpro.ru/#organization",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationStructuredData, websiteStructuredData]).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
