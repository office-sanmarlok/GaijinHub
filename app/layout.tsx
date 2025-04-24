import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/common/Footer";
import { ThemeProvider } from './providers/theme-provider'
import { SupabaseProvider } from './providers/supabase-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SupabaseProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex-grow pt-16">
                {children}
              </div>
              <Footer />
            </div>
          </SupabaseProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
