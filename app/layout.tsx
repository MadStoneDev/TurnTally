import "./globals.css";

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";

import Navigation from "@/components/navigation";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Turn Tally | Board Game Turn Tracker & Timer",
  description:
    "Professional board game timing app with player statistics, leaderboards, session notes, and turn-by-turn analysis. Perfect for game groups who want to track performance and improve gameplay.",
};

const outfit = Outfit({
  variable: "--font-outfit",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-neutral-50">
            <Navigation />
            <main className="container mx-auto px-4 pb-20">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
