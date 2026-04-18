import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://roam.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Roam',
    template: '%s | Roam',
  },
  description: 'Creative sessions, organized and shareable.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Roam',
    description: 'Creative sessions, organized and shareable.',
    url: '/',
    siteName: 'Roam',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.svg',
        width: 1200,
        height: 630,
        alt: 'Roam - Creative sessions, organized and shareable.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roam',
    description: 'Creative sessions, organized and shareable.',
    images: ['/opengraph-image.svg'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
