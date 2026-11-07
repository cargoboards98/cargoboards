# Propojení CargoBoardu se Supabase

1. V Supabase vytvořte projekt a v Authentication zapněte Phone provider. Nakonfigurujte SMS provider a pravidla pro odesílání SMS.
2. V SQL Editoru spusťte obsah souboru `schema.sql`. Přístup k zakázkám je povolen jen přihlášeným uživatelům.
3. Zkopírujte `.env.example` do `.env.local` a doplňte Project URL a veřejný publishable key z nastavení projektu (API Keys). Klíč `service_role` do aplikace nikdy nevkládejte.
4. Restartujte vývojový server (`npm run dev`). Při nasazení nastavte stejné proměnné také v nastavení hostingu.

Aplikace před vstupem vyžaduje ověření telefonního čísla pomocí SMS kódu. Po ověření načítá zakázky z tabulky `freight_orders` a nové zakázky do ní ukládá. Bez nakonfigurovaného Supabase projektu registrace ani přístup k aplikaci nejsou dostupné.
