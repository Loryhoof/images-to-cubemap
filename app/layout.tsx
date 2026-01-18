import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://cubemap.kevinlabs.com";

export const metadata: Metadata = {
  title: "Cubemap Creator – Free Online Skybox Generator Tool",
  description:
    "Create cubemap cross layouts from 6 images instantly. Free browser-based tool to generate skybox textures for game engines, 3D apps, and VR. No signup required.",
  keywords: [
    "cubemap generator",
    "skybox creator",
    "skybox generator",
    "skybox maker",
    "convert images to cubemap",
    "6 images to cubemap",
    "images to cubemap",
    "cubemap from images",
    "cubemap converter",
    "cubemap tool",
    "cross layout cubemap",
    "skybox texture",
    "skybox from images",
    "6 face cubemap",
    "cube map maker",
    "3D skybox",
    "Unity skybox",
    "Unreal Engine skybox",
    "Three.js cubemap",
    "environment map",
    "HDRI to cubemap",
    "game development",
    "texture mapping",
  ],
  authors: [{ name: "Kevin Klatt", url: "https://x.com/klattkev" }],
  creator: "Kevin Klatt",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Cubemap Creator",
    title: "Cubemap Creator – Free Online Skybox Generator",
    description:
      "Drag & drop 6 images to create a cubemap cross layout. Export as PNG for Unity, Unreal, Three.js, and more. 100% free, runs in your browser.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cubemap Creator preview showing the cross layout interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cubemap Creator – Free Skybox Generator",
    description:
      "Create cubemap textures from 6 images instantly. Free tool for game devs & 3D artists.",
    creator: "@klattkev",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Cubemap Creator",
              description:
                "Free online tool to create cubemap cross layouts from 6 images for game engines and 3D applications.",
              url: siteUrl,
              applicationCategory: "DesignApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Kevin Klatt",
                url: "https://x.com/klattkev",
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
