import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),

  title: {
    default: "BJJ Performance",
    template: "%s | BJJ Performance",
  },

  description:
    "Preparação física inteligente para praticantes de Jiu-Jitsu.",

  applicationName: "BJJ Performance",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BJJ Performance",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",

  themeColor: "#09090b",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh overflow-x-hidden bg-[#09090b] text-white">
        {children}
      </body>
    </html>
  );
}