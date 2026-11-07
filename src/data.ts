import type { City, Order, VehicleType } from './types';

export const CITIES: Record<string, City> = {
  Kdyně: { name: 'Kdyně', lat: 49.4147, lng: 13.1856 },
  Domažlice: { name: 'Domažlice', lat: 49.4405, lng: 12.9297 },
  Klatovy: { name: 'Klatovy', lat: 49.3995, lng: 13.2914 },
  Plzeň: { name: 'Plzeň', lat: 49.7384, lng: 13.3776 },
  Praha: { name: 'Praha', lat: 50.0755, lng: 14.4378 },
  Beroun: { name: 'Beroun', lat: 49.9644, lng: 14.0656 },
  Rokycany: { name: 'Rokycany', lat: 49.7444, lng: 13.5928 },
  Stod: { name: 'Stod', lat: 49.6219, lng: 13.1653 },
};

export const VEHICLE_OPTIONS: ('All' | VehicleType)[] = ['All', 'Combi', 'Van', 'Trailer'];

export const FUEL_RATE = 3.2; // CZK per km

const now = Date.now();

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1',
    title: 'Paleta stavebních materiálů',
    from: 'Kdyně',
    to: 'Praha',
    fromCoords: { ...CITIES['Kdyně'], name: 'Kdyně' },
    toCoords: { ...CITIES['Praha'], name: 'Praha' },
    price: 2200,
    distance: 155,
    vehicle: 'Combi',
    user: 'Marie Nováková',
    rating: 4.8,
    reviews: 31,
    phone: '+420 777 123 456',
    description:
      'Jedna EUR paleta pytlů se suchou směsí, cca 600 kg. Nakládka z přízemí, dodání k nakládací rampě. Flexibilní čas v průběhu dne.',
    createdAt: now - 1000 * 60 * 22,
  },
  {
    id: 'ord-2',
    title: 'Nábytek do nového bytu',
    from: 'Domažlice',
    to: 'Plzeň',
    fromCoords: { ...CITIES['Domažlice'], name: 'Domažlice' },
    toCoords: { ...CITIES['Plzeň'], name: 'Plzeň' },
    price: 1450,
    distance: 58,
    vehicle: 'Van',
    user: 'Tomáš Svoboda',
    rating: 4.6,
    reviews: 18,
    phone: '+420 602 884 119',
    description:
      'Rozebraný nábytek IKEA: 2x skříně PAX + jídelní stůl. Preferováno dodávka s pásy. Dvě osoby nejsou potřeba.',
    createdAt: now - 1000 * 60 * 95,
  },
  {
    id: 'ord-3',
    title: 'Zahradní traktor a vybavení',
    from: 'Klatovy',
    to: 'Kdyně',
    fromCoords: { ...CITIES['Klatovy'], name: 'Klatovy' },
    toCoords: { ...CITIES['Kdyně'], name: 'Kdyně' },
    price: 900,
    distance: 32,
    vehicle: 'Trailer',
    user: 'Petr Dvořák',
    rating: 5.0,
    reviews: 7,
    phone: '+420 775 902 331',
    description:
      'Travní traktor + příslušenství, cca 250 kg. Potřeba přívěs s rampou. Nakládka raději v sobotu ráno.',
    createdAt: now - 1000 * 60 * 60 * 5,
  },
  {
    id: 'ord-4',
    title: 'Kancelářská elektronika, 8 krabic',
    from: 'Plzeň',
    to: 'Praha',
    fromCoords: { ...CITIES['Plzeň'], name: 'Plzeň' },
    toCoords: { ...CITIES['Praha'], name: 'Praha' },
    price: 2600,
    distance: 97,
    vehicle: 'Van',
    user: 'Lucie Krejčí',
    rating: 4.9,
    reviews: 54,
    phone: '+420 728 441 770',
    description:
      '8 krabic s monitory a drobným IT vybavením, stohovatelné, celkem cca 140 kg. Na obou stranách kancelářská budova, k dispozici výtah.',
    createdAt: now - 1000 * 60 * 60 * 9,
  },
];
