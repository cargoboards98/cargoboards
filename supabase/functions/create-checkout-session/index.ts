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
      .select('account_type, stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.account_type !== 'carrier') return jsonResponse({ error: 'Carrier account required' }, 403);
    if (profile.subscription_status === 'active') return jsonResponse({ error: 'Subscription is already active' }, 409);

    let customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      const customerBody = new URLSearchParams({
        email: user.email ?? '',
        'metadata[user_id]': user.id,
      });
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: customerBody,
      });
      const customer = await customerResponse.json();
      if (!customerResponse.ok) return jsonResponse({ error: customer.error?.message ?? 'Could not create Stripe customer' }, 502);
      customerId = customer.id;
      const { error: saveCustomerError } = await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
      if (saveCustomerError) throw saveCustomerError;
    }

    const checkoutBody = new URLSearchParams({
      mode: 'subscription',
      customer: customerId,
      'line_items[0][price_data][currency]': 'czk',
      'line_items[0][price_data][unit_amount]': '44900',
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': 'CargoBoard CZ PRO',
      'line_items[0][quantity]': '1',
      'client_reference_id': user.id,
      'metadata[user_id]': user.id,
      'subscription_data[metadata][user_id]': user.id,
      success_url: `${siteUrl.replace(/\/$/, '')}/#/subscription?success=1`,
      cancel_url: `${siteUrl.replace(/\/$/, '')}/#/subscription?canceled=1`,
    });
    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: checkoutBody,
    });
    const checkout = await checkoutResponse.json();
    if (!checkoutResponse.ok) return jsonResponse({ error: checkout.error?.message ?? 'Could not create Checkout session' }, 502);
    return jsonResponse({ url: checkout.url });
  } catch (error) {
    console.error('Checkout session creation failed', error);
    return jsonResponse({ error: 'Could not start subscription checkout' }, 500);
  }
});
