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
  LogOut,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { FreightMap } from '@/components/FreightMap';
import { AuthScreen } from '@/components/AuthScreen';
import { AdminUsersPanel } from '@/components/AdminUsersPanel';
import { CookieConsent } from '@/components/CookieConsent';
import { LegalPages, type LegalPage } from '@/components/LegalPages';
import { OrderChat } from '@/components/OrderChat';
import { ProfileSettings, type ProfileSummary } from '@/components/ProfileSettings';
import { ReportDialog } from '@/components/ReportDialog';
import { ReviewForm } from '@/components/ReviewForm';
import { SiteFooter } from '@/components/SiteFooter';
import { StarRating } from '@/components/StarRating';
import { CITIES, FUEL_RATE, SEED_ORDERS, VEHICLE_OPTIONS } from '@/data';
import { formatCZK, formatKm, maskPhone, timeAgo, VEHICLE_STYLES } from '@/lib/utils';
import { mapMarketplaceOrder, toOrderPayload, type MarketplaceOrderRow } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { AccountMode, AccountRole, Order } from '@/types';
import type { User } from '@supabase/supabase-js';

const VEHICLE_LABELS: Record<string, string> = {
  All: 'Všechny typy vozidel',
  Combi: 'Kombi',
  Van: 'Dodávka',
  Trailer: 'Přívěs',
};

async function fetchMarketplaceOrders(): Promise<Order[]> {
  if (!supabase) throw new Error('Supabase není nakonfigurováno.');
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as MarketplaceOrderRow[]).map(mapMarketplaceOrder).filter((order) => order.status !== 'cancelled');
}

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

