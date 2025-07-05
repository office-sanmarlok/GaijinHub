'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import LanguageSelector from '@/components/common/LanguageSelector';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/utils/logger';
import { AuthButtons } from './AuthButtons';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { UserMenu } from './UserMenu';

export default function Header() {
  const { user, isLoading, displayName, avatarUrl, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations('navigation');
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
            <span className="text-lg sm:text-xl font-bold">{tCommon('appName')}</span>
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
            src="/GaijinHub-logo.svg"
            alt="GaijinHub Logo"
            width={40}
            height={40}
            className="h-8 w-8 sm:h-10 sm:w-10"
            priority
          />
          <span className="text-lg sm:text-xl font-bold">GaijinHub</span>
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

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="touch-target"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <MobileNav
          isAuthenticated={!!user}
          displayName={displayName || user?.email?.split('@')[0] || ''}
          onItemClick={() => setIsMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </header>
  );
}