import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import Footer from '@/components/common/Footer';
import Header from '@/components/layout/Header';
import { locales } from '@/i18n/config';
import { SupabaseProvider } from '@/providers/supabase-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const inter = Inter({ subsets: ['latin'] });

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.error('[app/[locale]/layout.tsx] Invalid locale:', locale);
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
            <NextIntlClientProvider messages={messages}>
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-grow pt-16">{children}</div>
                <Footer />
              </div>
            </NextIntlClientProvider>
          </SupabaseProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
