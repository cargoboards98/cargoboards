import { CITIES } from '@/data';
import type { Order, VehicleType } from '@/types';

export interface MarketplaceOrderRow {
  id: string;
  owner_id: string;
  title: string;
  from_city: string;
  to_city: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  price_czk: number;
  distance_km: number;
  vehicle: VehicleType;
  description: string;
  claimed_by: string | null;
  status: 'open' | 'completed' | 'cancelled';
  created_at: string;
}

export function mapMarketplaceOrder(row: MarketplaceOrderRow): Order {
  return {
    id: row.id,
    title: row.title,
    from: row.from_city,
    to: row.to_city,
    fromCoords: { name: row.from_city, lat: Number(row.from_lat), lng: Number(row.from_lng) },
    toCoords: { name: row.to_city, lat: Number(row.to_lat), lng: Number(row.to_lng) },
    price: Number(row.price_czk),
    distance: Number(row.distance_km),
    vehicle: row.vehicle,
    user: 'Poptávající',
    rating: 0,
    reviews: 0,
    phone: '',
    description: row.description,
    createdAt: new Date(row.created_at).getTime(),
    ownerId: row.owner_id,
    claimedBy: row.claimed_by,
    status: row.status,
  };
}

export function toOrderPayload(order: Order) {
  const origin = CITIES[order.from];
  const destination = CITIES[order.to];
  if (!origin || !destination) throw new Error('Zvolená trasa neobsahuje podporovaná města.');
  return {
    order_title: order.title,
    origin_city: order.from,
    destination_city: order.to,
    origin_lat: origin.lat,
    origin_lng: origin.lng,
    destination_lat: destination.lat,
    destination_lng: destination.lng,
    offered_price_czk: order.price,
    route_distance_km: order.distance,
    required_vehicle: order.vehicle,
    order_description: order.description,
    contact_phone: order.phone,
    contact_email: order.email ?? '',
  };
}
