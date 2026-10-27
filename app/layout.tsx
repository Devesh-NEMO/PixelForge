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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efeee8" },
    { media: "(prefers-color-scheme: dark)", color: "#121210" },
  ],
  colorScheme: "light",
};

/**
 * Runs before the body paints so the stored (or system) theme is applied
 * without a flash of the wrong colours.
 */
const themeScript = `(function(){try{var k="pixelforge-theme";var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full bg-paper font-mono text-ink">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
