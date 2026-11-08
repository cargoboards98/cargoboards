import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.cargoboards.eu',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return jsonResponse({ error: 'Přihlášení je vyžadováno.' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Neplatný požadavek.' }, 400);
    }
    payload = body as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Neplatný požadavek.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Missing Supabase environment configuration for admin-users function.');
    return jsonResponse({ error: 'Správa uživatelů není nakonfigurována.' }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);
  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Přihlášení vypršelo. Přihlaste se znovu.' }, 401);
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Unable to verify admin role:', profileError.message);
    return jsonResponse({ error: 'Nepodařilo se ověřit oprávnění správce.' }, 500);
  }
  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ error: 'K této akci nemáte oprávnění.' }, 403);
  }

  if (payload.action === 'list') {
    const page = typeof payload.page === 'number' && Number.isInteger(payload.page)
      ? Math.max(1, payload.page)
      : 1;
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 50 });
    if (error) {
      console.error('Unable to list users:', error.message);
      return jsonResponse({ error: 'Seznam uživatelů se nepodařilo načíst.' }, 500);
    }

    const userIds = data.users.map((user) => user.id);
    const { data: profiles, error: profilesError } = userIds.length
      ? await adminClient
        .from('profiles')
        .select('id, first_name, last_name, phone, account_type, ico, role')
        .in('id', userIds)
      : { data: [], error: null };
    if (profilesError) {
      console.error('Unable to load user profiles:', profilesError.message);
      return jsonResponse({ error: 'Profily uživatelů se nepodařilo načíst.' }, 500);
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return jsonResponse({
      users: data.users.map((user) => ({
        id: user.id,
        email: user.email ?? '',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        bannedUntil: user.banned_until,
        profile: profilesById.get(user.id) ?? null,
      })),
      page,
      hasMore: data.users.length === 50,
    });
  }

  if (
    payload.action !== 'ban'
    && payload.action !== 'unban'
    && payload.action !== 'delete'
  ) {
    return jsonResponse({ error: 'Neznámá akce.' }, 400);
  }

  if (
    typeof payload.userId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId)
  ) {
    return jsonResponse({ error: 'Neplatný uživatel.' }, 400);
  }
  if (payload.userId === callerData.user.id) {
    return jsonResponse({ error: 'Svůj vlastní účet tímto způsobem spravovat nelze.' }, 400);
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', payload.userId)
    .maybeSingle();
  if (targetProfileError) {
    console.error('Unable to verify target account:', targetProfileError.message);
    return jsonResponse({ error: 'Cílový účet se nepodařilo ověřit.' }, 500);
  }

  const { data: targetUserData, error: targetUserError } = await adminClient.auth.admin.getUserById(payload.userId);
  if (targetUserError || !targetUserData.user) {
    return jsonResponse({ error: 'Cílový účet nebyl nalezen.' }, 404);
  }
  if (
    targetProfile?.role === 'admin'
    || targetUserData.user.email?.toLowerCase() === 'cargoboards@gmail.com'
  ) {
    return jsonResponse({ error: 'Účty správců nelze mazat ani blokovat.' }, 403);
  }

  if (payload.action === 'delete') {
    const { error } = await adminClient.auth.admin.deleteUser(payload.userId);
    if (error) {
      console.error('Unable to delete user:', error.message);
      return jsonResponse({ error: 'Účet se nepodařilo smazat.' }, 500);
    }
    return jsonResponse({ success: true });
  }

  const { error } = await adminClient.auth.admin.updateUserById(payload.userId, {
    ban_duration: payload.action === 'ban' ? '876000h' : 'none',
  });
  if (error) {
    console.error('Unable to update user ban status:', error.message);
    return jsonResponse({ error: 'Stav blokace se nepodařilo změnit.' }, 500);
  }

  return jsonResponse({ success: true });
});
