import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface ChatPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  try {
    const { id: conversationId, locale } = await params;
    setRequestLocale(locale);

  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Verify user has access to this conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!participant) {
    notFound();
  }

  // Get conversation details
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    notFound();
  }

  // Get all participants
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('is_active', true);

  // Find the other participant's ID
  const otherUserId = participants?.find(p => p.user_id !== user.id)?.user_id;
  
  let otherUser = undefined;
  if (otherUserId) {
    // Get the other user's details using the RPC function
    const { data: authUser } = await supabase.rpc('get_auth_user', { user_id: otherUserId });
    if (authUser && typeof authUser === 'object' && 'email' in authUser) {
      const userData = authUser as any;
      otherUser = {
        id: otherUserId,
        email: userData.email,
        display_name: userData.display_name as string | undefined,
        avatar_url: userData.avatar_url as string | undefined,
      };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ChatWindow 
        conversationId={conversationId}
        currentUserId={user.id}
        otherUser={otherUser}
      />
    </div>
  );
  } catch (error) {
    notFound();
  }
}