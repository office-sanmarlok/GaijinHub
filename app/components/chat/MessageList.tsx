'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '@/lib/chat/types';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('chat');

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>{t('noMessages')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.sender_id === currentUserId}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}