import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegistrar } from "../components/service-worker";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#080e20",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans text-ink">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
