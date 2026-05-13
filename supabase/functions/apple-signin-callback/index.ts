// Apple Sign-In Callback Handler v4 - Complete rewrite to force deployment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  "Vary": "Origin",
};
}

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    // Replace URL-safe characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    throw new Error('Failed to decode ID token');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    console.log('Processing Apple callback v4...');
    
    // Handle form POST from Apple or JSON from our app
    let code, state, id_token, user;
    
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Form POST from Apple
        console.log('Handling form POST from Apple');
        const formData = await req.formData();
        code = formData.get('code') as string;
        state = formData.get('state') as string;
        id_token = formData.get('id_token') as string;
        const userJson = formData.get('user');
        user = userJson ? JSON.parse(userJson as string) : null;
      } else {
        // JSON from our app
        console.log('Handling JSON request');
        const body = await req.json();
        code = body.code;
        state = body.state;
        id_token = body.id_token;
        user = body.user;
      }
    } else {
      throw new Error('Invalid request method');
    }

    console.log('Received data:', { hasCode: !!code, hasState: !!state, hasIdToken: !!id_token });

    // Extract cookie state
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieState = cookieHeader.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('apple_state='))
      ?.split('=')[1];

    console.log('Cookie state:', cookieState ? 'present' : 'missing');
    console.log('Posted state:', state ? 'present' : 'missing');

    // Validate: cookie state must match posted state
    if (!cookieState || !state || cookieState !== state) {
      console.error('State mismatch or missing state');
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cookie and posted state match');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify state in database
    console.log('Verifying state in database:', state);
    const { data: stateData, error: stateError } = await supabaseClient
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (stateError || !stateData) {
      console.error('Invalid or expired state:', stateError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired state' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('State validated successfully');

    // Extract app origin for redirect
    const appOrigin = stateData.app_origin || 'https://goldsainte.ai';
    console.log('App origin for redirect:', appOrigin);

    // Clean up state
    await supabaseClient
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Decode ID token to get user info
    const idTokenPayload = decodeJwt(id_token);
    console.log('ID token decoded:', { sub: idTokenPayload.sub, email: idTokenPayload.email });
    
    const appleUserId = idTokenPayload.sub;
    const email = idTokenPayload.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email not provided by Apple' }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Parse user data if provided (only on first sign-in)
    let firstName, lastName;
    if (user) {
      try {
        const userData = typeof user === 'string' ? JSON.parse(user) : user;
        firstName = userData.name?.firstName;
        lastName = userData.name?.lastName;
        console.log('User data parsed:', { firstName, lastName });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check if user exists by email - CORRECTED METHOD
    console.log('Checking for existing user with email:', email);
    const { data: usersList, error: getUserError } = await supabaseClient.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = usersList.users?.find(u => u.email === email);
    console.log('Existing user found:', !!existingUser);

    let authUser = existingUser || null;

    if (!authUser) {
      console.log('Creating new user...');
      
      // Create new user
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          provider: 'apple',
          apple_user_id: appleUserId,
          first_name: firstName,
          last_name: lastName,
          full_name: firstName && lastName ? `${firstName} ${lastName}` : undefined
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      authUser = newUser.user;
      console.log('User created successfully');
    } else {
      console.log('Existing user found, proceeding with login');
    }

    // Generate magic link for session
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email!
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    console.log('Magic link generated successfully');

    // Extract tokens from magic link
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');

    if (!token || !type) {
      console.error('Failed to extract token from magic link');
      return new Response(
        JSON.stringify({ error: 'Failed to extract session token' }),
        { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Construct callback URL with token
    const callbackUrl = `${appOrigin}/auth/callback/apple?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
    
    console.log('Redirecting to app with session token');

    // Clear the apple_state cookie and redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders(req),
        'Location': callbackUrl,
        'Set-Cookie': 'apple_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None'
      }
    });

  } catch (error: any) {
    console.error('Error in apple-signin-callback:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});