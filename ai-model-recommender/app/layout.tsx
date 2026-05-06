import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Model Recommender — Find Your Perfect AI',
  description: 'Discover the best AI model for any task. Powered by Claude AI with a constantly-updated database of all major models.',
  openGraph: {
    title: 'AI Model Recommender',
    description: 'Find the perfect AI model for your task',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
