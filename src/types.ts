export type VehicleType = 'Combi' | 'Van' | 'Trailer';

export interface City {
  name: string;
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  title: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number; name?: string };
  toCoords: { lat: number; lng: number; name?: string };
  price: number; // CZK
  distance: number; // km
  vehicle: VehicleType;
  user: string;
  rating: number;
  reviews: number;
  phone: string;
  email?: string;
  ownerId?: string;
  claimedBy?: string | null;
  status?: 'open' | 'completed' | 'cancelled';
  description: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  author: 'me' | 'customer';
  text: string;
  ts: number;
}

export type AccountMode = 'PRO' | 'FREE';

export type AccountRole = 'carrier' | 'shipper';
