import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/common/Footer";
import { ThemeProvider } from './providers/theme-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "GaijinHub - Connect with Japan's Foreign Community",
  description: "Find apartments, jobs, items for sale, and services specifically catered to expats and international residents all across Japan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-grow pt-16">
              {children}
            </div>
            <Footer />
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
