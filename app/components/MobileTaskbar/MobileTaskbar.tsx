'use client';

import { Home, ListPlus, MessageCircle, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { userMenuItems } from '@/constants/navigation';

export default function MobileTaskbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('navigation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  const items = [
    {
      href: '/listings',
      icon: Search,
      label: t('listings'),
      requiresAuth: false,
    },
    {
      href: '/chat',
      icon: MessageCircle,
      label: t('chat'),
      requiresAuth: true,
    },
    {
      href: '/listings/new',
      icon: ListPlus,
      label: t('postListing'),
      requiresAuth: true,
    },
    {
      href: user ? '/account' : '/login',
      icon: User,
      label: user ? t('account') : t('login'),
      requiresAuth: false,
    },
  ];

  const visibleItems = items.filter(item => !item.requiresAuth || user);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50">
      <nav className={`grid h-16 ${visibleItems.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {visibleItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          // アカウントボタンの場合はドロップダウンメニューを表示
          if (item.icon === User && user) {
            return (
              <DropdownMenu key={item.href} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'flex-col gap-1 h-full w-full rounded-none',
                      isActive && 'text-primary bg-accent'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 mb-2">
                  {userMenuItems.map((menuItem) => (
                    <DropdownMenuItem key={menuItem.href} asChild>
                      <Link href={`/${locale}${menuItem.href}`}>
                        {t(menuItem.labelKey)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Link key={item.href} href={href} className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-col gap-1 h-full w-full rounded-none',
                  isActive && 'text-primary bg-accent'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}