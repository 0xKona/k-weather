import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "K-Weather",
  description: "3D weather globe — view Earth from orbit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="h-full overflow-hidden">
        {children}
        <Link
          href="/privacy/"
          className="fixed bottom-3 right-4 z-50 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
        >
          Privacy
        </Link>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-3 left-4 z-50 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
        >
          Powered by Open-Meteo
        </a>
        <Toaster position="bottom-right" offset={40} />
      </body>
    </html>
  );
}
