// Equirectangular projection tuned to the western Czechia region the app covers.
const BBOX = { minLng: 12.0, maxLng: 15.2, minLat: 49.0, maxLat: 50.7 };
const VIEW_W = 900;
const VIEW_H = 600;
const PAD = 70;

export function project(lat: number, lng: number) {
  const x = PAD + ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * (VIEW_W - 2 * PAD);
  const y = PAD + ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * (VIEW_H - 2 * PAD);
  return { x, y };
}

export const MAP_W = VIEW_W;
export const MAP_H = VIEW_H;
