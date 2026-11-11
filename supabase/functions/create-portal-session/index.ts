import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? 'https://www.cargoboards.eu',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Authentication required' }, 401);
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const siteUrl = Deno.env.get('SITE_URL');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!stripeSecret || !siteUrl || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Payment service is not configured' }, 503);
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: 'Invalid authentication' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('account_type, stripe_customer_id')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.account_type !== 'carrier') return jsonResponse({ error: 'Carrier account required' }, 403);
    if (!profile.stripe_customer_id) return jsonResponse({ error: 'No Stripe customer is linked to this account' }, 404);

    const portalBody = new URLSearchParams({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl.replace(/\/$/, '')}/#/subscription`,
    });
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: portalBody,
    });
    const portal = await portalResponse.json();
    if (!portalResponse.ok) return jsonResponse({ error: portal.error?.message ?? 'Could not create Customer Portal session' }, 502);
    return jsonResponse({ url: portal.url });
  } catch (error) {
    console.error('Customer Portal session creation failed', error);
    return jsonResponse({ error: 'Could not open subscription management' }, 500);
  }
});
