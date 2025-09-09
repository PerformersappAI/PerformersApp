
-- 1) Enum for sender role
DO $$ BEGIN
  CREATE TYPE public.support_sender_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Conversations table
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: unique open conversation per user (MVP allows multiple, but you can uncomment to enforce one open thread)
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_conversation_per_user
--   ON public.support_conversations (user_id)
--   WHERE (status = 'open');

-- 3) Messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_role public.support_sender_role NOT NULL,
  sender_id uuid, -- null for system messages if ever needed
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- 4) Update last_message_at on insert trigger
CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.support_conversations
    SET last_message_at = now(), updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_conversation_last_message_at ON public.support_messages;
CREATE TRIGGER trg_update_conversation_last_message_at
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message_at();

-- 5) Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 6) Policies for conversations
-- Users can view their own conversations; admins can view all
CREATE POLICY "Users can view their own conversations"
  ON public.support_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON public.support_conversations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can create their own conversations
CREATE POLICY "Users can create their own conversations"
  ON public.support_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations (e.g., close); admins can update all
CREATE POLICY "Users can update their own conversations"
  ON public.support_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all conversations"
  ON public.support_conversations
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete conversations (optional)
CREATE POLICY "Admins can delete conversations"
  ON public.support_conversations
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7) Policies for messages
-- Users can see messages in their conversations; admins can see all
CREATE POLICY "Users can view messages in their conversations"
  ON public.support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.support_conversations c
      WHERE c.id = support_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.support_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can post messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'user'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.support_conversations c
      WHERE c.id = support_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- Admins can post messages in any conversation
CREATE POLICY "Admins can insert messages in any conversation"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'admin'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can update/delete any message (optional)
CREATE POLICY "Admins can update any message"
  ON public.support_messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any message"
  ON public.support_messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8) Realtime configuration (so inserts stream to clients)
-- Ensure full row data for realtime
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_conversations REPLICA IDENTITY FULL;

-- Add tables to realtime publication (safe if repeated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
  END IF;
END
$$;
