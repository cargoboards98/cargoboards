import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const CONSENT_KEY = 'cargoboard-cookie-preference-v1';

type Preference = 'all' | 'essential';

export function CookieConsent() {
  const [preference, setPreference] = useState<Preference | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === 'all' || saved === 'essential') setPreference(saved);
    } catch {
      setStorageError(true);
    }
  }, []);

  const savePreference = (next: Preference) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, next);
    } catch (error) {
      setStorageError(true);
      console.error('Cookie preference could not be saved in browser storage', error);
    }
    setPreference(next);
  };

  if (preference) {
    return storageError
      ? <p role="status" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-lg rounded-xl border border-warning-500/25 bg-ink-900 px-4 py-3 text-xs text-warning-200 shadow-xl">Prohlížeč blokuje úložiště; volba cookies se po zavření stránky zapomene.</p>
      : null;
  }

  return (
    <section
      aria-label="Nastavení cookies"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-white/10 bg-ink-900 p-4 shadow-2xl shadow-black/50 sm:inset-x-5 sm:bottom-5 sm:flex sm:items-center sm:gap-5 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-accent-500/10 p-2 text-accent-300"><Cookie size={17} /></span>
        <div>
          <h2 className="text-sm font-semibold text-white">Vaše soukromí je důležité</h2>
          <p className="mt-1 text-xs leading-5 text-ink-400">
            Aplikace používá nezbytné úložiště pro přihlášení a uložení této volby. Analytické ani reklamní cookies nyní nepoužíváme.
          </p>
          {storageError && <p role="status" className="mt-1 text-[11px] text-warning-300">Prohlížeč blokuje úložiště; vaše volba se uloží pouze do zavření stránky.</p>}
          <a href="#/privacy" className="mt-1 inline-block text-xs font-medium text-accent-300 hover:text-accent-200">
            Více v zásadách ochrany osobních údajů
          </a>
        </div>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0 sm:flex-col">
        <button
          type="button"
          onClick={() => savePreference('essential')}
          className="flex-1 rounded-lg border border-ink-600 px-3 py-2 text-xs font-semibold text-ink-200 transition hover:bg-ink-800 sm:flex-none"
        >
          Pouze nezbytné
        </button>
        <button
          type="button"
          onClick={() => savePreference('all')}
          className="flex-1 rounded-lg bg-accent-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-600 sm:flex-none"
        >
          Přijmout všechny
        </button>
      </div>
    </section>
  );
}
