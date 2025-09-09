
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  acting_methods TEXT[] DEFAULT '{}',
  experience_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create scripts table for uploaded scripts
CREATE TABLE public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  characters TEXT[] DEFAULT '{}',
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create script_analyses table for AI analysis results
CREATE TABLE public.script_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES public.scripts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  selected_character TEXT NOT NULL,
  acting_method TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  objectives TEXT[],
  obstacles TEXT[],
  tactics TEXT[],
  emotional_beats JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coaching_sessions table for guidance sessions
CREATE TABLE public.coaching_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.script_analyses NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  chat_history JSONB NOT NULL DEFAULT '[]',
  session_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_submissions table for performance videos
CREATE TABLE public.video_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coaching_session_id UUID REFERENCES public.coaching_sessions NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  video_url TEXT NOT NULL,
  video_title TEXT,
  feedback_data JSONB,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for scripts
CREATE POLICY "Users can view their own scripts" ON public.scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scripts" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scripts" ON public.scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scripts" ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for script_analyses
CREATE POLICY "Users can view their own analyses" ON public.script_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analyses" ON public.script_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses" ON public.script_analyses FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for coaching_sessions
CREATE POLICY "Users can view their own sessions" ON public.coaching_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.coaching_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.coaching_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for video_submissions
CREATE POLICY "Users can view their own videos" ON public.video_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own videos" ON public.video_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON public.video_submissions FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create storage bucket for script files and videos
INSERT INTO storage.buckets (id, name, public) VALUES ('scripts', 'scripts', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Create storage policies
CREATE POLICY "Users can upload their own scripts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scripts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own scripts" ON storage.objects FOR SELECT USING (bucket_id = 'scripts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
