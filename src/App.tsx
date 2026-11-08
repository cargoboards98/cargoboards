import { useEffect, useMemo, useState } from 'react';
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
  LogOut,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { FreightMap } from '@/components/FreightMap';
import { AuthScreen } from '@/components/AuthScreen';
import { StarRating } from '@/components/StarRating';
import { FUEL_RATE, SEED_ORDERS, VEHICLE_OPTIONS } from '@/data';
import { formatCZK, formatKm, maskPhone, timeAgo, VEHICLE_STYLES } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { AccountMode, Order } from '@/types';
import type { User } from '@supabase/supabase-js';

const VEHICLE_LABELS: Record<string, string> = {
  All: 'Všechny typy vozidel',
  Combi: 'Kombi',
  Van: 'Dodávka',
  Trailer: 'Přívěs',
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/25">
        <Truck size={19} strokeWidth={2.4} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-[13px] font-bold tracking-tight text-white sm:text-[15px]">
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
      className={`group w-full snap-start rounded-2xl border p-4 text-left transition-all duration-200 ${selected ? 'border-accent-400/60 bg-accent-500/[0.11] shadow-[0_8px_28px_rgba(37,99,235,0.12)]' : 'border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.045]'}`}
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

function AddOrderModal({ onClose, onAdd }: { onClose: () => void; onAdd: (order: Order) => void }) {
  const [form, setForm] = useState({ title: '', from: '', to: '', price: '', phone: '' });
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const from = form.from.trim();
    const to = form.to.trim();
    const fromCity = from in requireCities ? requireCities[from] : null;
    const toCity = to in requireCities ? requireCities[to] : null;
    if (!form.title || !fromCity || !toCity || Number(form.price) <= 0 || !form.phone) {
      setError('Vyplňte všechna pole a použijte podporované město (např. Plzeň nebo Praha).');
      return;
    }
    const distance = Math.max(24, Math.round(Math.hypot((fromCity.lat - toCity.lat) * 111, (fromCity.lng - toCity.lng) * 72) * 1.2));
    onAdd({ id: `ord-${Date.now()}`, title: form.title, from, to, fromCoords: fromCity, toCoords: toCity, price: Number(form.price), distance, vehicle: 'Van', user: 'Nový zákazník', rating: 5, reviews: 0, phone: form.phone, description: 'Nově vystavená poptávka po dopravě. Pro přesné detaily nakládky kontaktujte zákazníka.', createdAt: Date.now() });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/50 animate-scale-in sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ink-700/70 px-5 py-4"><div><h2 className="font-bold text-white">Vystavit novou zakázku</h2><p className="mt-0.5 text-xs text-ink-500">Najděte místního řidiče pro vaši zásilku</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"><X size={18} /></button></div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Co je potřeba přepravit?</span><input autoFocus value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="např. Pohovka a krabice" className="field" /></label>
          <div className="modal-field-grid grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Město nakládky</span><input value={form.from} onChange={(e) => update('from', e.target.value)} placeholder="např. Kdyně" className="field h-11 px-3 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Město vyložení</span><input value={form.to} onChange={(e) => update('to', e.target.value)} placeholder="např. Praha" className="field h-11 px-3 text-sm" /></label></div>
          <div className="modal-field-grid grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Nabídnutá cena (Kč)</span><input type="number" min="1" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="1 500" className="field h-11 px-3 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Váš telefon</span><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+420 777 123 456" className="field h-11 px-3 text-sm" /></label></div>
          {error && <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-xs text-danger-400">{error}</p>}
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white transition hover:bg-accent-600"><Plus size={17} /> Zveřejnit zakázku</button>
        </form>
      </div>
    </div>
  );
}

const requireCities: Record<string, { name: string; lat: number; lng: number }> = {
  Kdyně: { name: 'Kdyně', lat: 49.4147, lng: 13.1856 }, Domažlice: { name: 'Domažlice', lat: 49.4405, lng: 12.9297 }, Klatovy: { name: 'Klatovy', lat: 49.3995, lng: 13.2914 }, Plzeň: { name: 'Plzeň', lat: 49.7384, lng: 13.3776 }, Praha: { name: 'Praha', lat: 50.0755, lng: 14.4378 }, Beroun: { name: 'Beroun', lat: 49.9644, lng: 14.0656 }, Rokycany: { name: 'Rokycany', lat: 49.7444, lng: 13.5928 }, Stod: { name: 'Stod', lat: 49.6219, lng: 13.1653 },
};

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [selectedId, setSelectedId] = useState<string | null>('ord-1');
  const [vehicle, setVehicle] = useState<(typeof VEHICLE_OPTIONS)[number]>('All');
  const [mode, setMode] = useState<AccountMode>('PRO');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
      setAuthError(null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthError(error.message);
      } else {
        setUser(data.session?.user ?? null);
      }
      setAuthLoading(false);
    }).catch((sessionError: unknown) => {
      if (!active) return;
      setAuthError(
        sessionError instanceof Error
          ? sessionError.message
          : 'Nepodařilo se načíst přihlášení. Obnovte stránku a zkuste to znovu.',
      );
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const filtered = useMemo(() => vehicle === 'All' ? orders : orders.filter((o) => o.vehicle === vehicle), [orders, vehicle]);
  const notify = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2800); };
  const addOrder = (order: Order) => { setOrders((prev) => [order, ...prev]); setSelectedId(order.id); setModalOpen(false); notify('Zakázka úspěšně vystavena'); };
  const signOut = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setShowPreview(false);
    } catch (signOutError) {
      notify(
        signOutError instanceof Error
          ? `Odhlášení se nepodařilo: ${signOutError.message}`
          : 'Odhlášení se nepodařilo. Zkuste to znovu.',
      );
    }
  };
  if (authLoading) {
    return <main className="flex min-h-full items-center justify-center bg-ink-950 text-sm text-ink-400">Načítám přihlášení…</main>;
  }
  if (!user && !showPreview) {
    return <AuthScreen onPreview={() => setShowPreview(true)} initialError={authError} />;
  }
  const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name : '';
  const lastName = typeof user?.user_metadata.last_name === 'string' ? user.user_metadata.last_name : '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user?.email || 'Návštěvník';
  const initials = [firstName, lastName].filter(Boolean).map((name) => name[0]).join('').toUpperCase()
    || displayName[0]?.toUpperCase()
    || 'U';
  return <div className="min-h-screen bg-ink-950 text-ink-200">
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.08] bg-ink-950/90 px-3 backdrop-blur-xl sm:px-6"><Logo /><div className="hidden items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.035] p-1 md:flex"><button className="rounded-lg bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white shadow-sm">Mapa dopravy</button><button className="rounded-lg px-4 py-2 text-xs font-medium text-ink-500 transition hover:text-ink-200">Moje zakázky</button></div><div className="flex items-center gap-1.5 sm:gap-3"><button className="hidden rounded-lg p-2 text-ink-500 hover:bg-ink-800 hover:text-ink-200 sm:block"><Bell size={17} /></button><div className="hidden h-5 w-px bg-ink-700 sm:block" /><button onClick={() => setMode(mode === 'PRO' ? 'FREE' : 'PRO')} className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-bold transition sm:gap-2 sm:px-3 sm:text-xs ${mode === 'PRO' ? 'border-accent-500/40 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20' : 'border-ink-600 bg-ink-800 text-ink-400 hover:text-ink-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${mode === 'PRO' ? 'bg-success-400 shadow-[0_0_8px_#22c55e]' : 'bg-ink-500'}`} /><span>{mode === 'PRO' ? 'PRO účet' : 'FREE účet'}</span><ChevronDown size={13} /></button><div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-ink-300" title={displayName}>{initials}</div>{user ? <button onClick={signOut} aria-label="Odhlásit se" title={`Odhlásit se jako ${displayName}`} className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-800 hover:text-ink-200"><LogOut size={16} /></button> : <button onClick={() => setShowPreview(false)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-accent-400 hover:bg-ink-800">Přihlásit se</button>}</div></header>
    <main className="mx-auto grid max-w-[1800px] grid-cols-1 lg:h-[calc(100dvh-64px)] lg:min-h-0 lg:grid-cols-[300px_minmax(0,1fr)_350px] lg:grid-rows-1 lg:overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_380px]">
      <aside className="order-2 flex min-h-0 flex-col border-b border-white/[0.08] bg-white/[0.015] lg:order-1 lg:h-full lg:border-b-0 lg:border-r"><div className="flex items-center justify-between gap-3 px-4 pb-3 pt-5 sm:px-5"><div><h1 className="text-base font-bold text-white">Dostupné zakázky</h1><p className="mt-1 text-[11px] text-ink-500"><span className="text-success-400">{filtered.length} aktivních</span> · aktualizováno právě teď</p></div><button onClick={() => setModalOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-500 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-accent-500/15 transition hover:bg-accent-600"><Plus size={14} /> Přidat zakázku</button></div><div className="flex items-center gap-2 px-4 pb-4 sm:px-5"><div className="relative flex-1"><ArrowDownUp size={13} className="pointer-events-none absolute left-3 top-2.5 text-ink-500" /><select value={vehicle} onChange={(e) => setVehicle(e.target.value as typeof vehicle)} className="field h-9 appearance-none pl-8 pr-7 text-[11px]"><option value="All">{VEHICLE_LABELS.All}</option><option value="Combi">{VEHICLE_LABELS.Combi}</option><option value="Van">{VEHICLE_LABELS.Van}</option><option value="Trailer">{VEHICLE_LABELS.Trailer}</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-3 text-ink-500" /></div><button aria-label="Nastavení filtru" className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5 text-ink-400 transition hover:text-white"><Gauge size={14} /></button></div><div className="flex min-h-0 gap-3 overflow-x-auto px-4 pb-4 sm:px-5 lg:flex-1 lg:flex-col lg:space-y-2.5 lg:overflow-x-hidden lg:overflow-y-auto">{filtered.map((order) => <div key={order.id} className="w-[min(84vw,340px)] shrink-0 lg:w-full"><OrderCard order={order} selected={order.id === selectedId} onClick={() => setSelectedId(order.id)} /></div>)}{filtered.length === 0 && <div className="w-full py-8 text-center text-xs text-ink-500">Tomuto filtru neodpovídá žádná zakázka.</div>}</div><div className="hidden border-t border-white/[0.08] px-5 py-3 lg:block"><div className="flex items-center gap-2 text-[10px] text-ink-500"><ShieldCheck size={14} className="text-success-500" /> Všechny zakázky ověřuje CargoBoard</div></div></aside>
      <section className="relative order-1 h-[380px] min-h-0 bg-ink-950 p-3 sm:h-[480px] sm:p-5 lg:order-2 lg:h-full"><div className="mb-3 flex items-center justify-between gap-2 px-1"><div className="flex items-center gap-2 text-xs text-ink-400"><MapPin size={13} className="text-accent-400" /> Česko · západní region</div><div className="flex items-center gap-2 text-[10px] text-ink-400 sm:gap-3"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-400" /> Nakládka</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-400" /> Vyložení</span></div></div><div className="h-[calc(100%-32px)] min-h-0"><FreightMap order={selected} orders={orders} /></div><div className="pointer-events-none absolute bottom-8 left-8 hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-900/85 px-3 py-2 text-[10px] text-ink-400 shadow-lg backdrop-blur sm:flex"><Sparkles size={13} className="text-warning-400" /> Trasy se aktualizují v reálném čase</div></section>
      <aside className="order-3 min-h-[620px] border-t border-white/[0.08] bg-white/[0.015] lg:h-full lg:min-h-0 lg:border-l lg:border-t-0"><DetailPanel order={selected} mode={mode} onUpgrade={() => { setMode('PRO'); notify('Vítejte v PRO — kontakty odemčeny'); }} onMessage={(text) => notify(`Nabídka odeslána uživateli ${selected?.user}: „${text}“`)} /></aside>
    </main>
    {modalOpen && <AddOrderModal onClose={() => setModalOpen(false)} onAdd={addOrder} />}
    {toast && <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-success-500/30 bg-ink-800 px-4 py-3 text-xs font-semibold text-ink-100 shadow-2xl shadow-black/40 animate-fade-in"><Check size={15} className="text-success-400" />{toast}</div>}
  </div>;
}

export default App;
