'use client';

import { format } from 'date-fns';
import { ja, enUS, ko, zhCN, zhTW } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/chat/types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

const localeMap = {
  ja: ja,
  en: enUS,
  ko: ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const locale = useLocale();
  const t = useTranslations('chat');
  const dateLocale = localeMap[locale as keyof typeof localeMap] || enUS;

  return (
    <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
      {!isOwn && (
        <span className="text-xs text-muted-foreground px-1">
          {message.sender?.display_name || message.sender?.email || t('unknownUser')}
        </span>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          'text-xs mt-1',
          isOwn ? 'text-primary-foreground/70' : 'text-secondary-foreground/70'
        )}>
          {format(new Date(message.created_at), 'HH:mm', { locale: dateLocale })}
          {message.is_edited && ' (編集済み)'}
        </p>
      </div>
    </div>
  );
}