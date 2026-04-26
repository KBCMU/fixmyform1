-- Create coach_conversations table
CREATE TABLE coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

-- RLS: users can CRUD their own conversations
CREATE POLICY "Users can view their own conversations"
  ON coach_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations"
  ON coach_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations"
  ON coach_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations"
  ON coach_conversations FOR DELETE USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_coach_conversations_user_id ON coach_conversations(user_id);

-- Create coach_messages table
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES coach_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT,
  tool_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- RLS: messages accessible via conversation ownership
CREATE POLICY "Users can view messages in their conversations"
  ON coach_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_conversations
    WHERE coach_conversations.id = coach_messages.conversation_id
    AND coach_conversations.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert messages in their conversations"
  ON coach_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM coach_conversations
    WHERE coach_conversations.id = coach_messages.conversation_id
    AND coach_conversations.user_id = auth.uid()
  ));

-- Indexes for efficient queries
CREATE INDEX idx_coach_messages_conversation_id ON coach_messages(conversation_id);
CREATE INDEX idx_coach_messages_created_at ON coach_messages(created_at);
