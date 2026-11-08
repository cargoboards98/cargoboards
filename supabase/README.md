# Nastavení Supabase pro CargoBoard

## 1. Vytvoření tabulky profilů

V Supabase Dashboardu otevřete **SQL Editor → New query** a spusťte migrace
v tomto pořadí:

1. [`migrations/20261107130000_create_profiles.sql`](./migrations/20261107130000_create_profiles.sql)
2. [`migrations/20261108161000_add_carrier_shipper_roles.sql`](./migrations/20261108161000_add_carrier_shipper_roles.sql)
3. [`migrations/20261108163000_add_admin_user_management.sql`](./migrations/20261108163000_add_admin_user_management.sql)

Migrace vytvoří tabulku `public.profiles`; při registraci do ní uloží jméno,
příjmení, telefon, typ účtu a případné IČO. Účet dopravce musí mít osmimístné
IČO; poptávající ho může uvést nepovinně. Povolí přihlášenému uživateli číst
pouze jeho vlastní profil. Hesla zůstávají výhradně v Supabase Auth.

Po registraci a potvrzení e-mailu přidělte admin roli pouze ověřenému účtu
`cargoboards@gmail.com` spuštěním:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where lower(email) = 'cargoboards@gmail.com'
    and email_confirmed_at is not null
)
and role = 'user';
```

Ověřte, že dotaz upravil právě jeden řádek. Ostatní uživatelé nemohou tuto roli
sami změnit.

## 2. Nastavení přihlášení e-mailem

V **Authentication → Providers → Email** povolte e-mailové přihlášení.
Pokud je zapnuté potvrzování e-mailů, nastavte v **Authentication → URL
Configuration** nastavte produkční Site URL na `https://www.cargoboards.eu`
a přidejte mezi povolené redirect URL `https://www.cargoboards.eu/**`.
Pro místní vývoj ponechte také `http://localhost:5173/**` a případně
`http://127.0.0.1:5173/**`.

## 3. Nastavení webové aplikace

Lokálně zkopírujte `.env.example` do `.env.local`. Ve Vercelu nastavte pro
Production `VITE_SUPABASE_URL` a `VITE_SUPABASE_PUBLISHABLE_KEY` a spusťte nové
nasazení. Používejte pouze veřejný publishable key. Nikdy nedávejte do klienta
ani do GitHubu `service_role` klíč.

## 4. Nasazení administrace

Po přidání migrace nasaďte Edge Function `admin-users`:

```sh
supabase functions deploy admin-users
```

Supabase Edge Functions musí mít dostupné serverové proměnné
`SUPABASE_URL`, `SUPABASE_ANON_KEY` a `SUPABASE_SERVICE_ROLE_KEY` (poslední
zůstává pouze na serveru a nikdy se nevkládá do Vercelu ani aplikace).
Administrace umožňuje zobrazit uživatele, zablokovat/odblokovat je a smazat
jejich Auth účet. Správcovské účty jsou chráněné před smazáním i blokováním.

## 5. Ověření

Zaregistrujte testovací účet, potvrďte e-mail (pokud je potvrzování zapnuté) a
ověřte záznam v **Authentication → Users** a **Table Editor → profiles**.
Po ověření e-mailu spusťte výše uvedený SQL příkaz a přihlaste se účtem
`cargoboards@gmail.com`; po nasazení funkce se zobrazí tlačítko **Admin**.
Profil je jinak viditelný pouze přihlášenému vlastníkovi.
