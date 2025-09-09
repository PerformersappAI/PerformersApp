import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrialSignupRequest {
  full_name: string;
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { full_name, email, password }: TrialSignupRequest = await req.json();

    console.log('Processing trial signup for:', email);

    // Validate input
    if (!full_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Full name, email, and password are required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Store trial signup
    const { data: trialData, error: trialError } = await supabaseClient
      .from('trial_signups')
      .insert({
        full_name,
        email,
        status: 'pending'
      })
      .select()
      .single();

    if (trialError) {
      console.error('Trial signup error:', trialError);
      if (trialError.code === '23505') { // Unique constraint violation
        return new Response(
          JSON.stringify({ error: 'Email already registered for trial' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      throw trialError;
    }

    console.log('Trial signup created:', trialData.id);

    // Create user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        trial_signup_id: trialData.id
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      // If user already exists, that's okay for trial purposes
      if (authError.message?.includes('already registered')) {
        console.log('User already exists, continuing with trial signup');
      } else {
        throw authError;
      }
    }

    console.log('User created or exists:', authData?.user?.id);

    // Get the demo plan
    const { data: demoPlans, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('name', 'Demo')
      .limit(1);

    if (planError || !demoPlans || demoPlans.length === 0) {
      console.error('Demo plan not found:', planError);
      return new Response(
        JSON.stringify({ error: 'Demo plan not available' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const demoPlan = demoPlans[0];
    console.log('Demo plan found:', demoPlan.id);

    // If we have a user, create subscription
    if (authData?.user) {
      const { error: subscriptionError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: authData.user.id,
          plan_id: demoPlan.id,
          status: 'active',
          started_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
        // Don't fail the whole process if subscription creation fails
      } else {
        console.log('Demo subscription created for user:', authData.user.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trial signup successful',
        trial_id: trialData.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in handle-trial-signup:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);