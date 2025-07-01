'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatHeaderProps {
  otherUser?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export function ChatHeader({ otherUser }: ChatHeaderProps) {
  const t = useTranslations('chat');

  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <Avatar className="h-10 w-10">
        <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.display_name || t('user')} />
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h2 className="font-semibold">
          {otherUser?.display_name || otherUser?.email || t('unknownUser')}
        </h2>
      </div>
    </div>
  );
}