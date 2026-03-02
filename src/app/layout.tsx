import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ReadrViz", template: "%s · ReadrViz" },
  description: "The modern reading tracker with best-in-class analytics, discovery, and community.",
  keywords: ["books", "reading tracker", "book club", "analytics", "goodreads alternative"],
  openGraph: {
    title: "ReadrViz",
    description: "Track, analyze, and discover books with your community.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
