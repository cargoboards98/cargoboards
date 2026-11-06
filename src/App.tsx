import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  BadgeCheck,
  Bell,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  Fuel,
  Gauge,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { FreightMap } from '@/components/FreightMap';
import { StarRating } from '@/components/StarRating';
import { CITIES, FUEL_RATE, SEED_ORDERS, VEHICLE_OPTIONS } from '@/data';
import { formatCZK, formatKm, maskPhone, timeAgo, VEHICLE_STYLES } from '@/lib/utils';
import type { AccountMode, Order } from '@/types';

const VEHICLE_LABELS: Record<string, string> = {
  All: 'Všechny typy vozidel',
  Combi: 'Kombi',
  Van: 'Dodávka',
  Trailer: 'Přívěs',
};

const APP_STATE_KEY = 'cargoboard-app-state-v1';

type SavedAppState = {
  orders: Order[];
  selectedId: string | null;
  vehicle: (typeof VEHICLE_OPTIONS)[number];
  mode: AccountMode;
  activeView: 'market' | 'mine';
  myOrderIds: string[];
  sortByProfit: boolean;
  hasUnreadActivity: boolean;
  activities: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOrder(value: unknown): value is Order {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.from === 'string'
    && typeof value.to === 'string'
    && isRecord(value.fromCoords)
    && typeof value.fromCoords.lat === 'number'
    && typeof value.fromCoords.lng === 'number'
    && isRecord(value.toCoords)
    && typeof value.toCoords.lat === 'number'
    && typeof value.toCoords.lng === 'number'
    && typeof value.price === 'number'
    && typeof value.distance === 'number'
    && (value.vehicle === 'Combi' || value.vehicle === 'Van' || value.vehicle === 'Trailer')
    && typeof value.user === 'string'
    && typeof value.rating === 'number'
    && typeof value.reviews === 'number'
    && typeof value.phone === 'string'
    && typeof value.description === 'string'
    && typeof value.createdAt === 'number';
}

function loadSavedState(): SavedAppState | null {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed)
      || parsed.version !== 1
      || !Array.isArray(parsed.orders)
      || !parsed.orders.every(isOrder)
      || (parsed.selectedId !== null && typeof parsed.selectedId !== 'string')
      || !(VEHICLE_OPTIONS as readonly unknown[]).includes(parsed.vehicle)
      || (parsed.mode !== 'PRO' && parsed.mode !== 'FREE')
      || (parsed.activeView !== 'market' && parsed.activeView !== 'mine')
      || !Array.isArray(parsed.myOrderIds)
      || !parsed.myOrderIds.every((id) => typeof id === 'string')
      || typeof parsed.sortByProfit !== 'boolean'
      || typeof parsed.hasUnreadActivity !== 'boolean'
      || !Array.isArray(parsed.activities)
      || !parsed.activities.every((activity) => typeof activity === 'string')
    ) {
      console.warn('Uložená data CargoBoardu mají neplatný formát; načítám výchozí stav.');
      return null;
    }

    return {
      orders: parsed.orders,
      selectedId: parsed.selectedId,
      vehicle: parsed.vehicle as (typeof VEHICLE_OPTIONS)[number],
      mode: parsed.mode,
      activeView: parsed.activeView,
      myOrderIds: parsed.myOrderIds,
      sortByProfit: parsed.sortByProfit,
      hasUnreadActivity: parsed.hasUnreadActivity,
      activities: parsed.activities,
    };
  } catch (error) {
    console.warn('Uložená data CargoBoardu se nepodařilo načíst.', error);
    return null;
  }
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/20">
        <Truck size={19} strokeWidth={2.4} />
      </div>
      <div className="hidden sm:block">
        <div className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white">
          CargoBoard <span className="text-accent-400">CZ</span>
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-500">Síť místní dopravy</div>
      </div>
    </div>
  );
}

