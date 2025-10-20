import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing Apple callback...');
    
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
      console.error('State mismatch:', { cookieState, postedState: state });
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter - cookie mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cookie and posted state match');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify state exists in database
    console.log('Verifying state in database:', state);
    const { data: stateData, error: stateError } = await supabaseClient
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle();

    if (stateError || !stateData) {
      console.error('State not found in DB:', stateError);
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter - not found in database' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('State validated successfully');
    
    // Get app origin for redirect
    const appOrigin = stateData.app_origin || Deno.env.get('SUPABASE_URL') || '';
    console.log('App origin for redirect:', appOrigin);

    // Delete used state
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Check if user exists by email using listUsers
    const { data: { users }, error: getUserError } = await supabaseClient.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userByEmail = users?.find(u => u.email === email);
    let authUser = userByEmail || null;

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
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      authUser = newUser.user;
      console.log('User created successfully');
    } else {
      console.log('Existing user found');
    }

    // Generate magic link for session
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email!
    });

    if (linkError || !linkData) {
      console.error('Error generating link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Magic link generated successfully');

    // Extract token from magic link
    const magicLinkUrl = new URL(linkData.properties.action_link);
    const token = magicLinkUrl.searchParams.get('token');
    const type = magicLinkUrl.searchParams.get('type');

    // Use the app origin stored during init for reliable redirect
    // Determine if we need to use /auth/apple/callback (production) or /auth/callback/apple (fallback)
    let callbackPath = '/auth/callback/apple';
    if (appOrigin.includes('goldsainte.ai') || appOrigin.includes('lovable.app')) {
      callbackPath = '/auth/apple/callback';
    }
    
    const redirectUrl = `${appOrigin}${callbackPath}?token=${token}&type=${type}`;
    
    console.log('Redirecting to:', redirectUrl);
    
    // Clear the cookie by setting it expired, with proper domain for production
    const cookieDomain = appOrigin.includes('goldsainte.ai') ? '; Domain=goldsainte.ai' : '';
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': `apple_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0${cookieDomain}`,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error in apple-signin-callback:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
