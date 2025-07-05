'use client';

import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { userMenuItems } from '@/constants/navigation';

interface UserMenuProps {
  displayName: string;
  avatarUrl: string | null;
  email?: string;
  onSignOut: () => void;
}

export function UserMenu({ displayName, avatarUrl, email, onSignOut }: UserMenuProps) {
  const locale = useLocale();
  const t = useTranslations('navigation');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-8 w-8 border border-border hover:ring-2 hover:ring-primary/20 transition-all">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName || 'User'} />
          ) : (
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
          {displayName || email?.split('@')[0] || 'User'}
        </div>
        {userMenuItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={`/${locale}${item.href}`} className="flex items-center">
              {t(item.labelKey)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={onSignOut}>{t('logout')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}