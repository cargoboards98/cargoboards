import { createClient } from 'npm:@supabase/supabase-js@2';

const encoder = new TextEncoder();

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(',').map((part) => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0 || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((signature) => constantTimeEqual(signature, expected));
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!signingSecret || !supabaseUrl || !serviceRoleKey) return new Response('Webhook is not configured', { status: 503 });

  const payload = await request.text();
  const signature = request.headers.get('Stripe-Signature') ?? '';
  if (!await verifyStripeSignature(payload, signature, signingSecret)) {
    return new Response('Invalid Stripe signature', { status: 400 });
  }

  let processedEventId: string | null = null;
  let admin: ReturnType<typeof createClient> | null = null;
  try {
    const event = JSON.parse(payload);
    if (typeof event.id !== 'string' || typeof event.type !== 'string') {
      return new Response('Invalid Stripe event', { status: 400 });
    }
    const supportedEvent = event.type === 'checkout.session.completed'
      || event.type.startsWith('customer.subscription.')
      || event.type === 'invoice.payment_failed';
    if (!supportedEvent) {
      return new Response(JSON.stringify({ received: true, ignored: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    const object = event.data?.object;
    const customerId = typeof object?.customer === 'string' ? object.customer : object?.customer?.id;
    if (!customerId) return new Response('Missing Stripe customer', { status: 400 });

    admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { error: eventError } = await admin.from('stripe_webhook_events').insert({ event_id: event.id });
    if (eventError?.code === '23505') {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (eventError) throw eventError;
    processedEventId = event.id;

    if (event.type === 'checkout.session.completed' && object.mode === 'subscription') {
      const userId = object.client_reference_id ?? object.metadata?.user_id;
      if (userId) {
        const { error } = await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
        if (error) throw error;
      }
    }

    if (event.type.startsWith('customer.subscription.') || event.type === 'invoice.payment_failed') {
      const subscription = event.type === 'invoice.payment_failed' ? null : object;
      let status = subscription?.status;
      if (event.type === 'invoice.payment_failed') status = 'past_due';
      if (event.type === 'customer.subscription.deleted') status = 'canceled';
      const isPro = status === 'active' || status === 'trialing';
      const mappedStatus = isPro ? 'active' : status === 'past_due' || status === 'unpaid' ? 'past_due' : 'canceled';
      const { error } = await admin
        .from('profiles')
        .update({ is_pro: isPro, subscription_status: mappedStatus })
        .eq('stripe_customer_id', customerId);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Stripe webhook processing failed', error);
    if (processedEventId && admin) {
      const { error: cleanupError } = await admin.from('stripe_webhook_events').delete().eq('event_id', processedEventId);
      if (cleanupError) console.error('Stripe webhook event retry marker cleanup failed', cleanupError);
    }
    return new Response('Webhook processing failed', { status: 500 });
  }
});
