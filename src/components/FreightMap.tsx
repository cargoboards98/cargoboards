import { useMemo } from 'react';
import type { Order } from '@/types';
import { CITIES } from '@/data';
import { project, MAP_W, MAP_H } from '@/lib/map';
import { MapPin } from 'lucide-react';

const CITY_LIST = Object.values(CITIES);

// Decorative road network: pairs of connected cities drawn faintly under the route.
const ROADS: [string, string][] = [
  ['Kdyně', 'Domažlice'],
  ['Kdyně', 'Klatovy'],
  ['Domažlice', 'Plzeň'],
  ['Klatovy', 'Plzeň'],
  ['Plzeň', 'Rokycany'],
  ['Rokycany', 'Beroun'],
  ['Beroun', 'Praha'],
  ['Plzeň', 'Stod'],
  ['Stod', 'Domažlice'],
  ['Plzeň', 'Praha'],
];

export function FreightMap({ order, orders }: { order: Order | null; orders: Order[] }) {
  const pts = useMemo(() => {
    return order
      ? {
          a: project(order.fromCoords.lat, order.fromCoords.lng),
          b: project(order.toCoords.lat, order.toCoords.lng),
        }
      : null;
  }, [order]);

  // Active route via a gentle curved path (quadratic bezier through the midpoint, offset).
  const routePath = useMemo(() => {
    if (!pts) return '';
    const { a, b } = pts;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bow = Math.min(60, len * 0.18);
    const cx = mx + nx * bow;
    const cy = my + ny * bow;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }, [pts]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-950">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="Mapa nákladní dopravy západních Čech"
      >
        <defs>
          <radialGradient id="bgGlow" cx="38%" cy="55%" r="70%">
            <stop offset="0%" stopColor="#16243f" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="url(#bgGlow)" />

        {/* subtle lat/long grid */}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = (MAP_W / 7) * (i + 0.5);
          const y = (MAP_H / 6) * (i % 6);
          return (
            <g key={i}>
              <line x1={x} y1={0} x2={x} y2={MAP_H} stroke="#1e293b" strokeWidth={0.5} opacity={0.5} />
              {y > 0 && <line x1={0} y1={y} x2={MAP_W} y2={y} stroke="#1e293b" strokeWidth={0.5} opacity={0.5} />}
            </g>
          );
        })}

        {/* faint road network */}
        {ROADS.map(([c1, c2], i) => {
          const a = project(CITIES[c1].lat, CITIES[c1].lng);
          const b = project(CITIES[c2].lat, CITIES[c2].lng);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#334155"
              strokeWidth={1.4}
              strokeDasharray="3 5"
              opacity={0.55}
            />
          );
        })}

        {/* other-order pins shown muted */}
        {orders
          .filter((o) => !order || o.id !== order.id)
          .map((o) => {
            const p = project(o.fromCoords.lat, o.fromCoords.lng);
            return <circle key={o.id} cx={p.x} cy={p.y} r={4} fill="#475569" stroke="#0f172a" strokeWidth={1.5} />;
          })}

        {/* active route */}
        {pts && (
          <>
            <path d={routePath} fill="none" stroke="url(#routeGrad)" strokeWidth={7} strokeLinecap="round" opacity={0.35} filter="url(#soft)" />
            <path d={routePath} fill="none" stroke="url(#routeGrad)" strokeWidth={3} strokeLinecap="round" />
            <path
              d={routePath}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="2 22"
              className="animate-dash-flow"
              opacity={0.9}
            />
            {/* pulse rings */}
            <circle cx={pts.a.x} cy={pts.a.y} r={10} fill="#3b82f6" className="origin-center animate-pulse-ring" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} opacity={0.5} />
            <circle cx={pts.b.x} cy={pts.b.y} r={10} fill="#22c55e" className="origin-center animate-pulse-ring" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} opacity={0.5} />
          </>
        )}

        {/* city nodes + labels */}
        {CITY_LIST.map((c) => {
          const p = project(c.lat, c.lng);
          const isOrigin = order && order.from === c.name;
          const isDest = order && order.to === c.name;
          const active = isOrigin || isDest;
          return (
            <g key={c.name} className="transition-opacity">
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 7 : 4}
                fill={isOrigin ? '#3b82f6' : isDest ? '#22c55e' : '#64748b'}
                stroke="#0f172a"
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y - (active ? 14 : 10)}
                textAnchor="middle"
                fontSize={active ? 15 : 11}
                fontWeight={active ? 700 : 500}
                fill={active ? '#e2e8f0' : '#94a3b8'}
                className="select-none"
              >
                {c.name}
              </text>
            </g>
          );
        })}
      </svg>

      {!order && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink-900/80 px-4 py-2 text-xs text-ink-400 ring-1 ring-ink-700/60 backdrop-blur">
          Vyberte zakázku pro zobrazení trasy
        </div>
      )}

      {order && (
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-ink-900/85 px-3 py-2 text-xs ring-1 ring-ink-700/60 backdrop-blur animate-fade-in">
          <MapPin size={14} className="text-accent-400" />
          <span className="font-semibold text-ink-200">{order.from}</span>
          <span className="text-ink-500">→</span>
          <span className="font-semibold text-ink-200">{order.to}</span>
          <span className="ml-2 text-ink-500">{order.distance} km</span>
        </div>
      )}
    </div>
  );
}
