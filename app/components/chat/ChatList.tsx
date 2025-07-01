'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS, ko, zhCN, zhTW } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { ChatClient } from '@/lib/chat/client';
import type { ConversationWithDetails } from '@/lib/chat/types';
import { Loader2 } from 'lucide-react';

interface ChatListProps {
  currentUserId: string;
}

const localeMap = {
  ja: ja,
  en: enUS,
  ko: ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function ChatList({ currentUserId }: ChatListProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('chat');
  const dateLocale = localeMap[locale as keyof typeof localeMap] || enUS;
  const chatClient = new ChatClient();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatClient.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // エラーの詳細を表示
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/${locale}/chat/${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>{t('noConversations')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherUser = conversation.other_user;
        const lastMessage = conversation.last_message;
        const hasUnread = conversation.unread_count > 0;

        return (
          <Card
            key={conversation.id}
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar_path || undefined} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">
                    {otherUser?.display_name || otherUser?.email || t('unknownUser')}
                  </h3>
                  {lastMessage && (
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(lastMessage.created_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </span>
                  )}
                </div>

                {lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage.content}
                  </p>
                )}

                {hasUnread && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-xs text-white">
                      {conversation.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}