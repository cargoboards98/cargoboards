import { Truck } from 'lucide-react';

const legalLinks = [
  { href: '#/terms', label: 'Obchodní podmínky' },
  { href: '#/privacy', label: 'Ochrana osobních údajů' },
  { href: '#/complaints', label: 'Reklamační řád a provozovatel' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-ink-950 px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <a href="#/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-500 text-white">
              <Truck size={16} />
            </span>
            CargoBoard <span className="text-accent-400">CZ</span>
          </a>
          <p className="mt-3 max-w-sm text-xs leading-5 text-ink-500">
            Informační platforma pro propojení poptávajících a dopravců.
          </p>
        </div>

        <nav aria-label="Právní informace" className="flex flex-col items-start gap-2">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-300">Právní informace</h2>
          {legalLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-xs text-ink-500 transition hover:text-accent-300">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="text-xs text-ink-500">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-300">Provozovatel</h2>
          <p className="font-medium text-ink-300">Ladislav Mravec</p>
          <p className="mt-1">IČO: 17640563</p>
          <p className="mt-1">Česká 484/39, 434 01 Most</p>
          <a className="mt-2 inline-block text-accent-300 hover:text-accent-200" href="mailto:cargoboards@gmail.com">
            cargoboards@gmail.com
          </a>
          <div className="mt-4">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-ink-600">Platby přes Stripe po aktivaci</p>
            <div className="flex items-center gap-2" aria-label="Plánované platební metody">
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-bold tracking-wide text-ink-300">VISA</span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-bold lowercase text-ink-300">mastercard</span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-ink-300">stripe</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl border-t border-white/[0.06] pt-4 text-[10px] text-ink-600">
        © {new Date().getFullYear()} CargoBoard CZ
      </p>
    </footer>
  );
}
