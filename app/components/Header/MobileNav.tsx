'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { navigationItems, userMenuItems, authItems } from '@/constants/navigation';

interface MobileNavProps {
  isAuthenticated: boolean;
  displayName: string;
  onItemClick: () => void;
  onSignOut: () => void;
}

export const MobileNav = memo(function MobileNav({ isAuthenticated, displayName, onItemClick, onSignOut }: MobileNavProps) {
  const locale = useLocale();
  const t = useTranslations('navigation');

  return (
    <div className="md:hidden fixed inset-x-0 top-16 bg-background border-b shadow-lg">
      <nav className="flex flex-col p-4 gap-2">
        {navigationItems.map((item) => {
          if (item.requiresAuth && !isAuthenticated) return null;
          if (item.showInMobile === false) return null;

          return (
            <Link key={item.href} href={`/${locale}${item.href}`} onClick={onItemClick}>
              <Button variant={item.variant || 'ghost'} className="w-full justify-start touch-target">
                {t(item.labelKey)}
              </Button>
            </Link>
          );
        })}

        {isAuthenticated ? (
          <>
            <div className="border-t my-2 pt-2">
              <div className="px-3 py-2 text-sm font-medium">
                {displayName || 'User'}
              </div>
              {userMenuItems.map((item) => (
                <Link key={item.href} href={`/${locale}${item.href}`} onClick={onItemClick}>
                  <Button variant="ghost" className="w-full justify-start touch-target">
                    {t(item.labelKey)}
                  </Button>
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start touch-target"
                onClick={() => {
                  onSignOut();
                  onItemClick();
                }}
              >
                {t('logout')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Link href={`/${locale}${authItems.login.href}`} onClick={onItemClick}>
              <Button variant={authItems.login.variant} className="w-full justify-start touch-target">
                {t(authItems.login.labelKey)}
              </Button>
            </Link>
            <Link href={`/${locale}${authItems.signup.href}`} onClick={onItemClick}>
              <Button variant={authItems.signup.variant} className="w-full justify-start touch-target">
                {t(authItems.signup.labelKey)}
              </Button>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
});