import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Order } from '@/types';

type RouteResult = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
};

const DEFAULT_CENTER: LatLngTuple = [49.75, 13.55];

function MapViewport({ order }: { order: Order | null }) {
  const map = useMap();

  useEffect(() => {
    if (!order) return;
    const bounds: LatLngBoundsExpression = [
      [order.fromCoords.lat, order.fromCoords.lng],
      [order.toCoords.lat, order.toCoords.lng],
    ];
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
  }, [map, order]);

  return null;
}

export function FreightMap({
  order,
  orders,
  onRouteDistance,
}: {
  order: Order | null;
  orders: Order[];
  onRouteDistance: (orderId: string, distanceKm: number) => void;
}) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const orderId = order?.id;
  const fromLat = order?.fromCoords.lat;
  const fromLng = order?.fromCoords.lng;
  const toLat = order?.toCoords.lat;
  const toLng = order?.toCoords.lng;

  useEffect(() => {
    if (orderId === undefined || fromLat === undefined || fromLng === undefined || toLat === undefined || toLng === undefined) {
      setRoute(null);
      setRouteError('');
      setRouteLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadRoute = async () => {
      setRoute(null);
      setRouteError('');
      setRouteLoading(true);
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Routing service returned ${response.status}`);
        }

        const data = await response.json() as {
          code?: string;
          routes?: { geometry?: { coordinates?: [number, number][] }; distance?: number; duration?: number }[];
        };
        const firstRoute = data.routes?.[0];
        const coordinates = firstRoute?.geometry?.coordinates;
        if (data.code !== 'Ok' || !coordinates?.length) {
          throw new Error('No driving route was found for this shipment.');
        }

        const distanceKm = Math.round((firstRoute?.distance ?? 0) / 1000);
        setRoute({
          coordinates: coordinates.map(([lng, lat]) => [lat, lng]),
          distance: firstRoute?.distance ?? 0,
          duration: firstRoute?.duration ?? 0,
        });
        onRouteDistance(orderId, distanceKm);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRouteError('Silniční trasu se nepodařilo načíst. Zkontrolujte připojení a zkuste vybrat zakázku znovu.');
      } finally {
        if (!controller.signal.aborted) setRouteLoading(false);
      }
    };

    void loadRoute();
    return () => controller.abort();
  }, [fromLat, fromLng, onRouteDistance, orderId, toLat, toLng]);

  const selectedLine = useMemo(() => route?.coordinates ?? [], [route]);
  const routeDistanceKm = route ? Math.round(route.distance / 1000) : null;
  const routeDurationHours = route ? Math.round(route.duration / 3600) : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-950" aria-label="Interaktivní mapa dopravy">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={8}
        scrollWheelZoom
        className="h-full min-h-[300px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport order={order} />

        {orders.flatMap((item) => {
          const selected = item.id === order?.id;
          return [
            <CircleMarker
              key={`${item.id}-from`}
              center={[item.fromCoords.lat, item.fromCoords.lng]}
              radius={selected ? 8 : 5}
              pathOptions={{ color: '#0f172a', weight: 2, fillColor: selected ? '#3b82f6' : '#64748b', fillOpacity: 1 }}
            >
              <Popup>{item.title}<br />Nakládka: {item.from}</Popup>
            </CircleMarker>,
            <CircleMarker
              key={`${item.id}-to`}
              center={[item.toCoords.lat, item.toCoords.lng]}
              radius={selected ? 8 : 5}
              pathOptions={{ color: '#0f172a', weight: 2, fillColor: selected ? '#22c55e' : '#94a3b8', fillOpacity: 1 }}
            >
              <Popup>{item.title}<br />Vyložení: {item.to}</Popup>
            </CircleMarker>,
          ];
        })}

        {order && route && selectedLine.length > 0 && (
          <Polyline
            positions={selectedLine}
            pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
          />
        )}
      </MapContainer>

      {order && (
        <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-xl bg-ink-900/90 px-3 py-2 text-xs shadow-lg ring-1 ring-ink-700/60 backdrop-blur">
          <span className="font-semibold text-ink-100">{order.from}</span>
          <span className="text-ink-500">→</span>
          <span className="font-semibold text-ink-100">{order.to}</span>
          {routeDistanceKm !== undefined && <span className="ml-1 text-ink-300">{routeDistanceKm} km</span>}
          {routeDurationHours !== null && <span className="text-ink-400">· cca {routeDurationHours} h</span>}
        </div>
      )}

      {routeLoading && order && (
        <div role="status" className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-ink-900/90 px-3 py-2 text-xs text-ink-200 shadow ring-1 ring-ink-700/60">
          Načítám silniční trasu…
        </div>
      )}
      {routeError && (
        <div role="alert" className="absolute bottom-4 left-4 right-4 z-[1000] rounded-lg border border-warning-500/30 bg-ink-900/95 px-3 py-2 text-xs text-warning-300 shadow-lg">
          {routeError}
        </div>
      )}
      {!order && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-ink-900/90 px-4 py-2 text-xs text-ink-200 shadow ring-1 ring-ink-700/60">
          Vyberte zakázku pro zobrazení trasy
        </div>
      )}
    </div>
  );
}
