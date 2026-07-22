import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ТЭКПРО — комплексное проектирование и инженерные изыскания",
  description:
    "Инжиниринговая компания ТЭКПРО: полный цикл проектно-изыскательских работ, инженерная экспертиза, сопровождение проектов, IT и ИИ решения.",
  icons: {
    icon: "/media/logo6.png",
    shortcut: "/media/logo6.png",
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
