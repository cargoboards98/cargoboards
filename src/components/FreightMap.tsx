import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Order } from '@/types';
import { formatCZK } from '@/lib/utils';

const REGION_BOUNDS = latLngBounds(
  [49.18, 12.35],
  [50.34, 14.72],
);

function MapViewport({ order }: { order: Order | null }) {
  const map = useMap();

  useEffect(() => {
    const bounds = order
      ? latLngBounds(
          [order.fromCoords.lat, order.fromCoords.lng],
          [order.toCoords.lat, order.toCoords.lng],
        )
      : REGION_BOUNDS;

    map.fitBounds(bounds, { padding: [44, 44], maxZoom: order ? 10 : 9, animate: true });
  }, [map, order]);

  return null;
}

export function FreightMap({
  order,
  orders,
  onSelectOrder,
}: {
  order: Order | null;
  orders: Order[];
  onSelectOrder?: (orderId: string) => void;
}) {
  const route = useMemo(
    () => order ? [
      [order.fromCoords.lat, order.fromCoords.lng] as [number, number],
      [order.toCoords.lat, order.toCoords.lng] as [number, number],
    ] : [],
    [order],
  );

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#151d2b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <MapContainer
        center={[49.7, 13.55]}
        zoom={8}
        minZoom={6}
        maxZoom={17}
        scrollWheelZoom
        zoomControl
        className="cargoboard-map h-full w-full"
        aria-label="Interaktivní mapa zakázek v západních Čechách"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapViewport order={order} />

        {orders.map((item) => {
          const selected = item.id === order?.id;
          const icon = selected
            ? divIcon({
                className: 'cargoboard-price-marker',
                html: `<span class="cargoboard-price-marker__pill is-selected">${formatCZK(item.price)}</span>`,
                iconSize: [96, 30],
                iconAnchor: [48, 36],
              })
            : divIcon({
                className: 'cargoboard-order-marker',
                html: '<span class="cargoboard-order-dot"></span>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });

          return (
            <Marker
              key={item.id}
              position={[item.fromCoords.lat, item.fromCoords.lng]}
              icon={icon}
              riseOnHover
              eventHandlers={{ click: () => onSelectOrder?.(item.id) }}
              title={`${item.title} · ${item.from} → ${item.to} · ${formatCZK(item.price)}`}
              alt={`${item.title}, zakázka z ${item.from} do ${item.to}`}
            />
          );
        })}

        {order && (
          <>
            <Polyline
              positions={route}
              pathOptions={{ color: '#60a5fa', weight: 8, opacity: 0.2, lineCap: 'round' }}
            />
            <Polyline
              positions={route}
              pathOptions={{ color: '#60a5fa', weight: 3, opacity: 0.95, lineCap: 'round' }}
            />
            <CircleMarker
              center={[order.fromCoords.lat, order.fromCoords.lng]}
              radius={7}
              pathOptions={{ color: '#dbeafe', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }}
            >
              <span className="sr-only">Nakládka: {order.from}</span>
            </CircleMarker>
            <CircleMarker
              center={[order.toCoords.lat, order.toCoords.lng]}
              radius={7}
              pathOptions={{ color: '#dcfce7', weight: 3, fillColor: '#22c55e', fillOpacity: 1 }}
            >
              <span className="sr-only">Vyložení: {order.to}</span>
            </CircleMarker>
          </>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full border border-white/10 bg-[#101827]/90 px-3 py-2 text-[10px] font-medium text-slate-200 shadow-lg backdrop-blur-md sm:left-4 sm:top-4 sm:text-xs">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
        {order
          ? <><span className="font-semibold">{order.from}</span><span className="text-slate-500">→</span><span className="font-semibold">{order.to}</span><span className="ml-1 text-slate-400">{order.distance} km</span></>
          : <span>Zakázky v západních Čechách</span>}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-white/10 bg-[#101827]/85 px-2.5 py-1.5 text-[9px] text-slate-400 shadow-lg backdrop-blur-md sm:bottom-4 sm:left-4 sm:text-[10px]">
        Podržte a přetáhněte · kolečkem přibližte
      </div>
    </div>
  );
}
