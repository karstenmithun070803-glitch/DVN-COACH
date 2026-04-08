import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { AdminSettingsProvider } from "@/context/AdminSettingsContext";
import { JobsProvider } from "@/context/JobsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DVN Coach CRM",
  description: "Offline-first Workshop Configurator",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body 
        className="min-h-screen flex flex-col bg-white text-slate-900"
        suppressHydrationWarning
      >
        <AdminSettingsProvider>
          <JobsProvider>
            <Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </JobsProvider>
        </AdminSettingsProvider>
      </body>
    </html>
  );
}
