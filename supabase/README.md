# Nastavení Supabase pro CargoBoard

## 1. Vytvoření tabulky profilů

V Supabase Dashboardu otevřete **SQL Editor → New query**, vložte obsah
[`migrations/20261107130000_create_profiles.sql`](./migrations/20261107130000_create_profiles.sql)
a spusťte ho.

Migrace vytvoří tabulku `public.profiles`, při registraci do ní uloží jméno,
příjmení, telefon a typ účtu a povolí přihlášenému uživateli číst pouze jeho
vlastní profil. Doplní také profily existujících účtů, které mají potřebné údaje
v metadatech. Hesla zůstávají výhradně v Supabase Auth.

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

## 4. Ověření

Zaregistrujte testovací účet, potvrďte e-mail (pokud je potvrzování zapnuté) a
ověřte záznam v **Authentication → Users** a **Table Editor → profiles**.
Profil je viditelný pouze přihlášenému vlastníkovi.
