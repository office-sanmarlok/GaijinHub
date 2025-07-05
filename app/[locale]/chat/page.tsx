import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ChatList } from '@/components/chat/ChatList';

interface ChatListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ChatListPage({ params }: ChatListPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  return (
    <div className="container-responsive py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">チャット</h1>
      <ChatList />
    </div>
  );
}