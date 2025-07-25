import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import Footer from '@/components/common/Footer';
import Header from '@/components/Header/Header';
import { locales, type Locale } from '@/i18n/config';
import { SupabaseProvider } from '@/providers/supabase-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { logger } from '@/lib/utils/logger';

const inter = Inter({ subsets: ['latin'] });

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'GaijinHub - Connect with the global community in Japan',
  description: 'Connect with the global community in Japan',
  icons: {
    icon: '/GaijinHub-logo-icon.svg',
    apple: '/GaijinHub-logo-icon.svg',
  },
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    logger.error('[app/[locale]/layout.tsx] Invalid locale:', locale);
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SupabaseProvider>
            <QueryProvider>
              <NextIntlClientProvider messages={messages}>
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <div className="flex-grow pt-16">{children}</div>
                  <Footer />
                </div>
              </NextIntlClientProvider>
              <Toaster />
            </QueryProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}