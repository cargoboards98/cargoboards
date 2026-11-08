import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'register';
type AccountType = 'driver' | 'company';

const ACCOUNT_OPTIONS: { id: AccountType; title: string; description: string }[] = [
  { id: 'driver', title: 'Řidič', description: 'Přepravuji jako jednotlivec' },
  { id: 'company', title: 'Firma', description: 'Poptávám nebo zajišťuji přepravu' },
];

interface AuthScreenProps {
  onPreview: () => void;
  initialError?: string | null;
}

export function AuthScreen({ onPreview, initialError }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [accountType, setAccountType] = useState<AccountType>('driver');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const isRegister = mode === 'register';

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setNotice(null);
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!supabase) {
      setError('Přihlášení není nakonfigurováno. Zkontrolujte VITE_SUPABASE_URL a veřejný klíč v .env.local.');
      return;
    }

    if (isRegister && form.password !== form.confirmPassword) {
      setError('Zadaná hesla se neshodují.');
      return;
    }

    setBusy(true);
    try {
      const email = form.email.trim();
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              phone: form.phone.trim(),
              account_type: accountType,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice('Účet je vytvořen. Ověřte svůj e-mail odkazem, který jsme vám poslali, a pak se přihlaste.');
          setMode('login');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: form.password,
        });
        if (signInError) throw signInError;
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Přihlášení se nepodařilo. Zkuste to prosím znovu.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-full bg-ink-950 text-ink-200">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
          <div className="flex w-fit items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/20">
              <Truck size={21} strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-tight text-white">
                CargoBoard <span className="text-accent-400">CZ</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-ink-500">
                Síť místní dopravy
              </span>
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[420px]">
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-accent-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                  Místní doprava bez zbytečných přejezdů
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                  {isRegister ? 'Vytvořte si účet' : 'Vítejte zpět'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-ink-400">
                  {isRegister
                    ? 'Přidejte se k síti zákazníků a řidičů CargoBoard.'
                    : 'Přihlaste se a najděte zakázky nebo místního řidiče.'}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 rounded-xl border border-ink-700/80 bg-ink-900/70 p-1">
                <button
                  type="button"
                  onClick={() => changeMode('login')}
                  aria-pressed={!isRegister}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    !isRegister ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  Přihlášení
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('register')}
                  aria-pressed={isRegister}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    isRegister ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  Registrace
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {isRegister && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-ink-300">Jméno</span>
                        <input
                          autoComplete="given-name"
                          required
                          maxLength={80}
                          value={form.firstName}
                          onChange={(event) => update('firstName', event.target.value)}
                          placeholder="Jan"
                          className="field h-12 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-ink-300">Příjmení</span>
                        <input
                          autoComplete="family-name"
                          required
                          maxLength={80}
                          value={form.lastName}
                          onChange={(event) => update('lastName', event.target.value)}
                          placeholder="Novák"
                          className="field h-12 text-sm"
                        />
                      </label>
                    </div>

                    <fieldset>
                      <legend className="mb-2 text-xs font-medium text-ink-300">Typ účtu</legend>
                      <div className="grid grid-cols-2 gap-3">
                        {ACCOUNT_OPTIONS.map((option) => {
                          const selected = accountType === option.id;
                          const Icon = option.id === 'company' ? Building2 : UserRound;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setAccountType(option.id)}
                              className={`rounded-xl border p-3 text-left transition ${
                                selected
                                  ? 'border-accent-500/60 bg-accent-500/[0.08]'
                                  : 'border-ink-700 bg-ink-950/40 hover:border-ink-600'
                              }`}
                            >
                              <Icon size={16} className={selected ? 'text-accent-400' : 'text-ink-500'} />
                              <span className="mt-2 block text-xs font-semibold text-ink-200">{option.title}</span>
                              <span className="mt-1 block text-[10px] leading-4 text-ink-500">{option.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  </>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-300">E-mail</span>
                  <span className="relative block">
                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={form.email}
                      onChange={(event) => update('email', event.target.value)}
                      placeholder="vas@email.cz"
                      className="field h-12 pl-10 text-sm"
                    />
                  </span>
                </label>

                {isRegister && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-300">Telefonní číslo</span>
                    <span className="relative block">
                      <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        type="tel"
                        autoComplete="tel"
                        required
                        maxLength={32}
                        value={form.phone}
                        onChange={(event) => update('phone', event.target.value)}
                        placeholder="+420 777 123 456"
                        className="field h-12 pl-10 text-sm"
                      />
                    </span>
                  </label>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-300">Heslo</span>
                  <span className="relative block">
                    <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(event) => update('password', event.target.value)}
                      placeholder="Alespoň 8 znaků"
                      className="field h-12 pl-10 pr-11 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-500 transition hover:text-ink-200"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                  {isRegister && <span className="mt-1.5 block text-[11px] text-ink-500">Použijte alespoň 8 znaků.</span>}
                </label>

                {isRegister ? (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-300">Potvrzení hesla</span>
                    <span className="relative block">
                      <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={form.confirmPassword}
                        onChange={(event) => update('confirmPassword', event.target.value)}
                        placeholder="Zadejte heslo znovu"
                        className="field h-12 pl-10 pr-11 text-sm"
                      />
                    </span>
                  </label>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        setNotice(null);
                        if (!supabase) {
                          setError('Přihlášení není nakonfigurováno. Zkontrolujte nastavení Supabase.');
                          return;
                        }
                        const email = form.email.trim();
                        if (!email) {
                          setError('Nejprve zadejte e-mail, na který chcete poslat odkaz pro obnovu hesla.');
                          return;
                        }
                        setBusy(true);
                        try {
                          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: window.location.origin,
                          });
                          if (resetError) throw resetError;
                          setNotice('Pokud je e-mail registrovaný, přijde vám odkaz pro obnovu hesla.');
                        } catch (resetError) {
                          setError(resetError instanceof Error ? resetError.message : 'Odkaz pro obnovu hesla se nepodařilo odeslat.');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="text-xs font-medium text-accent-400 transition hover:text-accent-300"
                    >
                      Zapomněli jste heslo?
                    </button>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    aria-live="polite"
                    className="flex gap-2 rounded-lg border border-danger-500/20 bg-danger-500/10 px-3.5 py-3 text-xs leading-5 text-danger-400"
                  >
                    <CircleAlert size={15} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
                {notice && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="flex gap-2 rounded-lg border border-success-500/20 bg-success-500/[0.08] px-3.5 py-3 text-xs leading-5 text-success-300"
                  >
                    <BadgeCheck size={15} className="mt-0.5 shrink-0" />
                    <span>{notice}</span>
                  </p>
                )}

                {!isSupabaseConfigured && (
                  <p className="text-[11px] leading-5 text-warning-400">
                    {import.meta.env.PROD
                      ? 'Tento nasazený web nemá nastavené připojení k Supabase. Nastavte VITE_SUPABASE_URL a VITE_SUPABASE_PUBLISHABLE_KEY v hostingu.'
                      : 'Chybí nastavení Supabase. Doplňte VITE_SUPABASE_URL a VITE_SUPABASE_PUBLISHABLE_KEY do .env.local a restartujte aplikaci.'}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || !isSupabaseConfigured}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 text-sm font-bold text-white shadow-lg shadow-accent-500/15 transition hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-ink-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? 'Chvilku strpení…' : isRegister ? 'Vytvořit účet' : 'Přihlásit se'}
                  {!busy && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-[10px] text-ink-600">
                <span className="h-px flex-1 bg-ink-700/80" />
                NEBO
                <span className="h-px flex-1 bg-ink-700/80" />
              </div>

              <button
                type="button"
                onClick={onPreview}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-ink-700/80 bg-ink-900/50 text-xs font-semibold text-ink-300 transition hover:border-ink-600 hover:bg-ink-800"
              >
                Prohlédnout aplikaci jako návštěvník
              </button>
              <p className="mt-3 text-center text-[10px] leading-5 text-ink-600">
                Hesla bezpečně spravuje Supabase Auth; profil se ukládá odděleně.
              </p>
              <p className="mt-4 text-center text-xs text-ink-500">
                {isRegister ? 'Už máte účet?' : 'Ještě nemáte účet?'}{' '}
                <button
                  type="button"
                  onClick={() => changeMode(isRegister ? 'login' : 'register')}
                  className="font-semibold text-accent-400 transition hover:text-accent-300"
                >
                  {isRegister ? 'Přihlaste se' : 'Vytvořte si účet'}
                </button>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-[10px] text-ink-600">
            <span>© 2026 CargoBoard CZ</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Bezpečný přístup přes Supabase</span>
          </div>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-ink-700/60 bg-ink-900/40 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.12)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="pointer-events-none absolute -right-36 -top-32 h-[440px] w-[440px] rounded-full bg-accent-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-400">
              <MapPin size={14} className="text-accent-400" />
              Česko · západní region
            </div>
            <div className="mt-8 max-w-lg">
              <p className="text-sm font-semibold text-accent-300">Doprava, která dává smysl.</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Zakázka na cestě.
                <br />
                Řidič poblíž.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-ink-400">
                Propojujeme lidi, kteří potřebují něco převézt, s místními řidiči, kteří mají volné místo na cestě.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md py-10">
            <div className="absolute left-[13%] right-[13%] top-1/2 border-t border-dashed border-accent-400/40" />
            <div className="absolute left-[23%] top-[calc(50%-13px)] h-7 w-7 rounded-full border border-accent-400/20 bg-accent-500/10" />
            <div className="absolute left-[23%] top-[calc(50%-13px)] h-7 w-7 animate-pulse-ring rounded-full border border-accent-400/40" />
            <div className="absolute right-[23%] top-[calc(50%-13px)] h-7 w-7 rounded-full border border-success-400/20 bg-success-500/10" />
            <div className="relative flex items-center justify-between">
              <div className="rounded-2xl border border-accent-500/25 bg-ink-900/90 p-4 shadow-xl shadow-black/20">
                <MapPin size={20} className="text-accent-400" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 shadow-xl shadow-black/20">
                <Truck size={26} className="text-white" />
              </div>
              <div className="rounded-2xl border border-success-500/25 bg-ink-900/90 p-4 shadow-xl shadow-black/20">
                <Check size={20} className="text-success-400" />
              </div>
            </div>
            <div className="mt-5 flex justify-between px-1 text-[10px] font-medium text-ink-500">
              <span>Zakázka</span>
              <span>Řidič</span>
              <span>Doručeno</span>
            </div>
          </div>

          <p className="relative text-xs text-ink-600">Jednoduše. Lokálně. Spolehlivě.</p>
        </aside>
      </div>
    </main>
  );
}
