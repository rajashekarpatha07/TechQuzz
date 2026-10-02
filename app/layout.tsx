import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechQuzz — Live JS vs Python Event Game",
  description:
    "The ultimate live event game: JavaScript vs Python. Scan, tap, argue, and quiz your way to the top!",
  keywords: ["quiz", "javascript", "python", "live event", "multiplayer", "tech quiz"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
