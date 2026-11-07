import { createClient } from '@supabase/supabase-js';
import type { Order } from '@/types';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type FreightOrderRow = {
  id: string;
  title: string;
  from_city: string;
  to_city: string;
  from_coords: Json;
  to_coords: Json;
  price: number;
  distance: number;
  vehicle: string;
  user_name: string;
  rating: number;
  reviews: number;
  phone: string;
  description: string;
  created_at: number;
};

type Database = {
  public: {
    Tables: {
      freight_orders: {
        Row: FreightOrderRow;
        Insert: FreightOrderRow;
        Update: Partial<FreightOrderRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigStatus = !supabaseUrl && !supabaseKey
  ? 'missing'
  : !supabaseUrl || !supabaseKey
    ? 'incomplete'
    : 'configured';

const supabase = supabaseConfigStatus === 'configured'
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = supabase !== null;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Telefonní registrace vyžaduje nakonfigurovaný Supabase projekt.');
  }
  return supabase;
}

export async function getVerifiedPhone(): Promise<string | null> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  const user = data.session?.user;
  return user?.phone_confirmed_at && user.phone ? user.phone : null;
}

export function subscribeToPhoneAuthChanges(onChange: (phone: string | null) => void): () => void {
  const client = requireSupabase();
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    onChange(user?.phone_confirmed_at && user.phone ? user.phone : null);
  });

  return () => subscription.unsubscribe();
}

export async function sendPhoneVerificationCode(phone: string, shouldCreateUser: boolean): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    phone,
    options: { channel: 'sms', shouldCreateUser },
  });

  if (error) throw error;
}

export async function verifyPhoneCode(phone: string, token: string): Promise<void> {
  const client = requireSupabase();
  const { data, error } = await client.auth.verifyOtp({ phone, token, type: 'sms' });

  if (error) throw error;
  if (!data.session || !data.user?.phone_confirmed_at) {
    throw new Error('Telefonní číslo se nepodařilo ověřit. Zkuste to prosím znovu.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJson(value: unknown): value is Json {
  return value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || (Array.isArray(value) && value.every(isJson))
    || (isRecord(value) && Object.values(value).every((item) => item === undefined || isJson(item)));
}

function isFreightOrderRow(value: unknown): value is FreightOrderRow {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.from_city === 'string'
    && typeof value.to_city === 'string'
    && isJson(value.from_coords)
    && isJson(value.to_coords)
    && typeof value.price === 'number'
    && typeof value.distance === 'number'
    && typeof value.vehicle === 'string'
    && typeof value.user_name === 'string'
    && typeof value.rating === 'number'
    && typeof value.reviews === 'number'
    && typeof value.phone === 'string'
    && typeof value.description === 'string'
    && typeof value.created_at === 'number';
}

function toCoordinates(value: Json, city: string): Order['fromCoords'] {
  if (!isRecord(value) || typeof value.lat !== 'number' || typeof value.lng !== 'number') {
    throw new Error(`Neplatné souřadnice zakázky pro město ${city}.`);
  }

  return {
    lat: value.lat,
    lng: value.lng,
    name: typeof value.name === 'string' ? value.name : city,
  };
}

function toOrder(value: unknown): Order {
  if (!isFreightOrderRow(value)) {
    throw new Error('Supabase vrátil zakázku v neplatném formátu.');
  }
  const row = value;

  if (row.vehicle !== 'Combi' && row.vehicle !== 'Van' && row.vehicle !== 'Trailer') {
    throw new Error(`Neznámý typ vozidla u zakázky ${row.id}.`);
  }

  return {
    id: row.id,
    title: row.title,
    from: row.from_city,
    to: row.to_city,
    fromCoords: toCoordinates(row.from_coords, row.from_city),
    toCoords: toCoordinates(row.to_coords, row.to_city),
    price: row.price,
    distance: row.distance,
    vehicle: row.vehicle,
    user: row.user_name,
    rating: row.rating,
    reviews: row.reviews,
    phone: row.phone,
    description: row.description,
    createdAt: row.created_at,
  };
}

function toRow(order: Order): FreightOrderRow {
  return {
    id: order.id,
    title: order.title,
    from_city: order.from,
    to_city: order.to,
    from_coords: order.fromCoords,
    to_coords: order.toCoords,
    price: order.price,
    distance: order.distance,
    vehicle: order.vehicle,
    user_name: order.user,
    rating: order.rating,
    reviews: order.reviews,
    phone: order.phone,
    description: order.description,
    created_at: order.createdAt,
  };
}

export async function loadSupabaseOrders(): Promise<Order[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('freight_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(toOrder);
}

export async function insertSupabaseOrder(order: Order): Promise<Order | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('freight_orders')
    .insert(toRow(order))
    .select()
    .single();

  if (error) throw error;
  return toOrder(data);
}

export async function updateSupabaseOrderDistance(orderId: string, distance: number): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('freight_orders')
    .update({ distance })
    .eq('id', orderId);

  if (error) throw error;
}
