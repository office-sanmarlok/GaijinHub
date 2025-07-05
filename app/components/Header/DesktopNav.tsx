'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { navigationItems } from '@/constants/navigation';

interface DesktopNavProps {
  isAuthenticated: boolean;
}

export function DesktopNav({ isAuthenticated }: DesktopNavProps) {
  const locale = useLocale();
  const t = useTranslations('navigation');

  return (
    <nav className="hidden md:flex items-center gap-4">
      {navigationItems.map((item) => {
        if (item.requiresAuth && !isAuthenticated) return null;
        if (item.showInDesktop === false) return null;

        return (
          <Link key={item.href} href={`/${locale}${item.href}`}>
            <Button variant={item.variant || 'ghost'}>{t(item.labelKey)}</Button>
          </Link>
        );
      })}
    </nav>
  );
}