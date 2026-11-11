import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ReportDialog({
  orderId,
  reportedUserId,
  reporterId,
  onClose,
  onSubmitted,
}: {
  orderId: string;
  reportedUserId?: string;
  reporterId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!supabase || reason.trim().length < 5) {
      setError('Popište prosím důvod nahlášení alespoň pěti znaky.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: reportError } = await supabase.from('user_reports').insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId ?? null,
        order_id: orderId,
        reason: reason.trim(),
      });
      if (reportError) {
        setError(`Nahlášení se nepodařilo odeslat: ${reportError.message}`);
        return;
      }
      onSubmitted();
    } catch (reportError) {
      setError(reportError instanceof Error ? `Nahlášení se nepodařilo odeslat: ${reportError.message}` : 'Nahlášení se nepodařilo odeslat.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl">
        <header className="mb-4 flex items-center justify-between"><h2 id="report-title" className="font-bold text-white">Nahlásit závadný obsah</h2><button onClick={onClose} aria-label="Zavřít" className="rounded-lg p-2 text-ink-400 hover:bg-ink-800"><X size={17} /></button></header>
        <p className="mb-3 text-xs leading-5 text-ink-400">Popište, proč je zakázka nebo uživatel závadný. Nahlášení bude uloženo ke kontrole.</p>
        <textarea autoFocus maxLength={2000} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Například klamavá poptávka nebo nevhodný obsah…" className="field resize-none text-sm" />
        {error && <p role="alert" className="mt-2 text-xs text-danger-300">{error}</p>}
        <button disabled={busy} onClick={() => void submit()} className="mt-4 w-full rounded-xl bg-danger-500 px-4 py-3 text-sm font-bold text-white hover:bg-danger-600 disabled:opacity-50">{busy ? 'Odesílám…' : 'Odeslat nahlášení'}</button>
      </section>
    </div>
  );
}
