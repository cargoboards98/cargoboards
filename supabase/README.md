# Nastavení Supabase pro CargoBoard

## 1. Databázové migrace

V Supabase Dashboardu otevřete **SQL Editor** a spusťte následující migrační
soubory v tomto pořadí:

1. [`migrations/20261107130000_create_profiles.sql`](./migrations/20261107130000_create_profiles.sql)
2. [`migrations/20261108161000_add_carrier_shipper_roles.sql`](./migrations/20261108161000_add_carrier_shipper_roles.sql)
3. [`migrations/20261111100000_normalize_account_roles.sql`](./migrations/20261111100000_normalize_account_roles.sql)
4. [`migrations/20261111110000_marketplace_features.sql`](./migrations/20261111110000_marketplace_features.sql)
5. [`migrations/20261111120000_admin_account_mode.sql`](./migrations/20261111120000_admin_account_mode.sql)

Migrace sjednotí role na `carrier` a `shipper`, zachovají požadavek na IČO
dopravce a vytvoří tabulky pro profily, zakázky, soukromé kontakty, chat,
notifikace, recenze, nahlášení a Stripe webhook idempotenci. RLS a databázové
funkce chrání zápis zakázek, kontaktů, předplatného i komunikace. Kontaktní
telefon a e-mail jsou oddělené od veřejných detailů zakázky; dopravcům je vrací
pouze `get_order_contact`, která ověřuje aktivní PRO přímo v databázi.

Administrátorský účet `cargoboards@gmail.com` může spravovat uživatele a jako
jediný přepínat mezi režimy dopravce a poptávajícího. Režim dopravce vyžaduje
platné osmimístné IČO. Přepnutí se provádí přes databázovou funkci
`set_admin_account_mode`; běžným uživatelům tato funkce přepnutí nepovolí.

## 2. Edge Functions a Stripe

Nasaďte funkce:

- `create-checkout-session`
- `create-portal-session`
- `stripe-webhook`

Serverová tajemství nastavte v Supabase **Project Settings → Edge Functions →
Secrets** (nebo přes důvěryhodné lokální prostředí Supabase CLI):

- `STRIPE_SECRET_KEY` — Stripe secret key; nikdy jej nedávejte do `VITE_*` ani klientského kódu.
- `STRIPE_WEBHOOK_SECRET` — podpisový klíč Stripe webhook endpointu.
- `SITE_URL` — přesná veřejná adresa aplikace, například `https://www.cargoboards.eu`.

V Stripe vytvořte webhook na
`https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook` a
zapněte události `checkout.session.completed`,
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted` a `invoice.payment_failed`. Endpoint ověřuje
podpis a opakované události zpracuje pouze jednou.

Checkout vytváří předplatné CargoBoard CZ PRO za 449 Kč měsíčně v CZK. Stav PRO
se mění výhradně po ověřených Stripe webhook událostech; frontend jej nemůže
nastavit. Změnu a zrušení předplatného zajišťuje Customer Portal.

## 3. Nastavení přihlášení e-mailem

V **Authentication → Providers → Email** povolte e-mailové přihlášení.
Pokud je zapnuté potvrzování e-mailů, nastavte v **Authentication → URL
Configuration** nastavte produkční Site URL na `https://www.cargoboards.eu`
a přidejte mezi povolené redirect URL `https://www.cargoboards.eu/**`.
Pro místní vývoj ponechte také `http://localhost:5173/**` a případně
`http://127.0.0.1:5173/**`.

## 4. Nastavení webové aplikace

Lokálně zkopírujte `.env.example` do `.env.local`. Ve Vercelu nastavte pro
Production `VITE_SUPABASE_URL` a `VITE_SUPABASE_PUBLISHABLE_KEY` a spusťte nové
nasazení. Používejte pouze veřejný publishable key. Nikdy nedávejte do klienta
ani do GitHubu `service_role` klíč.

## 5. Ověření

Zaregistrujte testovací účet, potvrďte e-mail (pokud je potvrzování zapnuté) a
ověřte záznam v **Authentication → Users** a **Table Editor → profiles**.
Profil je viditelný pouze přihlášenému vlastníkovi. Ověřte také vložení poptávky,
živou aktualizaci zakázek a chatu, zákaz přístupu k telefonům pro Free dopravce,
odeslání testovací platby v Stripe test mode, přijetí webhooku, zrušení v
Customer Portalu, dokončení zakázky a vzájemné hodnocení. V produkci před spuštěním
zkontrolujte RLS policies a testovací účty obou rolí.
