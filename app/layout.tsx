import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ТЭКПРО — комплексное проектирование и инженерные изыскания",
  description:
    "Инжиниринговая компания ТЭКПРО: полный цикл проектно-изыскательских работ, сопровождение проектов, корпоративные цифровые платформы, аналитические системы и решения на базе технологий искусственного интеллекта.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
