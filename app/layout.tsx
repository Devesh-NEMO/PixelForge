import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorkerRegistrar } from "../components/service-worker";
import "./globals.css";

const archivo = localFont({
  src: "./fonts/archivo-black.woff2",
  variable: "--font-archivo",
  weight: "400",
  display: "swap",
});

const jetbrains = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains",
  weight: "400 700",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const description =
  "Convert, resize and compress images in your browser. No uploads, no accounts, no server.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PixelForge Converter",
  description,
  applicationName: "PixelForge",
  keywords: [
    "image converter",
    "jpg to webp",
    "png to jpg",
    "resize image",
    "compress image",
    "browser image converter",
  ],
  authors: [{ name: "Devesh" }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PixelForge",
    title: "PixelForge Converter",
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "PixelForge — convert images in seconds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelForge Converter",
    description,
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    title: "PixelForge",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#efeee8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full bg-paper font-mono text-ink">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