function AddOrderModal({ onClose, onAdd, defaultEmail }: { onClose: () => void; onAdd: (order: Order) => Promise<void>; defaultEmail: string }) {
  const [form, setForm] = useState({ title: '', from: '', to: '', price: '', phone: '', email: defaultEmail, description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const from = form.from.trim();
    const to = form.to.trim();
    const fromCity = CITIES[from] ?? null;
    const toCity = CITIES[to] ?? null;
    if (!form.title || !fromCity || !toCity || Number(form.price) <= 0 || !form.phone) {
      setError('Vyplňte všechna pole a použijte podporované město (např. Plzeň nebo Praha).');
      return;
    }
    const distance = Math.max(24, Math.round(Math.hypot((fromCity.lat - toCity.lat) * 111, (fromCity.lng - toCity.lng) * 72) * 1.2));
    setSaving(true);
    setError('');
    try {
      await onAdd({ id: '', title: form.title.trim(), from, to, fromCoords: fromCity, toCoords: toCity, price: Number(form.price), distance, vehicle: 'Van', user: 'Poptávající', rating: 0, reviews: 0, phone: form.phone.trim(), email: form.email.trim(), description: form.description.trim(), createdAt: Date.now(), status: 'open' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Zakázku se nepodařilo uložit.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/50 animate-scale-in sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-ink-700/70 px-5 py-4"><div><h2 className="font-bold text-white">Vystavit novou zakázku</h2><p className="mt-0.5 text-xs text-ink-500">Najděte místního řidiče pro vaši zásilku</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"><X size={18} /></button></div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Co je potřeba přepravit?</span><input autoFocus required maxLength={120} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="např. Pohovka a krabice" className="field" /></label>
          <div className="modal-field-grid grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Město nakládky</span><input value={form.from} onChange={(e) => update('from', e.target.value)} placeholder="např. Kdyně" className="field h-11 px-3 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Město vyložení</span><input value={form.to} onChange={(e) => update('to', e.target.value)} placeholder="např. Praha" className="field h-11 px-3 text-sm" /></label></div>
          <div className="modal-field-grid grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Nabídnutá cena (Kč)</span><input required type="number" min="1" max="10000000" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="1 500" className="field h-11 px-3 text-sm" /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Váš telefon</span><input required type="tel" maxLength={32} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+420 777 123 456" className="field h-11 px-3 text-sm" /></label></div>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Kontaktní e-mail</span><input type="email" maxLength={254} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="vas@email.cz" className="field" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-300">Podrobnosti o nákladu (nepovinné)</span><textarea maxLength={2000} rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Rozměry, hmotnost, přístup k nakládce…" className="field resize-none" /></label>
          {error && <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-xs text-danger-400">{error}</p>}
          <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white transition hover:bg-accent-600 disabled:opacity-50"><Plus size={17} /> {saving ? 'Ukládám…' : 'Zveřejnit zakázku zdarma'}</button>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({
  order,
  mode,
  role,
  userId,
  contact,
  contactLoading,
  contactError,
  isOwner,
  onUpgrade,
  onClaim,
  onComplete,
  onReport,
}: {
  order: Order | null;
  mode: AccountMode;
  role: AccountRole;
  userId?: string;
  contact: { phone: string; email: string | null } | null;
  contactError?: string | null;
  contactLoading: boolean;
  isOwner: boolean;
  onUpgrade: () => void;
  onClaim: () => void;
  onComplete: () => void;
  onReport: () => void;
}) {
  if (!order) return <div className="flex h-full flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-ink-800 p-4 text-ink-500"><Package size={28} /></div><h3 className="font-semibold text-ink-300">Vyberte zakázku</h3><p className="mt-2 max-w-[220px] text-xs leading-5 text-ink-500">Vyberte zásilku ze seznamu a prohlédněte si trasu, výdělek a údaje o zákazníkovi.</p></div>;
  const fuel = Math.round(order.distance * FUEL_RATE);
  const net = order.price - fuel;
  const canSeeContact = mode === 'PRO' || role === 'shipper';
  const claimIsOpen = role === 'carrier' && order.status === 'open' && !order.claimedBy;
  const claimIsMine = !!userId && order.claimedBy === userId;
  return <div className="flex h-full min-h-0 flex-col">
    <div className="shrink-0 border-b border-ink-700/70 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><div className="mb-2 flex items-center gap-2"><VehicleBadge vehicle={order.vehicle} /><span className="text-[10px] text-ink-500">{timeAgo(order.createdAt)}</span>{order.status === 'completed' && <span className="rounded bg-success-500/10 px-2 py-1 text-[9px] font-bold uppercase text-success-300">Dokončeno</span>}</div><h2 className="text-lg font-bold leading-tight text-white">{order.title}</h2></div><button onClick={onReport} aria-label="Nahlásit zakázku" title="Nahlásit zakázku" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-800 hover:text-warning-300"><MoreHorizontal size={18} /></button></div><div className="flex items-center gap-2 text-sm"><MapPin size={15} className="text-accent-400" /><span className="font-medium text-ink-200">{order.from}</span><ArrowRight size={14} className="text-ink-600" /><span className="font-medium text-ink-200">{order.to}</span><span className="ml-auto text-xs text-ink-500">{order.distance} km</span></div></div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mb-5 rounded-xl border border-ink-700/70 bg-ink-800/40 p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/15 text-xs font-bold text-accent-400">{order.user.split(' ').map((n) => n[0]).join('')}</div><div><div className="flex items-center gap-1 text-sm font-semibold text-ink-200">{order.user}<BadgeCheck size={13} className="text-accent-400" /></div><div className="text-[10px] text-ink-500">Zákazník · ověřená identita</div></div></div><StarRating rating={order.rating} reviews={order.reviews} size={12} /></div><p className="text-xs leading-5 text-ink-400">{order.description}</p></div>
      <div className="mb-5"><div className="mb-3 flex items-center gap-2"><Calculator size={15} className="text-accent-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-ink-300">Odhadovaný výdělek</h3><CircleHelp size={13} className="ml-auto text-ink-600" /></div><div className="rounded-xl border border-success-500/25 bg-success-500/[0.07] p-4"><div className="mb-3 flex items-end justify-between"><span className="text-xs text-ink-400">Čistý zisk</span><span className="text-2xl font-bold tracking-tight text-success-400">{formatCZK(net)}</span></div><div className="space-y-2 border-t border-success-500/15 pt-3 text-xs"><div className="flex justify-between"><span className="text-ink-400">Nabídnutá cena</span><span className="font-semibold text-ink-200">{formatCZK(order.price)}</span></div><div className="flex justify-between"><span className="flex items-center gap-1.5 text-ink-400"><Fuel size={12} /> Odhad paliva · {FUEL_RATE.toFixed(1)} Kč/km</span><span className="font-semibold text-danger-400">− {formatCZK(fuel)}</span></div></div></div></div>
      <div className="mb-5"><div className="mb-3 flex items-center gap-2"><MessageCircle size={15} className="text-accent-400" /><h3 className="text-xs font-bold uppercase tracking-wider text-ink-300">Kontakt</h3></div>{canSeeContact ? <div className="rounded-xl border border-accent-500/25 bg-accent-500/[0.06] p-3">{contactLoading ? <p className="text-xs text-ink-400">Načítám bezpečně kontaktní údaje…</p> : contact ? <><div className="space-y-2 text-xs text-ink-200">{contact.phone && <a className="flex items-center gap-2 text-ink-200 hover:text-white" href={`tel:${contact.phone.replace(/\s/g, '')}`}><Phone size={14} className="text-accent-400" />{contact.phone}</a>}{contact.email && <a className="block break-all text-accent-300 hover:text-accent-200" href={`mailto:${contact.email}`}>{contact.email}</a>}</div><span className="mt-2 inline-flex rounded bg-success-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success-400">{role === 'shipper' ? 'Vaše kontaktní údaje' : 'PRO · přímý kontakt'}</span></> : <p className="text-xs leading-5 text-danger-300">{contactError ?? 'Kontaktní údaje k této zakázce nebyly nalezeny.'}</p>}</div> : <div className="rounded-xl border border-warning-500/25 bg-warning-500/[0.06] p-3"><div className="mb-3 flex items-center gap-2"><LockKeyhole size={14} className="text-warning-400" /><span className="text-xs font-medium text-ink-300">Kontaktní údaje jsou uzamčeny</span><span className="ml-auto text-xs font-semibold text-ink-500">{order.phone ? maskPhone(order.phone) : '••••••'}</span></div><p className="mb-3 text-[11px] leading-4 text-ink-500">Předplatné odemkne telefon a e-mail u zakázek.</p><button onClick={onUpgrade} className="flex w-full items-center justify-center gap-2 rounded-lg bg-warning-500 py-2.5 text-xs font-bold text-ink-950 transition hover:bg-warning-400"><Zap size={13} /> Odemknout kontakty · 449 Kč/měs.</button></div>}</div>
      {claimIsOpen && <button onClick={onClaim} className="mb-4 w-full rounded-xl border border-accent-500/30 bg-accent-500/10 py-3 text-xs font-bold text-accent-200 hover:bg-accent-500/20">Mám zájem o zakázku</button>}
      {claimIsMine && <p className="mb-4 rounded-lg bg-success-500/10 px-3 py-2 text-xs text-success-300">Tato zakázka je přiřazena vám.</p>}
      {isOwner && order.status === 'open' && order.claimedBy && <button onClick={onComplete} className="mb-4 w-full rounded-xl bg-success-500/15 py-3 text-xs font-bold text-success-300 hover:bg-success-500/25">Označit přepravu jako dokončenou</button>}
      {userId && order.status === 'completed' && order.claimedBy && (isOwner || claimIsMine) && <ReviewForm orderId={order.id} reviewerId={userId} revieweeId={isOwner ? order.claimedBy : order.ownerId ?? ''} />}
      <OrderChat orderId={order.id} orderOwnerId={order.ownerId} claimedBy={order.claimedBy} userId={userId} role={role} />
    </div>
  </div>;
}

function App() {
  const [legalPage, setLegalPage] = useState<LegalPage | null>(() => {
    const route = window.location.hash.slice(1);
    return route === '/terms' || route === '/privacy' || route === '/complaints' ? route.slice(1) as LegalPage : null;
  });
  const [adminPage, setAdminPage] = useState(() => window.location.hash === '#/admin');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState<string | null>(null);
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>({
    isPro: false,
    subscriptionStatus: 'free',
    ico: null,
    vehicleType: null,
    vehicleLengthCm: null,
    vehicleWidthCm: null,
    vehicleHeightCm: null,
    payloadKg: null,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>('ord-1');
  const [vehicle, setVehicle] = useState<(typeof VEHICLE_OPTIONS)[number]>('All');
  const [mode, setMode] = useState<AccountMode>('PRO');
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [orderContact, setOrderContact] = useState<{ phone: string; email: string | null } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toast, setToast] = useState('');
  useEffect(() => {
    const syncLegalPage = () => {
      const route = window.location.hash.slice(1);
      setLegalPage(route === '/terms' || route === '/privacy' || route === '/complaints' ? route.slice(1) as LegalPage : null);
      setAdminPage(route === '/admin');
    };
    window.addEventListener('hashchange', syncLegalPage);
    return () => window.removeEventListener('hashchange', syncLegalPage);
  }, []);
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
  useEffect(() => {
    if (!user || !supabase) {
      setAccountRole('carrier');
      setIsAdmin(false);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    const client = supabase;
    setAccountRole(null);
    setProfileError(null);
    setProfileLoading(true);
    void (async () => {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('account_type, role, first_name, last_name, ico, is_pro, subscription_status, vehicle_type, vehicle_length_cm, vehicle_width_cm, vehicle_height_cm, payload_kg')
          .eq('id', user.id)
          .maybeSingle();
        if (!active) return;
        if (error) {
          setProfileError(`Nepodařilo se načíst roli účtu: ${error.message}`);
        } else if (data?.account_type === 'carrier' || data?.account_type === 'shipper') {
          setIsAdmin(data.role === 'admin');
          setAccountRole(data.account_type);
          setProfileName(`${data.first_name} ${data.last_name}`.trim());
          setProfileSummary({
            isPro: data.is_pro === true && data.subscription_status === 'active',
            subscriptionStatus: data.subscription_status ?? 'free',
            ico: data.ico ?? null,
            vehicleType: data.vehicle_type,
            vehicleLengthCm: data.vehicle_length_cm,
            vehicleWidthCm: data.vehicle_width_cm,
            vehicleHeightCm: data.vehicle_height_cm,
            payloadKg: data.payload_kg,
          });
        } else {
          setProfileError('Profil nemá platnou roli. Použijte poslední Supabase migraci a znovu načtěte účet.');
        }
      } catch (error: unknown) {
        if (!active) return;
        setProfileError(error instanceof Error ? error.message : 'Nepodařilo se načíst profil uživatele.');
      } finally {
        if (active) setProfileLoading(false);
      }
    })();

    const channel = client
      .channel(`profile-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, ({ new: row }) => {
        if (!active) return;
        if (row.account_type === 'carrier' || row.account_type === 'shipper') setAccountRole(row.account_type);
        setIsAdmin(row.role === 'admin');
        setProfileName(`${row.first_name ?? ''} ${row.last_name ?? ''}`.trim());
        setProfileSummary({
          isPro: row.is_pro === true && row.subscription_status === 'active',
          subscriptionStatus: row.subscription_status ?? 'free',
          ico: row.ico ?? null,
          vehicleType: row.vehicle_type ?? null,
          vehicleLengthCm: row.vehicle_length_cm ?? null,
          vehicleWidthCm: row.vehicle_width_cm ?? null,
          vehicleHeightCm: row.vehicle_height_cm ?? null,
          payloadKg: row.payload_kg ?? null,
        });
      })
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [user]);
  useEffect(() => {
    if (!user || !accountRole || !supabase) {
      if (!user && showPreview) {
        setOrders(SEED_ORDERS);
        setMyOrders([]);
      }
      return;
    }

    const client = supabase;
    let active = true;
    setOrdersLoading(true);
    setOrdersError(null);
    const load = async () => {
      try {
        const [availableOrders, ownOrders] = await Promise.all([
          fetchMarketplaceOrders(),
          accountRole === 'shipper'
            ? client.from('orders').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
              if (error) throw error;
              return ((data ?? []) as MarketplaceOrderRow[]).map(mapMarketplaceOrder);
            })
            : Promise.resolve([] as Order[]),
        ]);
        if (!active) return;
        setOrders(availableOrders);
        setMyOrders(ownOrders);
        setSelectedId((current) => availableOrders.some((order) => order.id === current) ? current : availableOrders[0]?.id ?? null);
      } catch (error) {
        if (!active) return;
        setOrdersError(error instanceof Error ? `Zakázky se nepodařilo načíst: ${error.message}` : 'Zakázky se nepodařilo načíst.');
      } finally {
        if (active) setOrdersLoading(false);
      }
    };
    void load();

    const channel = client
      .channel(`orders-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { void load(); })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && active) setOrdersError('Živé aktualizace zakázek nejsou dostupné.');
      });

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [user, accountRole, showPreview]);

  const effectiveMode: AccountMode = user ? (profileSummary.isPro ? 'PRO' : 'FREE') : mode;
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const filtered = useMemo(() => vehicle === 'All' ? orders : orders.filter((o) => o.vehicle === vehicle), [orders, vehicle]);
  const notify = useCallback((msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 3500); }, []);
  const switchAccountRole = useCallback(async (nextRole: AccountRole) => {
    if (!user || !supabase || !isAdmin || nextRole === accountRole) return;
    if (nextRole === 'carrier' && !/^\d{8}$/.test(profileSummary.ico ?? '')) {
      notify('Pro režim dopravce nejdřív doplňte platné IČO v nastavení profilu.');
      setProfileOpen(true);
      return;
    }
    const { error } = await supabase.rpc('set_admin_account_mode', { requested_account_type: nextRole });
    if (error) {
      notify(`Režim účtu se nepodařilo změnit: ${error.message}`);
      return;
    }
    setAccountRole(nextRole);
    setAdminPage(false);
    window.location.hash = '#/';
    notify(nextRole === 'carrier' ? 'Přepnuto do režimu dopravce.' : 'Přepnuto do režimu poptávajícího.');
  }, [user, isAdmin, accountRole, profileSummary.ico, notify]);
  const reloadProfile = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase.from('profiles')
        .select('account_type, role, first_name, last_name, ico, is_pro, subscription_status, vehicle_type, vehicle_length_cm, vehicle_width_cm, vehicle_height_cm, payload_kg')
        .eq('id', user.id)
        .single();
      if (error) {
        notify(`Aktualizace profilu se nepodařila: ${error.message}`);
        return;
      }
      if (data.account_type !== 'carrier' && data.account_type !== 'shipper') {
        notify('Profil má neplatnou roli uživatele.');
        return;
      }
      setIsAdmin(data.role === 'admin');
      setAccountRole(data.account_type);
      setProfileName(`${data.first_name} ${data.last_name}`.trim());
      setProfileSummary({
        isPro: data.is_pro === true && data.subscription_status === 'active',
        subscriptionStatus: data.subscription_status ?? 'free',
        ico: data.ico ?? null,
        vehicleType: data.vehicle_type ?? null,
        vehicleLengthCm: data.vehicle_length_cm ?? null,
        vehicleWidthCm: data.vehicle_width_cm ?? null,
        vehicleHeightCm: data.vehicle_height_cm ?? null,
        payloadKg: data.payload_kg ?? null,
      });
    } catch (error) {
      notify(error instanceof Error ? `Aktualizace profilu se nepodařila: ${error.message}` : 'Aktualizace profilu se nepodařila.');
    }
  }, [user, notify]);
  useEffect(() => {
    const handleReturn = () => {
      if (window.location.hash.includes('success=1')) {
        notify('Platba přijatá. Aktivace PRO proběhne po potvrzení Stripe webhooku.');
        void reloadProfile();
      }
      if (window.location.hash.includes('/subscription') && user && accountRole === 'carrier') setProfileOpen(true);
    };
    window.addEventListener('hashchange', handleReturn);
    handleReturn();
    return () => window.removeEventListener('hashchange', handleReturn);
  }, [user, accountRole, reloadProfile, notify]);
  useEffect(() => {
    if (!selected) {
      setOrderContact(null);
      setContactError(null);
      return;
    }

    let active = true;
    setOrderContact(null);
    setContactError(null);
    const canRead = effectiveMode === 'PRO' || accountRole === 'shipper';
    if (!canRead) {
      setContactLoading(false);
      return;
    }
    if (!user || !supabase) {
      if (showPreview && selected.phone) setOrderContact({ phone: selected.phone, email: selected.email ?? null });
      setContactLoading(false);
      return;
    }

    const client = supabase;
    setContactLoading(true);
    void (async () => {
      try {
        const { data, error } = await client.rpc('get_order_contact', { requested_order_id: selected.id });
        if (!active) return;
        if (error) {
          setContactError(`Kontaktní údaje se nepodařilo načíst: ${error.message}`);
        } else {
          const contact = Array.isArray(data) ? data[0] : data;
          if (contact && typeof contact.phone === 'string') setOrderContact({ phone: contact.phone, email: contact.email ?? null });
          else setContactError('Kontaktní údaje k této zakázce nebyly nalezeny.');
        }
      } catch (error: unknown) {
        if (active) setContactError(error instanceof Error ? error.message : 'Kontaktní údaje se nepodařilo načíst.');
      } finally {
        if (active) setContactLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selected, effectiveMode, accountRole, user, showPreview]);
  useEffect(() => {
    if (!user || !supabase) {
      setUnreadNotifications(0);
      return;
    }
    const client = supabase;
    let active = true;
    const loadUnread = async () => {
      const { count, error } = await client.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null);
      if (!active) return;
      if (error) {
        notify(`Notifikace se nepodařilo načíst: ${error.message}`);
      } else {
        setUnreadNotifications(count ?? 0);
      }
    };
    void loadUnread();
    const channel = client
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        if (!active) return;
        setUnreadNotifications((count) => count + 1);
        notify('Máte novou zprávu nebo hodnocení.');
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && active) notify('Živé notifikace nejsou dostupné.');
      });
    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [user, notify]);
  const refreshOrders = async () => {
    if (!user || !supabase) return;
    try {
      const currentOrders = await fetchMarketplaceOrders();
      setOrders(currentOrders);
      if (accountRole === 'shipper') {
        const { data, error } = await supabase.from('orders').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        setMyOrders(((data ?? []) as MarketplaceOrderRow[]).map(mapMarketplaceOrder));
      }
    } catch (error) {
      notify(error instanceof Error ? `Aktualizace zakázek selhala: ${error.message}` : 'Aktualizace zakázek selhala.');
    }
  };
  const addOrder = async (order: Order) => {
    if (!supabase || !user || accountRole !== 'shipper') throw new Error('Zakázku může zveřejnit pouze přihlášený poptávající.');
    const { data, error } = await supabase.rpc('create_order_with_contact', toOrderPayload(order));
    if (error) throw new Error(`Zakázka se nepodařila uložit: ${error.message}`);
    const createdId = typeof data === 'string' ? data : '';
    if (!createdId) throw new Error('Databáze zakázku vytvořila bez platného identifikátoru.');
    setModalOpen(false);
    await refreshOrders();
    setSelectedId(createdId);
    notify('Poptávka byla bezpečně uložena do databáze.');
  };
  const startCheckout = async () => {
    if (!supabase) return notify('Platby nejsou nakonfigurovány.');
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session');
      const checkoutUrl = data && typeof data.url === 'string' ? data.url : null;
      if (error || !checkoutUrl) return notify(error?.message ?? 'Platební relaci se nepodařilo vytvořit.');
      window.location.assign(checkoutUrl);
    } catch (error) {
      notify(error instanceof Error ? `Platební relaci se nepodařilo vytvořit: ${error.message}` : 'Platební relaci se nepodařilo vytvořit.');
    }
  };
  const openCustomerPortal = async () => {
    if (!supabase) return notify('Správa předplatného není nakonfigurována.');
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');
      const portalUrl = data && typeof data.url === 'string' ? data.url : null;
      if (error || !portalUrl) return notify(error?.message ?? 'Správu předplatného se nepodařilo otevřít.');
      window.location.assign(portalUrl);
    } catch (error) {
      notify(error instanceof Error ? `Správu předplatného se nepodařilo otevřít: ${error.message}` : 'Správu předplatného se nepodařilo otevřít.');
    }
  };
  const claimOrder = async () => {
    if (!supabase || !selected) return;
    try {
      const { error } = await supabase.rpc('claim_order', { requested_order_id: selected.id });
      if (error) return notify(`Zakázku se nepodařilo přijmout: ${error.message}`);
      await refreshOrders();
      notify('Zakázka byla přiřazena vašemu účtu.');
    } catch (error) {
      notify(error instanceof Error ? `Zakázku se nepodařilo přijmout: ${error.message}` : 'Zakázku se nepodařilo přijmout.');
    }
  };
  const completeOrder = async (orderId = selected?.id) => {
    if (!supabase || !orderId) return;
    try {
      const { error } = await supabase.rpc('complete_order', { requested_order_id: orderId });
      if (error) return notify(`Dokončení se nepodařilo: ${error.message}`);
      await refreshOrders();
      notify('Přeprava označena jako dokončená. Nyní si můžete vzájemně udělit hodnocení.');
    } catch (error) {
      notify(error instanceof Error ? `Dokončení se nepodařilo: ${error.message}` : 'Dokončení se nepodařilo.');
    }
  };
  const cancelOrder = async (orderId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.rpc('cancel_order', { requested_order_id: orderId });
      if (error) return notify(`Poptávku se nepodařilo zrušit: ${error.message}`);
      await refreshOrders();
      notify('Poptávka byla zrušena.');
    } catch (error) {
      notify(error instanceof Error ? `Poptávku se nepodařilo zrušit: ${error.message}` : 'Poptávku se nepodařilo zrušit.');
    }
  };
  const markNotificationsRead = async () => {
    if (!supabase || !user || unreadNotifications === 0) return;
    try {
      const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
      if (error) return notify(`Notifikace se nepodařilo označit jako přečtené: ${error.message}`);
      setUnreadNotifications(0);
      notify('Všechny notifikace byly označeny jako přečtené.');
    } catch (error) {
      notify(error instanceof Error ? `Notifikace se nepodařilo označit jako přečtené: ${error.message}` : 'Notifikace se nepodařilo označit jako přečtené.');
    }
  };
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
  if (legalPage) {
    return <div className="min-h-screen bg-ink-950 text-ink-200"><LegalPages page={legalPage} /><SiteFooter /><CookieConsent /></div>;
  }
  if (authLoading) {
    return <div className="min-h-screen bg-ink-950 text-ink-200"><main className="flex min-h-[65vh] items-center justify-center bg-ink-950 text-sm text-ink-400">Načítám přihlášení…</main><SiteFooter /><CookieConsent /></div>;
  }
  if (!user && !showPreview) {
    return <div className="min-h-screen bg-ink-950 text-ink-200"><AuthScreen onPreview={() => setShowPreview(true)} initialError={authError} /><SiteFooter /><CookieConsent /></div>;
  }
  if (user && (profileLoading || !accountRole) && !profileError) {
    return <div className="min-h-screen bg-ink-950 text-ink-200"><main className="flex min-h-[65vh] items-center justify-center text-sm text-ink-400">Načítám profil…</main><SiteFooter /><CookieConsent /></div>;
  }
  if (user && profileError) {
    return <div className="min-h-screen bg-ink-950 text-ink-200"><main className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center"><h1 className="text-lg font-bold text-white">Profil není dostupný</h1><p role="alert" className="mt-3 max-w-lg text-sm text-danger-300">{profileError}</p><p className="mt-2 max-w-lg text-xs leading-5 text-ink-500">Zkontrolujte, zda jsou v Supabase spuštěné databázové migrace pro uživatelské role.</p><button onClick={signOut} className="mt-5 rounded-lg border border-ink-600 px-4 py-2 text-xs font-semibold text-ink-200 hover:bg-ink-800">Odhlásit se</button></main><SiteFooter /><CookieConsent /></div>;
  }
  const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name : '';
  const lastName = typeof user?.user_metadata.last_name === 'string' ? user.user_metadata.last_name : '';
  const displayName = profileName || [firstName, lastName].filter(Boolean).join(' ') || user?.email || 'Návštěvník';
  const initials = [firstName, lastName].filter(Boolean).map((name) => name[0]).join('').toUpperCase()
    || displayName[0]?.toUpperCase()
    || 'U';
  return <div className="min-h-screen bg-ink-950 text-ink-200">
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.08] bg-ink-950/90 px-3 backdrop-blur-xl sm:px-6">
      <Logo />
      <div className="hidden items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.035] p-1 md:flex">
        {accountRole === 'carrier'
          ? <><a href="#orders" className="rounded-lg px-4 py-2 text-xs font-medium text-ink-300 hover:text-white">Vyhledávání</a><a href="#map" className="rounded-lg px-4 py-2 text-xs font-medium text-ink-500 hover:text-ink-200">Mapa zakázek</a></>
          : <a href="#my-orders" className="rounded-lg bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white">Moje poptávky</a>}
        {isAdmin && <a href="#/admin" className="rounded-lg px-3 py-2 text-xs font-semibold text-accent-300 hover:bg-accent-500/10">Administrace</a>}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3">
        {user && <button onClick={() => void markNotificationsRead()} aria-label={`${unreadNotifications} nepřečtených notifikací`} title={`${unreadNotifications} nepřečtených notifikací`} className="relative rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white">
          <Bell size={17} />{unreadNotifications > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
        </button>}
        <button onClick={() => setProfileOpen(true)} aria-label="Nastavení profilu" title="Nastavení profilu" className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white"><Settings size={16} /></button>
        {isAdmin && <button onClick={() => void switchAccountRole(accountRole === 'carrier' ? 'shipper' : 'carrier')} title={accountRole === 'carrier' ? 'Přepnout do režimu poptávajícího' : 'Přepnout do režimu dopravce'} className="flex items-center gap-1 rounded-xl border border-accent-500/25 bg-accent-500/[0.08] px-2 py-2 text-[10px] font-bold text-accent-200 hover:bg-accent-500/15 sm:px-3 sm:text-xs"><ArrowDownUp size={13} /><span>{accountRole === 'carrier' ? 'Dopravce' : 'Poptávající'}</span></button>}
        {accountRole === 'carrier'
          ? <button onClick={() => user ? setProfileOpen(true) : setMode(mode === 'PRO' ? 'FREE' : 'PRO')} className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-bold transition sm:px-3 sm:text-xs ${effectiveMode === 'PRO' ? 'border-accent-500/40 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20' : 'border-ink-600 bg-ink-800 text-ink-400 hover:text-ink-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${effectiveMode === 'PRO' ? 'bg-success-400 shadow-[0_0_8px_#22c55e]' : 'bg-ink-500'}`} /><span>{effectiveMode === 'PRO' ? 'PRO účet' : 'FREE účet'}</span><ChevronDown size={13} /></button>
          : <span className="hidden rounded-xl border border-success-500/25 bg-success-500/[0.07] px-2.5 py-2 text-[11px] font-bold text-success-300 sm:inline-flex">Poptávající · zdarma</span>}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-ink-300" title={displayName}>{initials}</div>
        {user ? <button onClick={signOut} aria-label="Odhlásit se" title={`Odhlásit se jako ${displayName}`} className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-800 hover:text-ink-200"><LogOut size={16} /></button> : <button onClick={() => setShowPreview(false)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-accent-400 hover:bg-ink-800">Přihlásit se</button>}
      </div>
    </header>
    {ordersError && <p role="alert" className="mx-auto mt-3 max-w-5xl rounded-xl border border-danger-500/25 bg-danger-500/10 px-4 py-3 text-xs text-danger-200">{ordersError}</p>}
    {adminPage
      ? isAdmin && user
        ? <AdminUsersPanel currentUserId={user.id} onNotify={notify} />
        : <main className="mx-auto min-h-[65vh] max-w-3xl px-4 py-12 text-center"><h1 className="text-xl font-bold text-white">Administrace není dostupná</h1><p className="mt-2 text-sm text-ink-400">Tato část je přístupná pouze správci.</p><a href="#/" className="mt-5 inline-flex rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white">Zpět do aplikace</a></main>
      : accountRole === 'carrier' ? <main className="mx-auto grid max-w-[1800px] grid-cols-1 pb-20 lg:h-[calc(100dvh-64px)] lg:min-h-0 lg:grid-cols-[300px_minmax(0,1fr)_350px] lg:grid-rows-1 lg:overflow-hidden lg:pb-0 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
      <aside id="orders" className="order-2 flex min-h-0 flex-col border-b border-white/[0.08] bg-white/[0.015] lg:order-1 lg:h-full lg:border-b-0 lg:border-r"><div className="flex items-center justify-between gap-3 px-4 pb-3 pt-5 sm:px-5"><div><h1 className="text-base font-bold text-white">Dostupné zakázky</h1><p className="mt-1 text-[11px] text-ink-500"><span className="text-success-400">{filtered.length} aktivních</span>{ordersLoading ? ' · načítám…' : ' · z databáze'}</p></div></div><div className="flex items-center gap-2 px-4 pb-4 sm:px-5"><div className="relative flex-1"><ArrowDownUp size={13} className="pointer-events-none absolute left-3 top-2.5 text-ink-500" /><select value={vehicle} onChange={(e) => setVehicle(e.target.value as typeof vehicle)} className="field h-9 appearance-none pl-8 pr-7 text-[11px]"><option value="All">{VEHICLE_LABELS.All}</option><option value="Combi">{VEHICLE_LABELS.Combi}</option><option value="Van">{VEHICLE_LABELS.Van}</option><option value="Trailer">{VEHICLE_LABELS.Trailer}</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-3 text-ink-500" /></div><button aria-label="Nastavení filtru" className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5 text-ink-400 transition hover:text-white"><Gauge size={14} /></button></div><div className="flex min-h-0 gap-3 overflow-x-auto px-4 pb-4 sm:px-5 lg:flex-1 lg:flex-col lg:space-y-2.5 lg:overflow-x-hidden lg:overflow-y-auto">{filtered.map((order) => <div key={order.id} className="w-[min(84vw,340px)] shrink-0 lg:w-full"><OrderCard order={order} selected={order.id === selectedId} onClick={() => setSelectedId(order.id)} /></div>)}{filtered.length === 0 && <div className="w-full py-8 text-center text-xs text-ink-500">{ordersLoading ? 'Načítám zakázky…' : 'Zatím zde nejsou žádné zakázky.'}</div>}</div><div className="hidden border-t border-white/[0.08] px-5 py-3 lg:block"><div className="flex items-center gap-2 text-[10px] text-ink-500"><ShieldCheck size={14} className="text-success-500" /> Kontakty jsou zpřístupněny přes ověření předplatného</div></div></aside>
      <section id="map" className="relative order-1 h-[380px] min-h-0 bg-ink-950 p-3 sm:h-[480px] sm:p-5 lg:order-2 lg:h-full"><div className="mb-3 flex items-center justify-between gap-2 px-1"><div className="flex items-center gap-2 text-xs text-ink-400"><MapPin size={13} className="text-accent-400" /> Česko · západní region</div><div className="flex items-center gap-2 text-[10px] text-ink-400 sm:gap-3"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-400" /> Nakládka</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-400" /> Vyložení</span></div></div><div className="h-[calc(100%-32px)] min-h-0"><FreightMap order={selected} orders={orders} onSelectOrder={setSelectedId} /></div><div className="pointer-events-none absolute bottom-8 left-8 hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-900/85 px-3 py-2 text-[10px] text-ink-400 shadow-lg backdrop-blur sm:flex"><Sparkles size={13} className="text-warning-400" /> Výběrem markeru otevřete detail zakázky</div></section>
      <aside className="order-3 min-h-[620px] border-t border-white/[0.08] bg-white/[0.015] lg:h-full lg:min-h-0 lg:border-l lg:border-t-0"><DetailPanel order={selected} mode={effectiveMode} role="carrier" userId={user?.id} contact={orderContact} contactLoading={contactLoading} contactError={contactError} isOwner={false} onUpgrade={() => void startCheckout()} onClaim={() => void claimOrder()} onComplete={() => void completeOrder()} onReport={() => setReportOpen(true)} /></aside>
    </main> : <main className="mx-auto min-h-[65vh] max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-300">Pro poptávající · zdarma</p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Zadejte, co potřebujete převézt</h1>
            <p className="mt-3 text-sm leading-6 text-ink-400">Vytvořte poptávku na přepravu a spojte se s dopravci, kteří hledají zakázky ve vašem regionu.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent-500/15 transition hover:bg-accent-600">
            <Plus size={17} /> Vložit zakázku zdarma
          </button>
        </div>
      </section>
      <section id="my-orders" className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-white">Moje poptávky</h2><p className="mt-1 text-xs text-ink-500">Poptávky uložené ve vašem účtu.</p></div>
          {myOrders.length > 0 && <span className="rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-300">{myOrders.length}</span>}
        </div>
        {ordersLoading && myOrders.length === 0
          ? <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center text-xs text-ink-500">Načítám poptávky z databáze…</div>
          : myOrders.length === 0
          ? <div className="rounded-2xl border border-dashed border-ink-700 bg-white/[0.015] px-5 py-10 text-center">
            <Package size={24} className="mx-auto text-ink-500" />
            <p className="mt-3 text-sm font-semibold text-ink-300">Zatím nemáte žádné poptávky</p>
            <p className="mt-1 text-xs text-ink-500">Vložte první přepravu zdarma. Zobrazí se zde po vytvoření.</p>
          </div>
          : <div className="grid gap-3 sm:grid-cols-2">{myOrders.map((order) =>
            <article key={order.id} onClick={() => setSelectedId(order.id)} className={`cursor-pointer rounded-2xl border p-4 transition ${selectedId === order.id ? 'border-accent-400/50 bg-accent-500/[0.08]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.16]'}`}>
              <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-white">{order.title}</h3><span className="text-sm font-bold text-success-400">{formatCZK(order.price)}</span></div>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-400"><MapPin size={13} className="text-accent-400" />{order.from}<ArrowRight size={13} className="text-ink-600" />{order.to}</p>
              <p className="mt-3 text-[10px] text-ink-500">{order.status === 'completed' ? 'Přeprava dokončena' : order.status === 'cancelled' ? 'Poptávka zrušena' : order.claimedBy ? 'Dopravce přiřazen' : 'Čeká na dopravce'}</p>
              {order.status === 'open' && order.claimedBy && <button onClick={(event) => { event.stopPropagation(); setSelectedId(order.id); void completeOrder(order.id); }} className="mt-3 rounded-lg bg-success-500/15 px-3 py-2 text-[11px] font-semibold text-success-300 hover:bg-success-500/25">Označit jako dokončenou</button>}
              {order.status === 'open' && !order.claimedBy && <button onClick={(event) => { event.stopPropagation(); void cancelOrder(order.id); }} className="ml-2 mt-3 rounded-lg bg-danger-500/10 px-3 py-2 text-[11px] font-semibold text-danger-300 hover:bg-danger-500/20">Zrušit poptávku</button>}
            </article>
          )}</div>}
      </section>
      {selected && myOrders.some((order) => order.id === selected.id) && <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <DetailPanel order={selected} mode="FREE" role="shipper" userId={user?.id} contact={orderContact} contactLoading={contactLoading} contactError={contactError} isOwner={true} onUpgrade={() => undefined} onClaim={() => undefined} onComplete={() => void completeOrder()} onReport={() => setReportOpen(true)} />
      </section>}
    </main>}
    <SiteFooter />
    <CookieConsent />
    {modalOpen && accountRole === 'shipper' && <AddOrderModal onClose={() => setModalOpen(false)} onAdd={addOrder} defaultEmail={user?.email ?? ''} />}
    {user && profileOpen && accountRole && <ProfileSettings userId={user.id} role={accountRole} isAdmin={isAdmin} name={displayName} email={user.email ?? ''} profile={profileSummary} onClose={() => setProfileOpen(false)} onSave={(summary, name) => { setProfileSummary(summary); setProfileName(name); }} onUpgrade={() => void startCheckout()} onManageSubscription={() => void openCustomerPortal()} />}
    {user && reportOpen && selected && <ReportDialog orderId={selected.id} reportedUserId={selected.ownerId} reporterId={user.id} onClose={() => setReportOpen(false)} onSubmitted={() => { setReportOpen(false); notify('Děkujeme, nahlášení bylo předáno ke kontrole.'); }} />}
    {!adminPage && <nav aria-label="Spodní navigace" className={`fixed inset-x-0 bottom-0 z-40 grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} border-t border-white/[0.08] bg-ink-950/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] backdrop-blur md:hidden`}>
      {accountRole === 'carrier' ? <>
        <a href="#orders" className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-ink-300"><Package size={17} />Zakázky</a>
        <a href="#map" className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-ink-300"><MapPin size={17} />Mapa</a>
        <button onClick={() => setProfileOpen(true)} className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-ink-300"><Settings size={17} />Profil</button>
        {isAdmin && <a href="#/admin" className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-accent-300"><ShieldCheck size={17} />Admin</a>}
      </> : <>
        <a href="#my-orders" className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-ink-300"><Package size={17} />Poptávky</a>
        <button onClick={() => setModalOpen(true)} className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-accent-300"><Plus size={17} />Vložit</button>
        <button onClick={() => setProfileOpen(true)} className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-ink-300"><Settings size={17} />Profil</button>
        {isAdmin && <a href="#/admin" className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold text-accent-300"><ShieldCheck size={17} />Admin</a>}
      </>}
    </nav>}
    {toast && <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-success-500/30 bg-ink-800 px-4 py-3 text-xs font-semibold text-ink-100 shadow-2xl shadow-black/40 animate-fade-in"><Check size={15} className="text-success-400" />{toast}</div>}
  </div>;
}

export default App;
