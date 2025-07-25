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
    const { data: userData } = await supabase.rpc('get_user_public_info', { p_user_id: otherUserId });
    if (userData && userData.length > 0) {
      const user = userData[0];
      otherUser = {
        id: user.id,
        email: user.email,
        display_name: user.display_name || undefined,
        avatar_url: user.avatar_url || undefined,
      };
    }
  }

  return (
    <div className="container-responsive py-8 max-w-5xl">
      <ChatWindow 
        conversationId={conversationId}
        currentUserId={user.id}
        otherUser={otherUser}
      />
    </div>
  );
  } catch {
    notFound();
  }
}