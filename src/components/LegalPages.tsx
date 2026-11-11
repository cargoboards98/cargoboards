import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

export type LegalPage = 'terms' | 'privacy' | 'complaints';

const pageTitles: Record<LegalPage, string> = {
  terms: 'Všeobecné obchodní podmínky',
  privacy: 'Zásady ochrany osobních údajů',
  complaints: 'Reklamační řád a informace o provozovateli',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-ink-300">{children}</div>
    </section>
  );
}

function TermsContent() {
  return (
    <>
      <p>
        Tyto podmínky upravují používání platformy CargoBoard CZ. Provozovatelem je Ladislav Mravec, IČO 17640563, se sídlem
        Česká 484/39, 434 01 Most, kontaktní e-mail cargoboards@gmail.com.
      </p>
      <Section title="1. Provozovatel a povaha služby">
        <p>
          CargoBoard CZ poskytuje software a informační platformu pro zveřejnění přepravních poptávek a vyhledávání příležitostí.
          Provozovatel není dopravcem ani zasílatelem, nepřebírá zásilky a neuzavírá za uživatele přepravní smlouvy.
        </p>
        <p>
          Přepravní smlouva vzniká přímo mezi zadavatelem a dopravcem. Ti si mezi sebou sjednávají cenu, termín, rozsah služby,
          podmínky platby i odpovědnost za přepravu.
        </p>
      </Section>
      <Section title="2. Odpovědnost za přepravu">
        <p>
          Provozovatel neodpovídá za škodu na nákladu, jeho ztrátu, zpoždění, neprovedení přepravy ani za to, že některá ze stran
          nezaplatí. Uživatelé uzavírají a plní přepravní dohodu na vlastní odpovědnost a mají si předem ověřit druhou stranu,
          sjednat podmínky a vhodné pojištění.
        </p>
        <p>
          Tím nejsou dotčena práva spotřebitele ani odpovědnost, kterou nelze podle právních předpisů vyloučit. Provozovatel
          neodpovídá za nepřetržitou dostupnost ani bezchybnost platformy v rozsahu dovoleném právními předpisy.
        </p>
      </Section>
      <Section title="3. Uživatelský účet a obsah">
        <p>
          Uživatel odpovídá za pravdivost údajů, zabezpečení přihlašovacích údajů a zákonnost obsahu, který do platformy vloží.
          Nesmí zveřejňovat klamavé, protiprávní nebo cizí práva porušující informace. Provozovatel může závadný obsah v souladu
          s právními předpisy omezit nebo odstranit.
        </p>
      </Section>
      <Section title="4. Cena a předplatné dopravce">
        <p>
          Předplatné pro dopravce činí 449 Kč měsíčně a je poplatkem za přístup k informačním službám platformy a kontaktům
          uveřejněným u zakázek. Nejde o platbu za přepravu. Platbu za přepravu si dopravce a zadavatel řeší přímo mezi sebou.
        </p>
        <p>
          Platby předplatného jsou zpracovány přes Stripe. Předplatné lze spravovat nebo zrušit přes zákaznický portál Stripe;
          účinnost zrušení a případné další platby se řídí stavem předplatného zobrazeným v portálu a kogentními právními
          předpisy. Zrušení předplatného neovlivní již uzavřené dohody mezi uživateli.
        </p>
      </Section>
      <Section title="5. Závěrečná ustanovení">
        <p>
          Podmínky se řídí právem České republiky; práva spotřebitele vyplývající z kogentních právních předpisů zůstávají
          zachována. Datum účinnosti: [DOPLNIT].
        </p>
      </Section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p>
        Správcem osobních údajů je Ladislav Mravec, IČO 17640563, Česká 484/39, 434 01 Most, e-mail cargoboards@gmail.com.
        Níže uvedený přehled popisuje zpracování údajů v CargoBoard CZ; před zveřejněním ověřte jeho soulad s produkčním provozem.
      </p>
      <Section title="1. Jaké údaje a proč zpracováváme">
        <p>
          Při registraci zpracováváme jméno, příjmení, e-mail, telefon, typ účtu a případně IČO. Údaje používáme pro vytvoření a
          správu účtu, ověření přístupu, komunikaci mezi uživateli a provoz služby. U zakázek mohou být telefon nebo e-mail
          zpřístupněny druhé straně v rozsahu potřebném pro navázání kontaktu; přímé kontakty mají být dopravcům zpřístupněny
          podle pravidel jejich předplatného.
        </p>
        <p>
          Údaje o předplatném a transakcích používáme pro správu placené služby, účetnictví a řešení sporů. Úplné platební
          údaje zpracovává Stripe jako poskytovatel platebních služeb podle své dokumentace; CargoBoard CZ nemá získávat
          bezpečnostní kód platební karty.
        </p>
      </Section>
      <Section title="2. Právní základy a příjemci">
        <p>
          Údaje účtu zpracováváme zejména pro uzavření a plnění smlouvy s uživatelem, plnění právních povinností a oprávněné
          zájmy na zabezpečení a provozu platformy. Údaje nezbytné pro předání kontaktu jiné straně používáme v souvislosti
          s uživatelem požadovanou službou. Zpracování na základě souhlasu použijeme jen tam, kde je skutečně vyžadován.
        </p>
        <p>
          Příjemci mohou být poskytovatelé hostingu a databáze (Supabase), platební poskytovatel (Stripe) a uživatelé, se kterými
          navazujete kontakt nebo obchod. Konkrétní rozsah, role poskytovatelů a případné předávání mimo EHP je nutné ověřit
          podle produkční konfigurace a smluv.
        </p>
      </Section>
      <Section title="3. Doba uchování a vaše práva">
        <p>
          Údaje uchováváme po dobu existence účtu a následně pouze po dobu nezbytnou pro právní povinnosti, ochranu nároků
          nebo doložení transakcí. Konkrétní retenční lhůty, včetně údajů z fakturace a záloh, je třeba stanovit před spuštěním.
        </p>
        <p>
          Máte právo požadovat přístup, opravu, výmaz nebo omezení zpracování, vznést námitku, získat přenositelné údaje a podat
          stížnost u Úřadu pro ochranu osobních údajů. Žádosti a dotazy směřujte na cargoboards@gmail.com.
        </p>
      </Section>
      <Section title="4. Nezbytné úložiště a cookies">
        <p>
          Platforma využívá technické úložiště potřebné pro přihlášení a zapamatování volby v cookie liště. V aktuální verzi
          nejsou zapojeny analytické ani reklamní cookies. Pokud se to změní, informace a volby budou upraveny před jejich
          nasazením.
        </p>
      </Section>
      <Section title="5. Kontakt a aktualizace">
        <p>
          Tyto zásady platí od [DOPLNIT DATUM]. Před zveřejněním stanovte retenční lhůty a ověřte údaje o dodavatelích i případném
          předávání údajů mimo EHP.
        </p>
      </Section>
    </>
  );
}

