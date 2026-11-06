import type { Order } from '@/types';

export function formatCZK(n: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);
}

export function formatKm(n: number): string {
  return `${n.toFixed(0)} km`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'právě teď';
  if (min < 60) return `před ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `před ${hr} h`;
  return `před ${Math.floor(hr / 24)} d`;
}

export function maskPhone(phone: string): string {
  const i = phone.indexOf(' ');
  return i >= 0 ? `${phone.slice(0, i + 1)} *** ***` : '+420 *** *** ***';
}

export const VEHICLE_STYLES: Record<Order['vehicle'], { color: string; bg: string; ring: string }> = {
  Combi: { color: 'text-accent-400', bg: 'bg-accent-500/15', ring: 'ring-accent-500/30' },
  Van: { color: 'text-success-400', bg: 'bg-success-500/15', ring: 'ring-success-500/30' },
  Trailer: { color: 'text-warning-400', bg: 'bg-warning-500/15', ring: 'ring-warning-500/30' },
};
