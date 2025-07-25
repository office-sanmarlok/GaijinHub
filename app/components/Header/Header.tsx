'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSelector from '@/components/common/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/utils/logger';
import { AuthButtons } from './AuthButtons';
import { DesktopNav } from './DesktopNav';
import { UserMenu } from './UserMenu';

export default function Header() {
  const { user, isLoading, displayName, avatarUrl, signOut } = useAuth();
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-background z-50 border-b">
        <div className="container-responsive h-full flex items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-32 sm:h-10 sm:w-40 bg-gray-200 rounded animate-pulse" />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background z-50 border-b">
      <div className="container-responsive h-full flex items-center justify-between gap-4">
        <Link href={`/${locale}`} className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Image
            src="/GaijinHub-logo-icon.svg"
            alt="GaijinHub Logo"
            width={40}
            height={40}
            className="h-8 w-8 sm:h-10 sm:w-10"
            priority
          />
          <Image
            src="/GaijinHub-logo-full.svg"
            alt="GaijinHub Text"
            width={180}
            height={50}
            className="h-8 w-auto sm:h-10"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <DesktopNav isAuthenticated={!!user} />
          {user ? (
            <UserMenu 
              displayName={displayName} 
              avatarUrl={avatarUrl} 
              email={user.email} 
              onSignOut={handleSignOut} 
            />
          ) : (
            <AuthButtons />
          )}
          <LanguageSelector />
        </nav>

        {/* Mobile Language Selector Only */}
        <div className="flex md:hidden items-center">
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}