function ComplaintsContent() {
  return (
    <>
      <p>
        Tento řád popisuje postup pro reklamace týkající se digitální platformy CargoBoard CZ. Provozovatel zprostředkovává
        pouze software a informační služby; reklamaci samotné přepravy je třeba řešit přímo s dopravcem, který přepravu
        smluvně zajišťoval.
      </p>
      <Section title="1. Reklamace služby platformy">
        <p>
          Problém s přístupem k účtu, zobrazením zakázky nebo placeným předplatným oznamte na kontaktním e-mailu provozovatele.
          Uveďte e-mail účtu, popis potíží, datum a případné číslo transakce. Neposílejte heslo ani úplné údaje platební karty.
        </p>
        <p>
          Provozovatel potvrdí přijetí podnětu a vyřídí jej bez zbytečného odkladu. Konkrétní lhůtu, reklamační kontaktní
          adresu a postup vrácení ceny předplatného je nutné doplnit v souladu s nastavením služby a příslušnými právními
          předpisy. Zákonná práva uživatele tím nejsou omezena.
        </p>
      </Section>
      <Section title="2. Reklamace přepravy">
        <p>
          Za přepravu, stav nákladu, zpoždění a její cenu odpovídají smluvní strany přepravy. Provozovatel platformy není
          smluvní stranou přepravní smlouvy a nemůže rozhodnout o náhradě škody za dopravce nebo zadavatele.
        </p>
      </Section>
      <Section title="3. Informace o provozovateli">
        <div className="rounded-xl border border-warning-500/20 bg-warning-500/[0.06] p-4 text-warning-200">
          Datum účinnosti je nutné stanovit před veřejným spuštěním.
        </div>
        <p>Jméno: Ladislav Mravec</p>
        <p>Sídlo / místo podnikání: Česká 484/39, 434 01 Most</p>
        <p>IČO: 17640563</p>
        <p>Zápis v obchodním nebo živnostenském rejstříku: nepoužije se</p>
        <p>Kontaktní e-mail a adresa pro reklamace: cargoboards@gmail.com, Česká 484/39, 434 01 Most</p>
        <p>Datum účinnosti: [DOPLNIT]</p>
      </Section>
    </>
  );
}

export function LegalPages({ page }: { page: LegalPage }) {
  const content = page === 'terms'
    ? <TermsContent />
    : page === 'privacy'
      ? <PrivacyContent />
      : <ComplaintsContent />;

  return (
    <main className="min-h-[65vh] bg-ink-950 px-4 py-10 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-9">
        <a href="#/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-accent-300 transition hover:text-accent-200">
          <ArrowLeft size={14} /> Zpět do CargoBoard CZ
        </a>
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-xl bg-accent-500/10 p-2.5 text-accent-300">
            {page === 'privacy' ? <ShieldCheck size={19} /> : <FileText size={19} />}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-300">CargoBoard CZ · právní informace</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">{pageTitles[page]}</h1>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-warning-500/20 bg-warning-500/[0.06] p-4 text-xs leading-5 text-warning-200">
          Návrh k doplnění a právní kontrole. Před zveřejněním doplňte všechna pole označená „DOPLNIT“ a ověřte soulad
          s reálným provozem služby.
        </div>
        <div className="mt-8">{content}</div>
      </article>
    </main>
  );
}
