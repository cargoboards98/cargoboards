# Nastavení Supabase pro CargoBoard

## 1. Vytvoření tabulky profilů

V Supabase Dashboardu otevřete **SQL Editor → New query**, vložte obsah
[`migrations/20261107130000_create_profiles.sql`](./migrations/20261107130000_create_profiles.sql)
a spusťte ho.

Migrace vytvoří tabulku `public.profiles`, při registraci do ní uloží jméno,
příjmení, telefon a typ účtu a povolí přihlášenému uživateli číst pouze jeho
vlastní profil. Také doplní profily existujících účtů, které mají potřebné
údaje v metadatech. Hesla zůstávají výhradně v Supabase Auth.

## 2. Nastavení přihlášení e-mailem

V **Authentication → Providers → Email** povolte e-mailové přihlášení.
Pokud je zapnuté potvrzování e-mailů, nastavte v **Authentication → URL
Configuration** produkční Site URL na `https://cargoboards.vercel.app` a
přidejte mezi povolené redirect URL také `https://cargoboards.vercel.app/**`.
Pro místní vývoj přidejte `http://localhost:5173/**`.

## 3. Nastavení webové aplikace

V **Project Settings → API** zkopírujte Project URL a veřejný publishable key.
V projektu Vercel nastavte pro **Production** tyto environment proměnné:

- `VITE_SUPABASE_URL` — Project URL z Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — veřejný publishable key z Supabase.

Po uložení proměnných spusťte nové nasazení (**Redeploy**), protože Vite je
zahrnuje do aplikace při buildu. Do Vercelu ani GitHubu nevkládejte `service_role`
klíč. Lokální hodnoty patří do ignorovaného souboru `.env.local`.

## 4. Ověření

Po dokončení redeploye otevřete web, zaregistrujte testovací účet a případně
potvrďte e-mail. V Supabase ověřte nový záznam v **Authentication → Users** a
odpovídající profil v **Table Editor → profiles**. Zkontrolujte také, že je
záznam dostupný pouze po přihlášení jeho vlastníka.
