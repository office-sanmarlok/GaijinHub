'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/utils/logger';

interface ChatButtonProps {
  listingUserId: string;
  listingId: string;
  currentUserId?: string;
  className?: string;
}

export function ChatButton({ listingUserId, listingId, currentUserId, className }: ChatButtonProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ListingDetail');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleStartChat = async () => {
    if (!currentUserId) {
      toast({
        title: t('loginRequired'),
        description: t('loginToContact'),
        variant: 'destructive',
      });
      router.push(`/${locale}/login`);
      return;
    }

    if (currentUserId === listingUserId) {
      toast({
        title: t('cannotChatWithYourself'),
        description: t('thisIsYourListing'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // create_direct_conversation関数を呼び出して会話を作成または取得
      const { data: conversationId, error } = await supabase
        .rpc('create_direct_conversation', { other_user_id: listingUserId });

      logger.debug('RPC Response:', { conversationId, error });

      if (error) throw error;

      if (!conversationId) {
        throw new Error('Conversation ID not returned');
      }

      // チャットページへ遷移
      router.push(`/${locale}/chat/${conversationId}`);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      toast({
        title: t('errorCreatingChat'),
        description: t('pleaseTryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isLoading}
      className={className}
      variant="default"
      size="lg"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {isLoading ? t('loading') : t('startChat')}
    </Button>
  );
}