import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { sendPhoneVerificationCode, verifyPhoneCode } from '@/lib/supabase';

type PhoneRegistrationProps = {
  authError: string;
  supabaseConfigured: boolean;
  onAuthErrorClear: () => void;
};

type AuthMode = 'signup' | 'login';

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
  const [mode, setMode] = useState<AuthMode>('signup');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    onAuthErrorClear();
  };

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
      await sendPhoneVerificationCode(normalizedPhone, mode === 'signup');
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
    <main className="flex min-h-screen bg-ink-950 text-ink-200">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0b1220] p-10 lg:flex xl:p-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 -top-32 h-[30rem] w-[30rem] rounded-full bg-accent-500/[0.13] blur-[120px]" />
          <div className="absolute -bottom-48 right-0 h-[34rem] w-[34rem] rounded-full bg-cyan-500/[0.08] blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#94a3b8 0.7px, transparent 0.7px)', backgroundSize: '24px 24px' }} />
        </div>

        <a href="/" className="relative flex w-fit items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-400">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/20">
            <Truck size={21} strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-white">CargoBoard <span className="text-accent-400">CZ</span></span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-ink-500">Síť místní dopravy</span>
          </span>
        </a>

        <div className="relative my-16 max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/[0.08] px-3 py-1.5 text-xs font-medium text-accent-300">
            <span className="h-1.5 w-1.5 rounded-full bg-success-400 shadow-[0_0_8px_#22c55e]" />
            Místní doprava bez zbytečných kilometrů
          </span>
          <h1 className="text-4xl font-bold leading-[1.14] tracking-tight text-white xl:text-5xl">
            Každá cesta může
            <span className="mt-1 block bg-gradient-to-r from-accent-300 to-cyan-300 bg-clip-text text-transparent">vydělávat.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-ink-400">
            Propojujeme lidi, kteří potřebují něco převézt, s řidiči na cestě. Bez prázdných jízd, jednoduše a přehledně.
          </p>

          <div className="mt-10 max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-ink-200"><Package size={14} className="text-accent-400" /> Ukázka zakázky</span>
              <span className="rounded-md bg-success-400/10 px-2 py-1 text-[10px] font-semibold text-success-300">Dostupná</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-ink-900/70 px-3 py-2.5 text-xs text-ink-200">
                <MapPin size={14} className="shrink-0 text-accent-400" /> Praha
              </div>
              <ArrowRight size={15} className="shrink-0 text-ink-600" />
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-ink-900/70 px-3 py-2.5 text-xs text-ink-200">
                <MapPin size={14} className="shrink-0 text-success-400" /> Plzeň
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
              <span className="text-[11px] text-ink-500">Přehledná nabídka. Bez zbytečných telefonátů.</span>
              <span className="text-sm font-bold text-success-300">Příležitost čeká</span>
            </div>
          </div>

          <ul className="mt-8 grid gap-3 text-xs text-ink-400 sm:grid-cols-2">
            <li className="flex items-center gap-2"><Check size={14} className="text-success-400" /> Zakázky přehledně na jednom místě</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-success-400" /> Ověření účtu přes SMS</li>
          </ul>
        </div>

        <p className="relative text-[11px] text-ink-600">© CargoBoard CZ · Chytřejší místní doprava</p>
      </section>

      <section className="flex min-h-screen w-full flex-col lg:w-1/2">
        <header className="flex h-[72px] items-center justify-between px-5 sm:px-8 lg:justify-end lg:px-10">
          <a href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-400 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-white">
              <Truck size={19} strokeWidth={2.4} />
            </span>
            <span className="text-sm font-bold tracking-tight text-white">CargoBoard <span className="text-accent-400">CZ</span></span>
          </a>
          <p className="hidden text-xs text-ink-500 sm:block">
            {mode === 'signup' ? 'Už u nás máte účet?' : 'Jste u nás poprvé?'}
            {' '}
            <button type="button" onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')} className="font-semibold text-accent-400 transition hover:text-accent-300">
              {mode === 'signup' ? 'Přihlaste se' : 'Vytvořte si účet'}
            </button>
          </p>
          <span className="flex items-center gap-1.5 rounded-full border border-ink-700/70 bg-ink-900/60 px-2.5 py-1.5 text-[10px] font-medium text-ink-400 sm:hidden">
            <LockKeyhole size={11} className="text-accent-400" /> Bezpečné přihlášení
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-8 pt-4 sm:px-8 sm:pb-12 lg:px-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex items-center gap-2 text-[11px] font-medium text-ink-500">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${codeSent ? 'bg-success-400/10 text-success-300' : 'bg-accent-500 text-white'}`}>
                {codeSent ? <Check size={13} /> : '1'}
              </span>
              <span className={codeSent ? 'text-ink-400' : 'text-ink-200'}>Telefonní číslo</span>
              <span className="mx-1 h-px w-8 bg-ink-700 sm:w-12" />
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${codeSent ? 'bg-accent-500 text-white' : 'border border-ink-700 text-ink-500'}`}>2</span>
              <span className={codeSent ? 'text-ink-200' : 'text-ink-500'}>SMS kód</span>
            </div>

            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-400/15 bg-gradient-to-br from-accent-400/15 to-cyan-400/[0.06] text-accent-300 shadow-lg shadow-accent-950/30">
                {codeSent ? <ShieldCheck size={22} /> : <Phone size={21} />}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                {codeSent
                  ? 'Ještě potvrdit číslo'
                  : mode === 'signup' ? 'Vytvořte si účet' : 'Vítejte zpátky'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-400">
                {codeSent
                  ? `Odeslali jsme SMS na ${phone}. Zadejte šestimístný kód a ${mode === 'signup' ? 'dokončete registraci' : 'přihlaste se'}.`
                  : mode === 'signup'
                    ? 'Zaregistrujte se během chvilky. Stačí telefonní číslo, heslo nepotřebujete.'
                    : 'Přihlaste se bezpečně pomocí svého telefonního čísla a jednorázového kódu.'}
              </p>
            </div>

            {!supabaseConfigured ? (
              <div role="alert" className="rounded-xl border border-warning-500/25 bg-warning-500/[0.06] px-4 py-3.5 text-xs leading-5 text-warning-300">
                Registrace a přihlášení vyžadují Supabase projekt. Nastavte proměnné prostředí a v Supabase povolte Phone provider i SMS provider.
              </div>
            ) : (
              <div className="rounded-2xl border border-ink-700/70 bg-ink-900/65 p-5 shadow-2xl shadow-black/20 sm:p-7">
                {!codeSent && (
                  <div role="tablist" aria-label="Typ účtu" className="mb-6 grid grid-cols-2 rounded-xl border border-ink-700/70 bg-ink-950/70 p-1">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'signup'}
                      onClick={() => changeMode('signup')}
                      className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${mode === 'signup' ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-500 hover:text-ink-200'}`}
                    >
                      Vytvořit účet
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'login'}
                      onClick={() => changeMode('login')}
                      className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${mode === 'login' ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-500 hover:text-ink-200'}`}
                    >
                      Přihlásit se
                    </button>
                  </div>
                )}

                {authError && <p role="alert" className="mb-4 rounded-lg border border-danger-500/20 bg-danger-500/[0.08] px-3 py-2.5 text-xs leading-5 text-danger-300">{authError}</p>}
                {error && <p role="alert" className="mb-4 rounded-lg border border-danger-500/20 bg-danger-500/[0.08] px-3 py-2.5 text-xs leading-5 text-danger-300">{error}</p>}

                {codeSent ? (
                  <form onSubmit={verifyCode} className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-ink-200">Ověřovací kód</span>
                      <input
                        autoComplete="one-time-code"
                        autoFocus
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        value={code}
                        aria-label="Šestimístný ověřovací kód"
                        className="field h-12 text-center text-lg font-semibold tracking-[0.45em]"
                      />
                      <span className="mt-2 block text-[11px] text-ink-500">SMS kód je určen pouze pro vás. Nikomu ho nesdělujte.</span>
                    </label>
                    <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-950/30 transition hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-wait disabled:opacity-60">
                      <ShieldCheck size={17} /> {busy ? 'Ověřuji…' : mode === 'signup' ? 'Ověřit a vytvořit účet' : 'Ověřit a přihlásit se'}
                    </button>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/60 pt-4 text-xs">
                      <button type="button" disabled={busy} onClick={() => { setCodeSent(false); setCode(''); setError(''); }} className="flex items-center gap-1.5 rounded text-ink-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50">
                        <ArrowLeft size={13} /> Změnit číslo
                      </button>
                      <button type="button" disabled={busy} onClick={() => void requestCode()} className="flex items-center gap-1.5 rounded font-semibold text-accent-400 transition hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50">
                        Poslat nový kód <ArrowRight size={13} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={requestCode} className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-ink-200">Telefonní číslo</span>
                      <input
                        autoComplete="tel"
                        autoFocus
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+420 777 123 456"
                        type="tel"
                        value={phone}
                        aria-label="Telefonní číslo"
                        className="field h-12"
                      />
                      <span className="mt-2 block text-[11px] text-ink-500">České číslo lze zadat i bez předvolby +420.</span>
                    </label>
                    <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-950/30 transition hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-wait disabled:opacity-60">
                      <Phone size={16} /> {busy ? 'Odesílám SMS…' : mode === 'signup' ? 'Pokračovat registrací' : 'Pokračovat přihlášením'}
                      {!busy && <ArrowRight size={15} className="ml-auto" />}
                    </button>
                    <p className="flex items-start gap-2 text-[11px] leading-5 text-ink-500">
                      <LockKeyhole size={13} className="mt-0.5 shrink-0 text-ink-600" />
                      Pošleme vám jednorázový ověřovací kód. Heslo si pamatovat nemusíte.
                    </p>
                  </form>
                )}
              </div>
            )}

            <div className="mt-6 flex items-start justify-center gap-2 text-center text-[11px] leading-5 text-ink-600">
              <LockKeyhole size={12} className="mt-0.5 shrink-0" />
              Vaše připojení je zabezpečené a číslo ověřujeme přes SMS.
            </div>

            <p className="mt-8 text-center text-xs text-ink-500 sm:hidden">
              {mode === 'signup' ? 'Už máte účet?' : 'Ještě nemáte účet?'}
              {' '}
              <button type="button" onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')} className="font-semibold text-accent-400">
                {mode === 'signup' ? 'Přihlaste se' : 'Vytvořte si účet'}
              </button>
            </p>
          </div>
        </div>
        <footer className="px-5 pb-5 text-center text-[10px] text-ink-700 lg:hidden">© CargoBoard CZ · Chytřejší místní doprava</footer>
      </section>
    </main>
  );
}
