# Propojení CargoBoardu se Supabase

1. V Supabase vytvořte projekt.
2. V SQL Editoru spusťte obsah souboru `schema.sql`.
3. Zkopírujte `.env.example` do `.env.local` a doplňte Project URL a veřejný publishable key z nastavení projektu (API Keys). Klíč `service_role` do aplikace nikdy nevkládejte.
4. Restartujte vývojový server (`npm run dev`). Při nasazení nastavte stejné proměnné také v nastavení hostingu.

Aplikace pak načítá zakázky z tabulky `freight_orders` a nové zakázky do ní ukládá. Prázdná tabulka znamená prázdný seznam. Bez konfigurace aplikace používá pouze data v prohlížeči.

**Důležité:** SQL pravidla jsou záměrně veřejná pouze pro prototyp. Každý návštěvník může číst zakázky včetně telefonních čísel a vkládat či upravovat řádky. Před použitím skutečných údajů je potřeba doplnit přihlášení a omezit pravidla RLS; samotné skrytí telefonu v uživatelském rozhraní jej nechrání.
