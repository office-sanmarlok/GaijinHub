'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { ChatClient } from '@/lib/chat/client';
import type { Message } from '@/lib/chat/types';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/utils/logger';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherUser?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export function ChatWindow({ conversationId, currentUserId, otherUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const chatClient = useRef(new ChatClient());
  const { toast } = useToast();
  const t = useTranslations('chat');
  const subscriptionRef = useRef<any>(null);

  // メッセージを取得
  useEffect(() => {
    loadMessages();
    
    // リアルタイム購読を設定
    subscriptionRef.current = chatClient.current.subscribeToMessages(
      conversationId,
      (newMessage) => {
        // 自分が送ったメッセージは既に追加されているのでスキップ
        if (newMessage.sender_id !== currentUserId) {
          setMessages(prev => [...prev, newMessage]);
          // 既読状態を更新
          chatClient.current.markAsRead(conversationId);
        }
      }
    );

    // 既読状態を更新
    chatClient.current.markAsRead(conversationId);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [conversationId, currentUserId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await chatClient.current.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      logger.error('Failed to load messages:', error);
      toast({
        title: t('errorLoadingMessages'),
        description: t('pleaseTryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      const newMessage = await chatClient.current.sendMessage({
        conversation_id: conversationId,
        content: content.trim(),
      });

      // 送信者情報を追加してローカル状態を更新
      const messageWithSender = {
        ...newMessage,
        sender: {
          id: currentUserId,
          email: '', // 実際のメールアドレスは不要
          display_name: undefined,
          avatar_path: undefined,
        }
      };
      
      setMessages(prev => [...prev, messageWithSender]);
    } catch (error) {
      logger.error('Failed to send message:', error);
      toast({
        title: t('errorSendingMessage'),
        description: t('pleaseTryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      <ChatHeader otherUser={otherUser} />
      
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
      </div>

      <div className="border-t p-4">
        <MessageInput 
          onSendMessage={sendMessage}
          disabled={isSending}
          placeholder={t('typeMessage')}
        />
      </div>
    </Card>
  );
}