// チャット機能の型定義

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  type: 'direct' | 'group';
  // 追加フィールド（JOIN時に取得）
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reply_to: string | null;
  // 追加フィールド（JOIN時に取得）
  sender?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_path?: string;
  };
  reply_to_message?: Message;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_active: boolean;
  // 追加フィールド（JOIN時に取得）
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_path?: string;
  };
}

export interface SendMessagePayload {
  conversation_id: string;
  content: string;
  reply_to?: string;
}

export interface CreateConversationPayload {
  user_ids: string[];
  type?: 'direct' | 'group';
}

export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
  other_user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_path?: string;
  }; // ダイレクトメッセージの場合の相手ユーザー
}