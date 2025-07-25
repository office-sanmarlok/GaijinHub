import { createClient } from '@/lib/supabase/client';
import type { 
  Conversation, 
  Message, 
  SendMessagePayload,
  ConversationWithDetails 
} from './types';

export class ChatClient {
  private supabase = createClient();

  // 会話一覧を取得
  async getConversations(): Promise<ConversationWithDetails[]> {
    const { data: conversations, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants!inner(*),
        last_message:messages(*)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    // 各会話の未読数を計算
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // 参加者のユーザー情報を取得
    const conversationsWithUsers = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherParticipant = conv.participants.find(p => p.user_id !== userId);
        
        let other_user = undefined;
        if (conv.type === 'direct' && otherParticipant) {
          const { data: userData } = await this.supabase
            .rpc('get_user_public_info', { p_user_id: otherParticipant.user_id });
          
          if (userData && userData.length > 0) {
            const user = userData[0];
            other_user = {
              id: user.id,
              email: user.email,
              display_name: user.display_name || undefined,
              avatar_path: user.avatar_url ? user.avatar_url : undefined
            };
          }
        }

        // 最後のメッセージの送信者情報を取得
        let last_message = null;
        if (conv.last_message?.[0]) {
          const msg = conv.last_message[0];
          // 送信者情報を取得
          const { data: senderData } = await this.supabase
            .rpc('get_user_public_info', { p_user_id: msg.sender_id });
          
          let senderInfo: {
            id: string;
            email: string;
            display_name?: string;
            avatar_path?: string;
          } | undefined = undefined;
          
          if (senderData && senderData.length > 0) {
            const user = senderData[0];
            senderInfo = {
              id: user.id,
              email: user.email,
              display_name: user.display_name || undefined,
              avatar_path: user.avatar_url ? user.avatar_url : undefined
            };
          }
          
          last_message = senderInfo ? {
            ...msg,
            sender: senderInfo
          } : null;
        }

        // 未読メッセージ数を取得（本来は別クエリで取得すべき）
        const unread_count = 0; // TODO: 実装

        return {
          ...conv,
          type: conv.type as 'direct' | 'group',
          unread_count,
          other_user,
          last_message: last_message || undefined
        } as ConversationWithDetails;
      })
    );

    return conversationsWithUsers;
  }

  // 特定の会話のメッセージを取得
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        *,
        reply_to_message:messages!reply_to(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // 送信者情報を取得
    const messagesWithSenders = await Promise.all(
      (data || []).map(async (msg) => {
        // 送信者情報を取得
        const { data: senderData } = await this.supabase
          .rpc('get_user_public_info', { p_user_id: msg.sender_id });
        
        let sender: {
          id: string;
          email: string;
          display_name?: string;
          avatar_path?: string;
        } | undefined = undefined;
        
        if (senderData && senderData.length > 0) {
          const user = senderData[0];
          sender = {
            id: user.id,
            email: user.email,
            display_name: user.display_name || undefined,
            avatar_path: user.avatar_url ? user.avatar_url : undefined
          };
        }

        return {
          ...msg,
          sender,
          reply_to_message: msg.reply_to_message || undefined
        } as Message;
      })
    );
    
    return messagesWithSenders.reverse(); // 古い順に並び替え
  }

  // メッセージを送信
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversation_id,
        sender_id: userId,
        content: payload.content,
        reply_to: payload.reply_to
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      is_edited: data.is_edited ?? false
    };
  }

  // メッセージに送信者情報を追加
  async getMessageWithSender(message: Message): Promise<Message> {
    // 送信者情報を取得
    const { data: senderData } = await this.supabase
      .rpc('get_user_public_info', { p_user_id: message.sender_id });
    
    let sender: {
      id: string;
      email: string;
      display_name?: string;
      avatar_path?: string;
    } | undefined = undefined;
    
    if (senderData && senderData.length > 0) {
      const user = senderData[0];
      sender = {
        id: user.id,
        email: user.email,
        display_name: user.display_name || undefined,
        avatar_path: user.avatar_url ? user.avatar_url : undefined
      };
    }

    return {
      ...message,
      sender
    };
  }

  // ダイレクトメッセージの会話を作成または取得
  async createDirectConversation(otherUserId: string): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('create_direct_conversation', { other_user_id: otherUserId });

    if (error) throw error;
    return data;
  }

  // 既読位置を更新
  async markAsRead(conversationId: string): Promise<void> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // リアルタイム購読を設定
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ) {
    return this.supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();
  }

  // 会話リストのリアルタイム購読
  subscribeToConversations(
    userId: string,
    onUpdate: (conversation: Conversation) => void
  ) {
    return this.supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=in.(SELECT conversation_id FROM conversation_participants WHERE user_id=eq.${userId})`
        },
        (payload) => {
          onUpdate(payload.new as Conversation);
        }
      )
      .subscribe();
  }
}