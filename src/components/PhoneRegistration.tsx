import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Phone, ShieldCheck, Truck } from 'lucide-react';
import { sendPhoneVerificationCode, verifyPhoneCode } from '@/lib/supabase';

type PhoneRegistrationProps = {
  authError: string;
  supabaseConfigured: boolean;
  onAuthErrorClear: () => void;
};

function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (compact.startsWith('+')) return compact;
  if (/^\d{9}$/.test(compact)) return `+420${compact}`;
  return compact;
}

function isValidPhone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : 'Požadavek se nepodařilo dokončit. Zkuste to prosím znovu.';
}

export function PhoneRegistration({ authError, supabaseConfigured, onAuthErrorClear }: PhoneRegistrationProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const requestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      setError('Zadejte platné telefonní číslo v mezinárodním formátu, například +420 777 123 456.');
      return;
    }

    setBusy(true);
    setError('');
    onAuthErrorClear();
    try {
      await sendPhoneVerificationCode(normalizedPhone);
      setPhone(normalizedPhone);
      setCodeSent(true);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = code.trim();
    if (!/^\d{6}$/.test(token)) {
      setError('Zadejte šestimístný ověřovací kód z SMS.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await verifyPhoneCode(phone, token);
    } catch (verificationError) {
      setError(errorMessage(verificationError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-ink-950 px-4 py-10 text-ink-200">
      <section className="w-full max-w-md rounded-2xl border border-ink-700/70 bg-ink-900/80 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/20">
            <Truck size={21} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">CargoBoard <span className="text-accent-400">CZ</span></h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-500">Síť místní dopravy</p>
          </div>
        </div>

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
          {codeSent ? <ShieldCheck size={23} /> : <Phone size={23} />}
        </div>
        <h2 className="text-xl font-bold text-white">
          {codeSent ? 'Ověřte své telefonní číslo' : 'Začněte registrací'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-400">
          {codeSent
            ? `Poslali jsme vám SMS na ${phone}. Zadejte kód a dokončete registraci.`
            : 'Zadejte telefonní číslo. Pošleme vám SMS kód, kterým ověříme váš účet.'}
        </p>

        {!supabaseConfigured ? (
          <div role="alert" className="mt-6 rounded-lg border border-warning-500/25 bg-warning-500/[0.06] px-4 py-3 text-xs leading-5 text-warning-300">
            Registrace SMS vyžaduje nastavený Supabase projekt. Doplňte proměnné VITE_SUPABASE_URL a VITE_SUPABASE_PUBLISHABLE_KEY a v nastavení Supabase zapněte přihlašování telefonem a SMS provider.
          </div>
        ) : (
          <>
            {authError && <p role="alert" className="mt-5 rounded-lg bg-danger-500/10 px-3 py-2 text-xs leading-5 text-danger-400">{authError}</p>}
            {error && <p role="alert" className="mt-5 rounded-lg bg-danger-500/10 px-3 py-2 text-xs leading-5 text-danger-400">{error}</p>}
            {codeSent ? (
              <form onSubmit={verifyCode} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-300">Ověřovací kód</span>
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    value={code}
                    className="field text-center text-lg tracking-[0.35em]"
                  />
                </label>
                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white transition hover:bg-accent-600 disabled:cursor-wait disabled:opacity-60">
                  <ShieldCheck size={17} /> {busy ? 'Ověřuji…' : 'Ověřit číslo a pokračovat'}
                </button>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <button type="button" disabled={busy} onClick={() => { setCodeSent(false); setCode(''); setError(''); }} className="flex items-center gap-1 text-ink-400 transition hover:text-white disabled:opacity-50">
                    <ArrowLeft size={13} /> Změnit číslo
                  </button>
                  <button type="button" disabled={busy} onClick={() => void requestCode()} className="flex items-center gap-1 font-medium text-accent-400 transition hover:text-accent-300 disabled:opacity-50">
                    Poslat kód znovu <ArrowRight size={13} />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={requestCode} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-300">Telefonní číslo</span>
                  <input
                    autoComplete="tel"
                    autoFocus
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+420 777 123 456"
                    type="tel"
                    value={phone}
                    className="field"
                  />
                  <span className="mt-1.5 block text-[11px] text-ink-500">České číslo můžete zadat i bez předvolby +420.</span>
                </label>
                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white transition hover:bg-accent-600 disabled:cursor-wait disabled:opacity-60">
                  <Phone size={16} /> {busy ? 'Odesílám SMS…' : 'Poslat ověřovací SMS'}
                </button>
                <p className="text-center text-[11px] leading-5 text-ink-500">Ověřovací SMS může být zpoplatněna podle tarifu vašeho operátora.</p>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
