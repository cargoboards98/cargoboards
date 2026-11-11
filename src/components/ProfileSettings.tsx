import { useEffect, useState } from 'react';
import { CreditCard, Star, Truck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AccountRole } from '@/types';

interface ProfileValues {
  first_name: string;
  last_name: string;
  phone: string;
  ico: string;
  vehicle_type: string;
  vehicle_length_cm: string;
  vehicle_width_cm: string;
  vehicle_height_cm: string;
  payload_kg: string;
}

interface Review {
  id: string;
  rating: number;
  body: string;
  created_at: string;
}

export interface ProfileSummary {
  isPro: boolean;
  subscriptionStatus: string;
  ico: string | null;
  vehicleType: string | null;
  vehicleLengthCm: number | null;
  vehicleWidthCm: number | null;
  vehicleHeightCm: number | null;
  payloadKg: number | null;
}

export function ProfileSettings({
  userId,
  role,
  name,
  email,
  profile,
  onClose,
  onSave,
  onUpgrade,
  onManageSubscription,
}: {
  userId: string;
  role: AccountRole;
  name: string;
  email: string;
  profile: ProfileSummary;
  onClose: () => void;
  onSave: (summary: ProfileSummary, displayName: string) => void;
  onUpgrade: () => void;
  onManageSubscription: () => void;
}) {
  const [values, setValues] = useState<ProfileValues>({
    first_name: name.split(' ')[0] ?? '',
    last_name: name.split(' ').slice(1).join(' '),
    phone: '',
    ico: '',
    vehicle_type: profile.vehicleType ?? '',
    vehicle_length_cm: profile.vehicleLengthCm?.toString() ?? '',
    vehicle_width_cm: profile.vehicleWidthCm?.toString() ?? '',
    vehicle_height_cm: profile.vehicleHeightCm?.toString() ?? '',
    payload_kg: profile.payloadKg?.toString() ?? '',
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    void (async () => {
      try {
        const { data, error: loadError } = await client.from('profiles').select('first_name, last_name, phone, ico').eq('id', userId).single();
        if (!active) return;
        if (loadError) setError(`Profil se nepodařilo načíst: ${loadError.message}`);
        else setValues((current) => ({ ...current, first_name: data.first_name, last_name: data.last_name, phone: data.phone, ico: data.ico ?? '' }));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? `Profil se nepodařilo načíst: ${loadError.message}` : 'Profil se nepodařilo načíst.');
      }
    })();
    void (async () => {
      try {
        const { data, error: reviewError } = await client.from('reviews').select('id, rating, body, created_at').eq('reviewee_id', userId).order('created_at', { ascending: false }).limit(10);
        if (!active) return;
        if (reviewError) setError(`Hodnocení se nepodařilo načíst: ${reviewError.message}`);
        else setReviews(data ?? []);
      } catch (reviewError) {
        if (active) setError(reviewError instanceof Error ? `Hodnocení se nepodařilo načíst: ${reviewError.message}` : 'Hodnocení se nepodařilo načíst.');
      }
    })();
    return () => { active = false; };
  }, [userId]);

  const update = (key: keyof ProfileValues, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    if (role === 'carrier' && !/^\d{8}$/.test(values.ico)) {
      setError('Dopravce musí zadat platné osmimístné IČO.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    const numeric = (value: string) => value ? Number(value) : null;
    const patch = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim(),
      ...(role === 'carrier' ? { ico: values.ico } : {}),
      ...(role === 'carrier' ? {
        vehicle_type: values.vehicle_type.trim() || null,
        vehicle_length_cm: numeric(values.vehicle_length_cm),
        vehicle_width_cm: numeric(values.vehicle_width_cm),
        vehicle_height_cm: numeric(values.vehicle_height_cm),
        payload_kg: numeric(values.payload_kg),
      } : {}),
    };
    try {
      const { error: saveError } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (saveError) {
        setError(`Profil se nepodařilo uložit: ${saveError.message}`);
        return;
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? `Profil se nepodařilo uložit: ${saveError.message}` : 'Profil se nepodařilo uložit.');
      return;
    } finally {
      setSaving(false);
    }
    onSave({
      ...profile,
      ico: role === 'carrier' ? values.ico : profile.ico,
      vehicleType: role === 'carrier' ? patch.vehicle_type ?? null : profile.vehicleType ?? null,
      vehicleLengthCm: role === 'carrier' ? patch.vehicle_length_cm ?? null : profile.vehicleLengthCm ?? null,
      vehicleWidthCm: role === 'carrier' ? patch.vehicle_width_cm ?? null : profile.vehicleWidthCm ?? null,
      vehicleHeightCm: role === 'carrier' ? patch.vehicle_height_cm ?? null : profile.vehicleHeightCm ?? null,
      payloadKg: role === 'carrier' ? patch.payload_kg ?? null : profile.payloadKg ?? null,
    }, `${patch.first_name} ${patch.last_name}`.trim());
    setNotice('Profil byl uložen.');
  };

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="profile-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl sm:p-7">
        <header className="mb-5 flex items-start justify-between">
          <div><h2 id="profile-title" className="text-xl font-bold text-white">Nastavení profilu</h2><p className="mt-1 text-xs text-ink-500">{email} · {role === 'carrier' ? 'Dopravce' : 'Poptávající'}</p></div>
          <button onClick={onClose} aria-label="Zavřít nastavení" className="rounded-lg p-2 text-ink-400 hover:bg-ink-800"><X size={18} /></button>
        </header>
        {role === 'carrier' && <div className="mb-5 rounded-xl border border-accent-500/20 bg-accent-500/[0.06] p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">{profile.isPro ? 'CargoBoard PRO aktivní' : 'Bez aktivního předplatného'}</p><p className="mt-1 text-xs text-ink-400">{profile.isPro ? 'Přímé kontakty jsou odemčené.' : 'Předplatné 449 Kč měsíčně odemyká přímé kontakty.'}</p></div><CreditCard size={20} className="text-accent-300" /></div>
          <button type="button" onClick={profile.isPro ? onManageSubscription : onUpgrade} className="mt-3 w-full rounded-lg bg-accent-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-600">{profile.isPro ? 'Spravovat / zrušit předplatné' : 'Aktivovat PRO · 449 Kč/měsíc'}</button>
        </div>}
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink-300">Jméno<input required maxLength={80} value={values.first_name} onChange={(event) => update('first_name', event.target.value)} className="field mt-1.5" /></label>
            <label className="text-xs text-ink-300">Příjmení<input required maxLength={80} value={values.last_name} onChange={(event) => update('last_name', event.target.value)} className="field mt-1.5" /></label>
          </div>
          <label className="block text-xs text-ink-300">Telefon<input required maxLength={32} type="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} className="field mt-1.5" /></label>
          {role === 'carrier' && <>
            <label className="block text-xs text-ink-300">IČO dopravce<input required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={values.ico} onChange={(event) => update('ico', event.target.value.replace(/\D/g, '').slice(0, 8))} className="field mt-1.5" /></label>
            <div className="flex items-center gap-2 pt-2 text-xs font-bold uppercase tracking-wider text-ink-300"><Truck size={14} className="text-accent-300" /> Vozidlo / dodávka</div>
            <label className="block text-xs text-ink-300">Typ vozidla<input maxLength={80} value={values.vehicle_type} onChange={(event) => update('vehicle_type', event.target.value)} placeholder="např. dodávka s plachtou" className="field mt-1.5" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-ink-300">Délka (cm)<input type="number" min="1" value={values.vehicle_length_cm} onChange={(event) => update('vehicle_length_cm', event.target.value)} className="field mt-1.5" /></label>
              <label className="text-xs text-ink-300">Šířka (cm)<input type="number" min="1" value={values.vehicle_width_cm} onChange={(event) => update('vehicle_width_cm', event.target.value)} className="field mt-1.5" /></label>
              <label className="text-xs text-ink-300">Výška (cm)<input type="number" min="1" value={values.vehicle_height_cm} onChange={(event) => update('vehicle_height_cm', event.target.value)} className="field mt-1.5" /></label>
              <label className="text-xs text-ink-300">Nosnost (kg)<input type="number" min="1" value={values.payload_kg} onChange={(event) => update('payload_kg', event.target.value)} className="field mt-1.5" /></label>
            </div>
          </>}
          {error && <p role="alert" className="text-xs leading-5 text-danger-300">{error}</p>}
          {notice && <p role="status" className="text-xs text-success-300">{notice}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-accent-500 py-3 text-sm font-bold text-white hover:bg-accent-600 disabled:opacity-50">{saving ? 'Ukládám…' : 'Uložit profil'}</button>
        </form>
        <section className="mt-7 border-t border-white/[0.08] pt-5">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-white">Hodnocení</h3><span className="flex items-center gap-1 text-xs text-warning-300"><Star size={13} fill="currentColor" />{average ? average.toFixed(1) : '—'} <span className="text-ink-500">({reviews.length})</span></span></div>
          {reviews.length ? <ul className="mt-3 space-y-2">{reviews.map((review) => <li key={review.id} className="rounded-xl bg-white/[0.03] p-3"><div className="text-xs text-warning-300">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p className="mt-1 text-xs text-ink-300">{review.body || 'Bez komentáře'}</p><time className="mt-1 block text-[10px] text-ink-600">{new Date(review.created_at).toLocaleDateString('cs-CZ')}</time></li>)}</ul> : <p className="mt-3 text-xs text-ink-500">Zatím nemáte žádná hodnocení.</p>}
        </section>
      </section>
    </div>
  );
}
