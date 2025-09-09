export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auditions: {
        Row: {
          actor_email: string | null
          audition_date: string | null
          audition_type: string | null
          casting_director: string | null
          casting_director_current_projects: string | null
          casting_director_preferences: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_website: string | null
          created_at: string
          id: string
          notes: string | null
          production_company: string | null
          reminder_enabled: boolean | null
          reminder_sent: boolean | null
          reminder_time: string | null
          script_id: string | null
          status: string | null
          submission_deadline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_email?: string | null
          audition_date?: string | null
          audition_type?: string | null
          casting_director?: string | null
          casting_director_current_projects?: string | null
          casting_director_preferences?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_website?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          production_company?: string | null
          reminder_enabled?: boolean | null
          reminder_sent?: boolean | null
          reminder_time?: string | null
          script_id?: string | null
          status?: string | null
          submission_deadline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_email?: string | null
          audition_date?: string | null
          audition_type?: string | null
          casting_director?: string | null
          casting_director_current_projects?: string | null
          casting_director_preferences?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_website?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          production_company?: string | null
          reminder_enabled?: boolean | null
          reminder_sent?: boolean | null
          reminder_time?: string | null
          script_id?: string | null
          status?: string | null
          submission_deadline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author_id: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          email: string | null
          highlights: string[]
          id: string
          name: string
          photo_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          email?: string | null
          highlights?: string[]
          id?: string
          name: string
          photo_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          email?: string | null
          highlights?: string[]
          id?: string
          name?: string
          photo_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      coaching_analyses: {
        Row: {
          coach_feedback: string | null
          coaching_score: number | null
          created_at: string
          id: string
          improvement_strategy: string | null
          performance_id: string
          practice_recommendations: string[] | null
          technical_assessment: Json
          user_id: string
        }
        Insert: {
          coach_feedback?: string | null
          coaching_score?: number | null
          created_at?: string
          id?: string
          improvement_strategy?: string | null
          performance_id: string
          practice_recommendations?: string[] | null
          technical_assessment?: Json
          user_id: string
        }
        Update: {
          coach_feedback?: string | null
          coaching_score?: number | null
          created_at?: string
          id?: string
          improvement_strategy?: string | null
          performance_id?: string
          practice_recommendations?: string[] | null
          technical_assessment?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_analyses_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "magic_performances"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          analysis_id: string
          audition_id: string | null
          chat_history: Json
          created_at: string
          id: string
          session_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          audition_id?: string | null
          chat_history?: Json
          created_at?: string
          id?: string
          session_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          audition_id?: string | null
          chat_history?: Json
          created_at?: string
          id?: string
          session_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "script_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_sessions_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["id"]
          },
        ]
      }
      headshot_analyses: {
        Row: {
          created_at: string
          detailed_feedback: Json
          headshot_type: string
          id: string
          image_url: string
          improvement_suggestions: string[]
          industry_score: number
          overall_score: number
          professional_score: number
          strengths: string[]
          technical_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detailed_feedback?: Json
          headshot_type: string
          id?: string
          image_url: string
          improvement_suggestions?: string[]
          industry_score: number
          overall_score: number
          professional_score: number
          strengths?: string[]
          technical_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detailed_feedback?: Json
          headshot_type?: string
          id?: string
          image_url?: string
          improvement_suggestions?: string[]
          industry_score?: number
          overall_score?: number
          professional_score?: number
          strengths?: string[]
          technical_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      headshot_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          topic: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          topic: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      headshot_rulesets: {
        Row: {
          checklists: Json
          created_at: string
          enums: Json
          evaluation_io: Json
          id: string
          is_active: boolean
          metadata: Json
          persona_tracks: Json
          platform_specs: Json
          rules_global: Json
          scoring: Json
          style_tracks: Json
          ui_copy_snippets: Json
          updated_at: string
          version: string
        }
        Insert: {
          checklists?: Json
          created_at?: string
          enums?: Json
          evaluation_io?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          persona_tracks?: Json
          platform_specs?: Json
          rules_global?: Json
          scoring?: Json
          style_tracks?: Json
          ui_copy_snippets?: Json
          updated_at?: string
          version: string
        }
        Update: {
          checklists?: Json
          created_at?: string
          enums?: Json
          evaluation_io?: Json
          id?: string
          is_active?: boolean
          metadata?: Json
          persona_tracks?: Json
          platform_specs?: Json
          rules_global?: Json
          scoring?: Json
          style_tracks?: Json
          ui_copy_snippets?: Json
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      magic_performances: {
        Row: {
          created_at: string
          description: string | null
          id: string
          magic_type: string
          skill_level: string
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          youtube_reference_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          magic_type: string
          skill_level: string
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          youtube_reference_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          magic_type?: string
          skill_level?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          youtube_reference_url?: string | null
        }
        Relationships: []
      }
      photographers: {
        Row: {
          active: boolean | null
          bio: string | null
          business_name: string | null
          city: string
          country: string
          created_at: string
          email: string
          id: string
          instagram: string | null
          name: string
          phone: string | null
          portfolio_url: string | null
          price_range: string | null
          rating: number | null
          specialties: string[] | null
          state: string
          total_reviews: number | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          business_name?: string | null
          city: string
          country?: string
          created_at?: string
          email: string
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
          portfolio_url?: string | null
          price_range?: string | null
          rating?: number | null
          specialties?: string[] | null
          state: string
          total_reviews?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          business_name?: string | null
          city?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          portfolio_url?: string | null
          price_range?: string | null
          rating?: number | null
          specialties?: string[] | null
          state?: string
          total_reviews?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acting_methods: string[] | null
          agency_url: string | null
          agent_commercial_email: string | null
          agent_commercial_name: string | null
          agent_commercial_phone: string | null
          agent_theatrical_email: string | null
          agent_theatrical_name: string | null
          agent_theatrical_phone: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          demo_video_title_1: string | null
          demo_video_title_2: string | null
          demo_video_url_1: string | null
          demo_video_url_2: string | null
          experience_level: string | null
          full_name: string | null
          headshot_url_1: string | null
          headshot_url_2: string | null
          headshot_url_3: string | null
          id: string
          imdb_url: string | null
          instagram_url: string | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          resume_pdf_url: string | null
          talent_email: string | null
          talent_phone: string | null
          updated_at: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          acting_methods?: string[] | null
          agency_url?: string | null
          agent_commercial_email?: string | null
          agent_commercial_name?: string | null
          agent_commercial_phone?: string | null
          agent_theatrical_email?: string | null
          agent_theatrical_name?: string | null
          agent_theatrical_phone?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          demo_video_title_1?: string | null
          demo_video_title_2?: string | null
          demo_video_url_1?: string | null
          demo_video_url_2?: string | null
          experience_level?: string | null
          full_name?: string | null
          headshot_url_1?: string | null
          headshot_url_2?: string | null
          headshot_url_3?: string | null
          id: string
          imdb_url?: string | null
          instagram_url?: string | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          resume_pdf_url?: string | null
          talent_email?: string | null
          talent_phone?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          acting_methods?: string[] | null
          agency_url?: string | null
          agent_commercial_email?: string | null
          agent_commercial_name?: string | null
          agent_commercial_phone?: string | null
          agent_theatrical_email?: string | null
          agent_theatrical_name?: string | null
          agent_theatrical_phone?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          demo_video_title_1?: string | null
          demo_video_title_2?: string | null
          demo_video_url_1?: string | null
          demo_video_url_2?: string | null
          experience_level?: string | null
          full_name?: string | null
          headshot_url_1?: string | null
          headshot_url_2?: string | null
          headshot_url_3?: string | null
          id?: string
          imdb_url?: string | null
          instagram_url?: string | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          resume_pdf_url?: string | null
          talent_email?: string | null
          talent_phone?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      script_analyses: {
        Row: {
          acting_method: string
          analysis_data: Json
          created_at: string
          emotional_beats: Json | null
          id: string
          objectives: string[] | null
          obstacles: string[] | null
          script_id: string
          selected_character: string
          tactics: string[] | null
          user_id: string
        }
        Insert: {
          acting_method: string
          analysis_data: Json
          created_at?: string
          emotional_beats?: Json | null
          id?: string
          objectives?: string[] | null
          obstacles?: string[] | null
          script_id: string
          selected_character: string
          tactics?: string[] | null
          user_id: string
        }
        Update: {
          acting_method?: string
          analysis_data?: Json
          created_at?: string
          emotional_beats?: Json | null
          id?: string
          objectives?: string[] | null
          obstacles?: string[] | null
          script_id?: string
          selected_character?: string
          tactics?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_analyses_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          characters: string[] | null
          content: string
          created_at: string
          deleted_at: string | null
          file_type: string | null
          file_url: string | null
          genre: string | null
          id: string
          scene_summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          characters?: string[] | null
          content: string
          created_at?: string
          deleted_at?: string | null
          file_type?: string | null
          file_url?: string | null
          genre?: string | null
          id?: string
          scene_summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          characters?: string[] | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          file_type?: string | null
          file_url?: string | null
          genre?: string | null
          id?: string
          scene_summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          features: Json
          id: string
          limits: Json
          name: string
          paypal_plan_id: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          limits?: Json
          name: string
          paypal_plan_id?: string | null
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          limits?: Json
          name?: string
          paypal_plan_id?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["support_sender_role"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["support_sender_role"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["support_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          content: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          rating: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          content: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          rating?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          content?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          rating?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trial_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      tts_cache_items: {
        Row: {
          character: string
          created_at: string
          dialogue_index: number
          duration_ms: number | null
          hash: string
          id: string
          provider: string
          script_id: string
          speed: number
          storage_path: string
          user_id: string
          voice_id: string
        }
        Insert: {
          character: string
          created_at?: string
          dialogue_index: number
          duration_ms?: number | null
          hash: string
          id?: string
          provider?: string
          script_id: string
          speed?: number
          storage_path: string
          user_id: string
          voice_id: string
        }
        Update: {
          character?: string
          created_at?: string
          dialogue_index?: number
          duration_ms?: number | null
          hash?: string
          id?: string
          provider?: string
          script_id?: string
          speed?: number
          storage_path?: string
          user_id?: string
          voice_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          paypal_subscription_id: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          paypal_subscription_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          paypal_subscription_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          ai_messages_used: number
          created_at: string
          id: string
          last_reset: string
          script_analyses_used: number
          subscription_id: string
          updated_at: string
          user_id: string
          video_verifications_used: number
        }
        Insert: {
          ai_messages_used?: number
          created_at?: string
          id?: string
          last_reset?: string
          script_analyses_used?: number
          subscription_id: string
          updated_at?: string
          user_id: string
          video_verifications_used?: number
        }
        Update: {
          ai_messages_used?: number
          created_at?: string
          id?: string
          last_reset?: string
          script_analyses_used?: number
          subscription_id?: string
          updated_at?: string
          user_id?: string
          video_verifications_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_submissions: {
        Row: {
          ai_analysis: Json | null
          audition_id: string | null
          coaching_session_id: string
          created_at: string
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_notes: string | null
          evaluation_score: number | null
          evaluation_status: string | null
          feedback_data: Json | null
          id: string
          storage_file_path: string | null
          updated_at: string | null
          user_id: string
          video_title: string | null
          video_url: string
        }
        Insert: {
          ai_analysis?: Json | null
          audition_id?: string | null
          coaching_session_id: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          evaluation_score?: number | null
          evaluation_status?: string | null
          feedback_data?: Json | null
          id?: string
          storage_file_path?: string | null
          updated_at?: string | null
          user_id: string
          video_title?: string | null
          video_url: string
        }
        Update: {
          ai_analysis?: Json | null
          audition_id?: string | null
          coaching_session_id?: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          evaluation_score?: number | null
          evaluation_status?: string | null
          feedback_data?: Json | null
          id?: string
          storage_file_path?: string | null
          updated_at?: string | null
          user_id?: string
          video_title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_coaching_session_id_fkey"
            columns: ["coaching_session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_photographers: {
        Args: { limit_count?: number }
        Returns: {
          bio: string
          business_name: string
          city: string
          country: string
          id: string
          instagram: string
          name: string
          portfolio_url: string
          price_range: string
          rating: number
          specialties: string[]
          state: string
          total_reviews: number
          verified: boolean
          website: string
        }[]
      }
      get_public_profile: {
        Args: { p_username: string }
        Returns: {
          acting_methods: string[]
          avatar_url: string
          bio: string
          demo_video_title_1: string
          demo_video_title_2: string
          demo_video_url_1: string
          demo_video_url_2: string
          experience_level: string
          full_name: string
          headshot_url_1: string
          headshot_url_2: string
          headshot_url_3: string
          imdb_url: string
          instagram_url: string
          username: string
          website_url: string
        }[]
      }
      get_public_subscription_plans: {
        Args: Record<PropertyKey, never>
        Returns: {
          currency: string
          features: Json
          id: string
          name: string
          price: number
        }[]
      }
      get_user_audition_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_audition_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      soft_delete_script: {
        Args: { p_script_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      blog_status: "draft" | "published"
      support_sender_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      blog_status: ["draft", "published"],
      support_sender_role: ["user", "admin"],
    },
  },
} as const
