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
  Phone,
  Truck,
  UserRound,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthMode = 'signup' | 'login';
type AccountType = 'driver' | 'company';

const ACCOUNT_OPTIONS: { id: AccountType; title: string; description: string }[] = [
  { id: 'driver', title: 'Osobní řidič', description: 'Přepravuji jako jednotlivec' },
  { id: 'company', title: 'Firma', description: 'Poptávám nebo zajišťuji přepravu' },
];

export function AuthScreen({ initialError }: { initialError?: string | null }) {
  const [mode, setMode] = useState<AuthMode>('signup');
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
      setError('Přihlášení není nakonfigurováno. Doplňte údaje projektu Supabase a restartujte aplikaci.');
      return;
    }

    const email = form.email.trim();
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setError('Hesla se neshodují.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
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
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: form.password });
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
    <main className="relative flex min-h-full items-center justify-center overflow-hidden bg-ink-950 px-4 py-10 text-ink-200 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.15),transparent_58%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-ink-700/70 bg-ink-900/80 shadow-2xl shadow-black/30 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden border-r border-ink-700/70 bg-ink-900 p-10 lg:flex">
          <div className="pointer-events-none absolute -left-24 top-36 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/20">
              <Truck size={21} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">CargoBoard <span className="text-accent-400">CZ</span></div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-ink-500">Síť místní dopravy</div>
            </div>
          </div>

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-success-500/20 bg-success-500/[0.07] px-3 py-1.5 text-[11px] font-medium text-success-400">
              <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
              Doprava, která drží pohromadě
            </div>
            <h1 className="max-w-sm text-4xl font-semibold leading-[1.12] tracking-tight text-white">
              Každá cesta může <span className="text-accent-400">dávat smysl.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ink-400">
              Najděte ověřené zakázky, spojte se s místními dopravci a využijte každou cestu naplno.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Přehled zakázek z vašeho regionu',
                'Přímé spojení mezi zákazníky a řidiči',
                'Účet zabezpečený přes Supabase',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs text-ink-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/15 text-accent-400">
                    <Check size={12} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-[10px] text-ink-500">
            <BadgeCheck size={14} className="text-accent-400" />
            Vaše údaje jsou bezpečně uloženy v Supabase
          </div>
        </section>

        <section className="p-5 sm:p-9 lg:px-11 lg:py-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white">
              <Truck size={21} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">CargoBoard <span className="text-accent-400">CZ</span></div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-ink-500">Síť místní dopravy</div>
            </div>
          </div>

          <div className="mb-7">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-400">
              Bezpečný přístup
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {mode === 'signup' ? 'Přidejte se k nám' : 'Vítejte zpět'}
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink-500">
              {mode === 'signup'
                ? 'Vytvořte si účet a začněte propojovat dopravu.'
                : 'Přihlaste se ke svému účtu CargoBoard.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-ink-700 bg-ink-950/60 p-1">
            {(['signup', 'login'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeMode(item)}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  mode === item ? 'bg-ink-700 text-white shadow-sm' : 'text-ink-500 hover:text-ink-200'
                }`}
              >
                {item === 'signup' ? 'Registrace' : 'Přihlášení'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-ink-300">Jméno</span>
                    <input
                      autoComplete="given-name"
                      required
                      maxLength={80}
                      value={form.firstName}
                      onChange={(event) => update('firstName', event.target.value)}
                      placeholder="Jan"
                      className="field"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-ink-300">Příjmení</span>
                    <input
                      autoComplete="family-name"
                      required
                      maxLength={80}
                      value={form.lastName}
                      onChange={(event) => update('lastName', event.target.value)}
                      placeholder="Novák"
                      className="field"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-[11px] font-medium text-ink-300">Typ účtu</legend>
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
              <span className="mb-1.5 block text-[11px] font-medium text-ink-300">E-mail</span>
              <span className="relative block">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="jan@email.cz"
                  className="field pl-10"
                />
              </span>
            </label>

            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-ink-300">Telefonní číslo</span>
                <span className="relative block">
                  <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={32}
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    placeholder="+420 777 123 456"
                    className="field pl-10"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-ink-300">Heslo</span>
              <span className="relative block">
                <LockKeyhole size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  placeholder="Alespoň 8 znaků"
                  className="field px-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 transition hover:text-ink-200"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-ink-300">Potvrdit heslo</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={(event) => update('confirmPassword', event.target.value)}
                  placeholder="Zadejte heslo znovu"
                  className="field"
                />
              </label>
            )}

            {error && (
              <div role="alert" className="flex gap-2 rounded-lg border border-danger-500/20 bg-danger-500/[0.08] px-3 py-2.5 text-xs leading-5 text-danger-300">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div role="status" className="flex gap-2 rounded-lg border border-success-500/20 bg-success-500/[0.08] px-3 py-2.5 text-xs leading-5 text-success-300">
                <BadgeCheck size={15} className="mt-0.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {!isSupabaseConfigured && (
              <p className="text-[11px] leading-5 text-warning-300">
                Chybí nastavení Supabase. Doplňte VITE_SUPABASE_URL a VITE_SUPABASE_PUBLISHABLE_KEY do souboru .env.local a restartujte vývojový server.
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white shadow-lg shadow-accent-500/10 transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? 'Chvilku strpení…'
                : mode === 'signup'
                  ? 'Vytvořit účet'
                  : 'Přihlásit se'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-ink-500">
            {mode === 'signup' ? 'Už máte účet?' : 'Ještě nemáte účet?'}{' '}
            <button
              type="button"
              onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')}
              className="font-semibold text-accent-400 transition hover:text-accent-300"
            >
              {mode === 'signup' ? 'Přihlaste se' : 'Vytvořte si účet'}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