function VehicleBadge({ vehicle }: { vehicle: Order['vehicle'] }) {
  const style = VEHICLE_STYLES[vehicle];
  return <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${style.bg} ${style.color} ${style.ring}`}>{VEHICLE_LABELS[vehicle]}</span>;
}

function OrderCard({ order, selected, onClick }: { order: Order; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-xl border p-3.5 text-left transition-all duration-200 ${selected ? 'border-accent-500/70 bg-accent-500/[0.09] shadow-glow' : 'border-ink-700/70 bg-ink-900/55 hover:border-ink-600 hover:bg-ink-800/80'}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className={`line-clamp-1 text-[13px] font-semibold ${selected ? 'text-white' : 'text-ink-200'}`}>{order.title}</p>
        <VehicleBadge vehicle={order.vehicle} />
      </div>
      <div className="mb-3 flex items-center gap-2 text-xs">
        <div className="flex min-w-0 flex-1 items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full bg-accent-400 ring-4 ring-accent-500/10" /><span className="truncate text-ink-300">{order.from}</span></div>
        <ArrowRight size={14} className="shrink-0 text-ink-600" />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5"><span className="truncate text-right text-ink-300">{order.to}</span><span className="h-2 w-2 shrink-0 rounded-full bg-success-400 ring-4 ring-success-500/10" /></div>
      </div>
      <div className="flex items-end justify-between border-t border-ink-700/60 pt-3">
        <div><div className="text-[15px] font-bold text-success-400">{formatCZK(order.price)}</div><div className="mt-0.5 text-[10px] text-ink-500">{formatKm(order.distance)} · {timeAgo(order.createdAt)}</div></div>
        <StarRating rating={order.rating} reviews={order.reviews} size={11} />
      </div>
    </button>
  );
}

const normalizeCity = (value: string) => value.trim().replace(/\s+/g, ' ');

const findCity = (value: string) => {
  const normalized = normalizeCity(value).toLowerCase();
  const match = Object.entries(CITIES).find(([cityName]) => cityName.toLowerCase() === normalized);
  return match ? match[1] : null;
};

function AddOrderModal({ onClose, onAdd }: { onClose: () => void; onAdd: (order: Order) => void }) {
  const [form, setForm] = useState({ title: '', from: '', to: '', price: '', phone: '' });
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    const from = normalizeCity(form.from);
    const to = normalizeCity(form.to);
    const fromCity = findCity(from);
    const toCity = findCity(to);
    const price = Number(form.price);

    if (!title || !fromCity || !toCity || !Number.isFinite(price) || price <= 0 || !form.phone.trim()) {
      setError('Vyplňte všechna pole a použijte podporované město (např. Plzeň nebo Praha).');
      return;
    }

    const distance = Math.max(24, Math.round(Math.hypot((fromCity.lat - toCity.lat) * 111, (fromCity.lng - toCity.lng) * 72) * 1.2));
    onAdd({ id: `ord-${Date.now()}`, title, from: fromCity.name, to: toCity.name, fromCoords: fromCity, toCoords: toCity, price, distance, vehicle: 'Van', user: 'Nový zákazník', rating: 5, reviews: 0, phone: form.phone.trim(), description: 'Nově vystavená poptávka po dopravě. Pro přesné detaily nakládky kontaktujte zákazníka.', createdAt: Date.now() });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/50 animate-scale-in">
        <div className="flex items-center justify-between border-b border-ink-700/70 px-5 py-4"><div><h2 className="font-bold text-white">Vystavit novou zakázku</h2><p className="mt-0.5 text-xs text-ink-500">Najděte místního řidiče pro vaši zásilku</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"><X size={18} /></button></div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Co je potřeba přepravit?</span><input autoFocus value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="např. Pohovka a krabice" className="field" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Město nakládky</span><input value={form.from} onChange={(e) => update('from', e.target.value)} placeholder="např. Kdyně" className="field" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Město vyložení</span><input value={form.to} onChange={(e) => update('to', e.target.value)} placeholder="např. Praha" className="field" /></label></div>
          <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Nabídnutá cena (Kč)</span><input type="number" min="1" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="1 500" className="field" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Váš telefon</span><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+420 777 123 456" className="field" /></label></div>
          {error && <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-xs text-danger-400">{error}</p>}
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white transition hover:bg-accent-600"><Plus size={17} /> Zveřejnit zakázku</button>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({ order, mode, onUpgrade, onMessage }: { order: Order | null; mode: AccountMode; onUpgrade: () => void; onMessage: (text: string) => void }) {
  const [message, setMessage] = useState('');
  if (!order) return <div className="flex h-full flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-ink-800 p-4 text-ink-500"><Package size={28} /></div><h3 className="font-semibold text-ink-300">Vyberte zakázku</h3><p className="mt-2 max-w-[220px] text-xs leading-5 text-ink-500">Vyberte zásilku ze seznamu a prohlédněte si trasu, výdělek a údaje o zákazníkovi.</p></div>;
  const fuel = Math.round(order.distance * FUEL_RATE);
  const net = order.price - fuel;
  const send = () => { if (message.trim()) { onMessage(message.trim()); setMessage(''); } };
  return <div className="flex h-full min-h-0 flex-col">
    <div className="shrink-0 border-b border-ink-700/70 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><div className="mb-2 flex items-center gap-2"><VehicleBadge vehicle={order.vehicle} /><span className="text-[10px] text-ink-500">{timeAgo(order.createdAt)}</span></div><h2 className="text-lg font-bold leading-tight text-white">{order.title}</h2></div><button className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-800 hover:text-ink-200"><MoreHorizontal size={18} /></button></div><div className="flex items-center gap-2 text-sm"><MapPin size={15} className="text-accent-400" /><span className="font-medium text-ink-200">{order.from}</span><ArrowRight size={14} className="text-ink-600" /><span className="font-medium text-ink-200">{order.to}</span><span className="ml-auto text-xs text-ink-500">{order.distance} km</span></div></div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mb-5 rounded-xl border border-ink-700/70 bg-ink-800/40 p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/15 text-xs font-bold text-accent-400">{order.user.split(' ').map((n) => n[0]).join('')}</div><div><div className="flex items-center gap-1 text-sm font-semibold text-ink-200">{order.user}<BadgeCheck size={13} className="text-accent-400" /></div><div className="text-[10px] text-ink-500">Zákazník · ověřená identita</div></div></div><StarRating rating={order.rating} reviews={order.reviews} size={12} /></div><p className="text-xs leading-5 text-ink-400">{order.description}</p></div>
      <div className="mb-5"><div className="mb-3 flex items-center gap-2"><Calculator size={15} className="text-accent-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-ink-300">Odhadovaný výdělek</h3><CircleHelp size={13} className="ml-auto text-ink-600" /></div><div className="rounded-xl border border-success-500/25 bg-success-500/[0.07] p-4"><div className="mb-3 flex items-end justify-between"><span className="text-xs text-ink-400">Čistý zisk</span><span className="text-2xl font-bold tracking-tight text-success-400">{formatCZK(net)}</span></div><div className="space-y-2 border-t border-success-500/15 pt-3 text-xs"><div className="flex justify-between"><span className="text-ink-400">Nabídnutá cena</span><span className="font-semibold text-ink-200">{formatCZK(order.price)}</span></div><div className="flex justify-between"><span className="flex items-center gap-1.5 text-ink-400"><Fuel size={12} /> Odhad paliva · {FUEL_RATE.toFixed(1)} Kč/km</span><span className="font-semibold text-danger-400">− {formatCZK(fuel)}</span></div></div></div></div>
      <div className="mb-5"><div className="mb-3 flex items-center gap-2"><MessageCircle size={15} className="text-accent-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-ink-300">Kontaktovat zákazníka</h3></div>{mode === 'PRO' ? <div className="rounded-xl border border-accent-500/25 bg-accent-500/[0.06] p-3"><div className="mb-3 flex items-center gap-2 text-xs text-ink-300"><Phone size={14} className="text-accent-400" />{order.phone}<span className="ml-auto rounded bg-success-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success-400">Přímý</span></div><div className="flex gap-2"><a href={`tel:${order.phone.replace(/ /g, '')}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 py-2 text-xs font-semibold text-ink-200 transition hover:border-accent-500/60 hover:text-white"><Phone size={13} /> Volat</a><button onClick={() => onMessage('Dobrý den, mám zájem o tuto zakázku. Je časově flexibilní?')} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-500 py-2 text-xs font-semibold text-white transition hover:bg-accent-600"><MessageCircle size={13} /> Zpráva</button></div></div> : <div className="rounded-xl border border-warning-500/25 bg-warning-500/[0.06] p-3"><div className="mb-3 flex items-center gap-2"><LockKeyhole size={14} className="text-warning-400" /><span className="text-xs font-medium text-ink-300">Kontaktní údaje jsou uzamčeny</span><span className="ml-auto text-xs font-semibold text-ink-500">{maskPhone(order.phone)}</span></div><p className="mb-3 text-[11px] leading-4 text-ink-500">Přejděte na PRO pro odemčení telefonních čísel a přímé nabídky.</p><button onClick={onUpgrade} className="flex w-full items-center justify-center gap-2 rounded-lg bg-warning-500 py-2.5 text-xs font-bold text-ink-950 transition hover:bg-warning-400"><Zap size={13} /> Odemknout kontakty · 299 Kč/měs.</button></div>}</div>
      <div><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Send size={14} className="text-accent-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-ink-300">Rychlá nabídka</h3></div><span className="text-[10px] text-ink-600">{mode === 'PRO' ? 'PRO funkce' : 'Uzamčeno'}</span></div><div className="relative"><textarea value={message} onChange={(e) => setMessage(e.target.value)} disabled={mode !== 'PRO'} placeholder={mode === 'PRO' ? 'Napište zprávu zákazníkovi...' : 'Pro odemčení zpráv přejděte na PRO'} rows={3} className="field resize-none pr-11 text-xs" /><button onClick={send} disabled={mode !== 'PRO' || !message.trim()} className="absolute bottom-2.5 right-2.5 rounded-lg bg-accent-500 p-2 text-white transition enabled:hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-30"><Send size={14} /></button></div></div>
    </div>
  </div>;
}

