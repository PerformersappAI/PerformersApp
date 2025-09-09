
-- Create the auditions table as the central hub for all audition-related data
CREATE TABLE public.auditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  casting_director TEXT,
  production_company TEXT,
  audition_date DATE,
  audition_type TEXT DEFAULT 'self-tape' CHECK (audition_type IN ('self-tape', 'in-person', 'callback', 'chemistry-read')),
  status TEXT DEFAULT 'preparation' CHECK (status IN ('preparation', 'submitted', 'callback', 'booked', 'rejected', 'expired')),
  notes TEXT,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS to auditions table
ALTER TABLE public.auditions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for auditions table
CREATE POLICY "Users can view their own auditions" 
  ON public.auditions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own auditions" 
  ON public.auditions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auditions" 
  ON public.auditions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auditions" 
  ON public.auditions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for existing tables only if they don't exist
DO $$ 
BEGIN
    -- Enable RLS on tables if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scripts' AND rowsecurity = true) THEN
        ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'script_analyses' AND rowsecurity = true) THEN
        ALTER TABLE public.script_analyses ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coaching_sessions' AND rowsecurity = true) THEN
        ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_submissions' AND rowsecurity = true) THEN
        ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create policies only if they don't exist for scripts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts' AND policyname = 'Users can view their own scripts') THEN
        EXECUTE 'CREATE POLICY "Users can view their own scripts" ON public.scripts FOR SELECT USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts' AND policyname = 'Users can create their own scripts') THEN
        EXECUTE 'CREATE POLICY "Users can create their own scripts" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts' AND policyname = 'Users can update their own scripts') THEN
        EXECUTE 'CREATE POLICY "Users can update their own scripts" ON public.scripts FOR UPDATE USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scripts' AND policyname = 'Users can delete their own scripts') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own scripts" ON public.scripts FOR DELETE USING (auth.uid() = user_id)';
    END IF;

    -- Create policies for other tables similarly
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'script_analyses' AND policyname = 'Users can view their own script analyses') THEN
        EXECUTE 'CREATE POLICY "Users can view their own script analyses" ON public.script_analyses FOR SELECT USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'script_analyses' AND policyname = 'Users can create their own script analyses') THEN
        EXECUTE 'CREATE POLICY "Users can create their own script analyses" ON public.script_analyses FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'script_analyses' AND policyname = 'Users can update their own script analyses') THEN
        EXECUTE 'CREATE POLICY "Users can update their own script analyses" ON public.script_analyses FOR UPDATE USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'script_analyses' AND policyname = 'Users can delete their own script analyses') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own script analyses" ON public.script_analyses FOR DELETE USING (auth.uid() = user_id)';
    END IF;

    -- Coaching sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coaching_sessions' AND policyname = 'Users can view their own coaching sessions') THEN
        EXECUTE 'CREATE POLICY "Users can view their own coaching sessions" ON public.coaching_sessions FOR SELECT USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coaching_sessions' AND policyname = 'Users can create their own coaching sessions') THEN
        EXECUTE 'CREATE POLICY "Users can create their own coaching sessions" ON public.coaching_sessions FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coaching_sessions' AND policyname = 'Users can update their own coaching sessions') THEN
        EXECUTE 'CREATE POLICY "Users can update their own coaching sessions" ON public.coaching_sessions FOR UPDATE USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coaching_sessions' AND policyname = 'Users can delete their own coaching sessions') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own coaching sessions" ON public.coaching_sessions FOR DELETE USING (auth.uid() = user_id)';
    END IF;

    -- Video submissions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_submissions' AND policyname = 'Users can view their own video submissions') THEN
        EXECUTE 'CREATE POLICY "Users can view their own video submissions" ON public.video_submissions FOR SELECT USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_submissions' AND policyname = 'Users can create their own video submissions') THEN
        EXECUTE 'CREATE POLICY "Users can create their own video submissions" ON public.video_submissions FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_submissions' AND policyname = 'Users can update their own video submissions') THEN
        EXECUTE 'CREATE POLICY "Users can update their own video submissions" ON public.video_submissions FOR UPDATE USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_submissions' AND policyname = 'Users can delete their own video submissions') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own video submissions" ON public.video_submissions FOR DELETE USING (auth.uid() = user_id)';
    END IF;

    -- Profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)';
    END IF;
END $$;

-- Add audition_id to coaching_sessions and video_submissions for better organization
ALTER TABLE public.coaching_sessions ADD COLUMN IF NOT EXISTS audition_id UUID REFERENCES public.auditions(id) ON DELETE CASCADE;
ALTER TABLE public.video_submissions ADD COLUMN IF NOT EXISTS audition_id UUID REFERENCES public.auditions(id) ON DELETE CASCADE;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_auditions_updated_at ON public.auditions;
CREATE TRIGGER update_auditions_updated_at
    BEFORE UPDATE ON public.auditions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user audition statistics
CREATE OR REPLACE FUNCTION public.get_user_audition_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_auditions', COUNT(*),
        'preparation', COUNT(*) FILTER (WHERE status = 'preparation'),
        'submitted', COUNT(*) FILTER (WHERE status = 'submitted'),
        'callback', COUNT(*) FILTER (WHERE status = 'callback'),
        'booked', COUNT(*) FILTER (WHERE status = 'booked'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'success_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'booked')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END
    )
    INTO stats
    FROM public.auditions
    WHERE user_id = user_uuid;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
