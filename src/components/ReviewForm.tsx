import { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ReviewForm({
  orderId,
  revieweeId,
  reviewerId,
}: {
  orderId: string;
  revieweeId: string;
  reviewerId: string;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!supabase || busy || saved) return;
    setBusy(true);
    setError('');
    try {
      const { error: saveError } = await supabase.from('reviews').insert({
        order_id: orderId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        body: body.trim(),
      });
      if (saveError) {
        setError(saveError.code === '23505' ? 'Tuto zakázku jste již ohodnotili.' : `Hodnocení se nepodařilo uložit: ${saveError.message}`);
        return;
      }
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? `Hodnocení se nepodařilo uložit: ${saveError.message}` : 'Hodnocení se nepodařilo uložit.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5 rounded-xl border border-warning-500/20 bg-warning-500/[0.04] p-3">
      <h3 className="text-xs font-bold text-ink-200">Ohodnotit spolupráci</h3>
      {saved ? <p role="status" className="mt-2 text-xs text-success-300">Děkujeme za hodnocení.</p> : <>
        <div className="my-2 flex gap-1" role="group" aria-label="Počet hvězdiček">
          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} hvězdiček`} onClick={() => setRating(value)} className="p-1 text-warning-300"><Star size={18} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}
        </div>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={2} placeholder="Krátká recenze (nepovinná)" className="field resize-none text-xs" />
        {error && <p role="alert" className="mt-2 text-[11px] text-danger-300">{error}</p>}
        <button type="button" disabled={busy} onClick={() => void submit()} className="mt-2 w-full rounded-lg bg-warning-500 px-3 py-2 text-xs font-bold text-ink-950 disabled:opacity-50">{busy ? 'Ukládám…' : 'Odeslat hodnocení'}</button>
      </>}
    </section>
  );
}