function App() {
  const [initialState] = useState(loadSavedState);
  const [orders, setOrders] = useState<Order[]>(() => initialState?.orders ?? SEED_ORDERS);
  const [selectedId, setSelectedId] = useState<string | null>(() => initialState?.selectedId ?? 'ord-1');
  const [vehicle, setVehicle] = useState<(typeof VEHICLE_OPTIONS)[number]>(() => initialState?.vehicle ?? 'All');
  const [mode, setMode] = useState<AccountMode>(() => initialState?.mode ?? 'PRO');
  const [activeView, setActiveView] = useState<'market' | 'mine'>(() => initialState?.activeView ?? 'market');
  const [myOrderIds, setMyOrderIds] = useState<string[]>(() => initialState?.myOrderIds ?? []);
  const [sortByProfit, setSortByProfit] = useState(() => initialState?.sortByProfit ?? false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadActivity, setHasUnreadActivity] = useState(() => initialState?.hasUnreadActivity ?? false);
  const [activities, setActivities] = useState<string[]>(() => initialState?.activities ?? []);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const viewOrders = useMemo(
    () => activeView === 'mine' ? orders.filter((order) => myOrderIds.includes(order.id)) : orders,
    [activeView, myOrderIds, orders],
  );
  const filtered = useMemo(() => {
    const matches = vehicle === 'All' ? viewOrders : viewOrders.filter((order) => order.vehicle === vehicle);
    return sortByProfit
      ? [...matches].sort((a, b) => (b.price - b.distance * FUEL_RATE) - (a.price - a.distance * FUEL_RATE))
      : matches;
  }, [sortByProfit, vehicle, viewOrders]);
  const activeSelectedId = filtered.some((o) => o.id === selectedId) ? selectedId : filtered[0]?.id ?? null;
  useEffect(() => {
    if (selectedId !== activeSelectedId) {
      setSelectedId(activeSelectedId);
    }
  }, [selectedId, activeSelectedId]);
  useEffect(() => {
    try {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify({
        version: 1,
        orders,
        selectedId: activeSelectedId,
        vehicle,
        mode,
        activeView,
        myOrderIds,
        sortByProfit,
        hasUnreadActivity,
        activities,
      }));
    } catch (error) {
      console.error('Stav CargoBoardu se nepodařilo uložit do tohoto prohlížeče.', error);
    }
  }, [activeSelectedId, activeView, activities, hasUnreadActivity, mode, myOrderIds, orders, sortByProfit, vehicle]);
  const selected = orders.find((o) => o.id === activeSelectedId) ?? null;
  const notify = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2800); };
  const updateRouteDistance = useCallback((orderId: string, distance: number) => {
    setOrders((prev) => prev.map((order) => (
      order.id === orderId && order.distance !== distance ? { ...order, distance } : order
    )));
  }, []);
  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setMyOrderIds((prev) => [order.id, ...prev]);
    setSelectedId(order.id);
    setActiveView('mine');
    setModalOpen(false);
    setActivities((prev) => [`Vystavili jste zakázku „${order.title}“.`, ...prev]);
    setHasUnreadActivity(true);
    notify('Zakázka úspěšně vystavena');
  };
  const sendMessage = (text: string) => {
    if (!selected) return;
    setActivities((prev) => [`Odeslali jste nabídku uživateli ${selected.user}.`, ...prev]);
    setHasUnreadActivity(true);
    notify(`Nabídka odeslána uživateli ${selected.user}: „${text}“`);
  };
  return <div className="min-h-full bg-ink-950 text-ink-200">
    <header className="flex h-[68px] items-center justify-between border-b border-ink-700/70 bg-ink-950/95 px-4 sm:px-6"><Logo /><div className="hidden items-center gap-1 rounded-xl border border-ink-700/70 bg-ink-900/60 p-1 md:flex"><button onClick={() => setActiveView('market')} className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm ${activeView === 'market' ? 'bg-ink-700/80 text-white' : 'text-ink-500 transition hover:text-ink-200'}`}>Mapa dopravy</button><button onClick={() => setActiveView('mine')} className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm ${activeView === 'mine' ? 'bg-ink-700/80 text-white' : 'text-ink-500 transition hover:text-ink-200'}`}>Moje zakázky</button></div><div className="flex items-center gap-2 sm:gap-3"><div className="relative hidden sm:block"><button aria-label="Oznámení" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setHasUnreadActivity(false); }} className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-800 hover:text-ink-200"><Bell size={17} />{hasUnreadActivity && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-400" />}</button>{notificationsOpen && <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-ink-700 bg-ink-900 p-3 shadow-xl"><h2 className="mb-2 text-xs font-bold text-white">Oznámení</h2>{activities.length ? <ul className="space-y-2">{activities.slice(0, 5).map((activity, index) => <li key={`${activity}-${index}`} className="rounded-lg bg-ink-800/70 px-3 py-2 text-xs leading-5 text-ink-300">{activity}</li>)}</ul> : <p className="py-3 text-xs text-ink-500">Zatím nemáte žádná oznámení.</p>}</div>}</div><div className="hidden h-5 w-px bg-ink-700 sm:block" /><button onClick={() => setMode(mode === 'PRO' ? 'FREE' : 'PRO')} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition sm:px-3 ${mode === 'PRO' ? 'border-accent-500/40 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20' : 'border-ink-600 bg-ink-800 text-ink-400 hover:text-ink-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${mode === 'PRO' ? 'bg-success-400 shadow-[0_0_8px_#22c55e]' : 'bg-ink-500'}`} /><span>{mode === 'PRO' ? 'PRO účet' : 'FREE účet'}</span><ChevronDown size={13} /></button><div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-ink-300">JD</div></div></header>
    <nav aria-label="Hlavní navigace" className="flex gap-2 border-b border-ink-700/70 bg-ink-950 px-4 py-2 md:hidden"><button onClick={() => setActiveView('market')} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${activeView === 'market' ? 'bg-ink-700/80 text-white' : 'text-ink-500'}`}>Mapa dopravy</button><button onClick={() => setActiveView('mine')} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${activeView === 'mine' ? 'bg-ink-700/80 text-white' : 'text-ink-500'}`}>Moje zakázky</button></nav>
    <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1800px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_350px] xl:grid-cols-[320px_minmax(0,1fr)_380px]">
      <aside className="flex max-h-[520px] min-h-0 flex-col border-b border-ink-700/70 bg-ink-950/70 lg:max-h-none lg:border-b-0 lg:border-r"><div className="flex items-center justify-between px-4 pb-3 pt-5"><div><h1 className="text-base font-bold text-white">{activeView === 'mine' ? 'Moje zakázky' : 'Dostupné zakázky'}</h1><p className="mt-1 text-[11px] text-ink-500"><span className="text-success-400">{filtered.length} {activeView === 'mine' ? 'vystavených' : 'aktivních'}</span> · aktualizováno právě teď</p></div><button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-accent-500/10 transition hover:bg-accent-600"><Plus size={14} /> Přidat zakázku</button></div><div className="flex items-center gap-2 px-4 pb-4"><div className="relative flex-1"><ArrowDownUp size={13} className="pointer-events-none absolute left-3 top-2.5 text-ink-500" /><select value={vehicle} onChange={(e) => setVehicle(e.target.value as typeof vehicle)} className="field h-8 appearance-none pl-8 pr-7 text-[11px]"><option value="All">{VEHICLE_LABELS.All}</option><option value="Combi">{VEHICLE_LABELS.Combi}</option><option value="Van">{VEHICLE_LABELS.Van}</option><option value="Trailer">{VEHICLE_LABELS.Trailer}</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-ink-500" /></div><button aria-label={sortByProfit ? 'Zrušit řazení podle čistého výdělku' : 'Seřadit podle čistého výdělku'} title={sortByProfit ? 'Zrušit řazení podle čistého výdělku' : 'Seřadit podle čistého výdělku'} onClick={() => setSortByProfit((sort) => !sort)} className={`rounded-lg border p-2 transition ${sortByProfit ? 'border-accent-500/50 bg-accent-500/10 text-accent-300' : 'border-ink-700 bg-ink-900 text-ink-500 hover:text-ink-200'}`}><Gauge size={14} /></button></div><div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-4">{filtered.map((order) => <OrderCard key={order.id} order={order} selected={order.id === selectedId} onClick={() => setSelectedId(order.id)} />)}{filtered.length === 0 && <div className="py-12 text-center text-xs text-ink-500">{activeView === 'mine' ? 'Zatím jste nevystavili žádnou zakázku.' : 'Tomuto filtru neodpovídá žádná zakázka.'}</div>}</div><div className="hidden border-t border-ink-700/70 px-4 py-3 lg:block"><div className="flex items-center gap-2 text-[10px] text-ink-500"><ShieldCheck size={14} className="text-success-500" /> Všechny zakázky ověřuje CargoBoard</div></div></aside>
      <section className="relative min-h-[480px] bg-ink-950 p-3 sm:p-5 lg:min-h-0"><div className="mb-3 flex items-center justify-between px-1"><div><div className="flex items-center gap-2 text-xs text-ink-500"><MapPin size={13} className="text-accent-400" /> Česko · západní region</div></div><div className="flex items-center gap-3 text-[10px] text-ink-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-400" /> Nakládka</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-400" /> Vyložení</span></div></div><div className="h-[calc(100%-32px)] min-h-[430px] lg:min-h-0"><FreightMap order={selected} orders={filtered} onRouteDistance={updateRouteDistance} /></div><div className="pointer-events-none absolute bottom-8 left-8 hidden items-center gap-2 rounded-lg border border-ink-700/70 bg-ink-900/80 px-3 py-2 text-[10px] text-ink-500 backdrop-blur sm:flex">Mapa: OpenStreetMap · silniční trasy</div></section>
      <aside className="min-h-[620px] border-t border-ink-700/70 bg-ink-950/80 lg:min-h-0 lg:border-l lg:border-t-0"><DetailPanel order={selected} mode={mode} onUpgrade={() => { setMode('PRO'); notify('Vítejte v PRO — kontakty odemčeny'); }} onMessage={sendMessage} /></aside>
    </main>
    {modalOpen && <AddOrderModal onClose={() => setModalOpen(false)} onAdd={addOrder} />}
    {toast && <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-success-500/30 bg-ink-800 px-4 py-3 text-xs font-semibold text-ink-100 shadow-2xl shadow-black/40 animate-fade-in"><Check size={15} className="text-success-400" />{toast}</div>}
  </div>;
}

export default App;
