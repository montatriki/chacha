import type { Metadata } from "next";
import type { ReactNode } from "react";
import { COPY, SITE } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.websiteUrl),
  title: COPY.seo.title,
  description: SITE.description,
  authors: [{ name: SITE.legalName }],
  icons: { icon: SITE.icon, apple: SITE.icon },
  alternates: { canonical: `${SITE.websiteUrl}/` },
  openGraph: {
    title: COPY.seo.ogTitle,
    description: SITE.description,
    type: "website",
    url: `${SITE.websiteUrl}/`,
    images: [SITE.logo],
  },
  twitter: {
    card: "summary_large_image",
    title: COPY.seo.ogTitle,
    description: SITE.description,
    images: [SITE.logo],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.legalName,
  url: SITE.websiteUrl,
  logo: `${SITE.websiteUrl}${SITE.logo}`,
  email: SITE.email,
  address: { "@type": "PostalAddress", addressLocality: "Dubai", addressRegion: "DIFC", addressCountry: "AE" },
  description: SITE.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href={SITE.logoOnDark} />
        <link rel="preload" as="image" href={SITE.scenes.journey.poster} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
