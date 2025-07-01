-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group'))
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can only see conversations they are part of
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

-- Users can create new conversations
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- RLS Policies for messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.is_active = true
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for conversation_participants
-- Users can view participants in their conversations
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.is_active = true
    )
  );

-- Users can add themselves to conversations (for group chats)
CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own participation status
CREATE POLICY "Users can update their participation" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update conversation's last_message_at when a new message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to create a direct conversation between two users
CREATE OR REPLACE FUNCTION public.create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp1
    WHERE cp1.conversation_id = c.id
    AND cp1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = c.id
    AND cp2.user_id = other_user_id
  );
  
  -- If conversation doesn't exist, create new one
  IF conversation_id IS NULL THEN
    -- Create conversation
    INSERT INTO public.conversations (type) VALUES ('direct')
    RETURNING id INTO conversation_id;
    
    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_id, current_user_id),
      (conversation_id, other_user_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;