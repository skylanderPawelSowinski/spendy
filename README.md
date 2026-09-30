# Budżet domowy

Aplikacja webowa (mobile first) do wspólnego śledzenia wydatków i przychodów.
Next.js 16 (App Router) + Supabase (Postgres, Auth e-mail + hasło) + shadcn/ui.

## Co potrafi

- **Miesiąc rozliczeniowy 1 → ostatni dzień**, przełączanie na dowolny inny
  miesiąc (strzałki albo siatka miesięcy w popoverze).
- **Pulpit**: bilans, przychody, wydatki, podział na kategorie (poziomy słupek
  100% + lista z kwotami), tempo wydawania narastająco na tle przychodów,
  trend 6 miesięcy.
- **Wydatki**: dodawanie, edycja, usuwanie, filtr po kategorii, grupowanie po dniach.
- **Cykliczne**: szablony wydatków i przychodów (dzień miesiąca, zakres od–do,
  wstrzymywanie). Wpisy powstają automatycznie przy pierwszym wejściu w dany
  miesiąc — i można je potem indywidualnie poprawić albo pominąć.
- **Przychody**: stałe (z szablonu) + jednorazowe doliczane do konkretnego miesiąca.
- **Kategorie**: własne nazwy i kolory z palety zwalidowanej pod kątem daltonizmu.
- **Przestrzenie domowe**: wiele przestrzeni na konto, przełącznik w nagłówku,
  zapraszanie linkiem (ważny 14 dni). Bez ACL — kto dołączy, ma pełny dostęp.
- **Próg wydatków**: kwotowy (np. 5000 zł) albo procentowy (np. 80% przychodów
  danego miesiąca). Na pulpicie miernik pokazuje wykorzystanie; przy 80% robi się
  ostrzeżenie, powyżej 100% alarm. Nic nie blokuje — tylko informuje.
- **Konto**: rejestracja z potwierdzeniem adresu, logowanie, reset i zmiana hasła.

## Uruchomienie

### 1. Baza danych

Wykonaj po kolei pliki z `supabase/migrations/` w SQL Editorze projektu Supabase
(albo przez MCP / `supabase db push`):

- `0001_init.sql` — schemat, RLS, funkcje
- `0002_gmail_only.sql` — ograniczenie logowania do domeny `gmail.com`
- `0003_materialize_range.sql` — materializacja wielu miesięcy jednym wywołaniem
- `0004_spending_limit.sql` — miesięczny próg wydatków

### 2. Logowanie

E-mail + hasło, **tylko adresy `@gmail.com`**. Reguła jest w dwóch miejscach:
w schemacie zod (czytelny komunikat) i w triggerze na `auth.users`
(`supabase/migrations/0002_gmail_only.sql`) — ten drugi jest twardą bramką,
której nie obejdzie nawet ktoś uderzający prosto w `/auth/v1/signup`.

Rejestracja wymaga potwierdzenia adresu linkiem z maila. Jest też reset hasła
(`/auth/reset-hasla`) i zmiana hasła dla zalogowanych (Ustawienia).

**Uwaga na limit maili.** Wbudowany dostawca poczty Supabase na darmowym planie
wysyła **2 maile na godzinę** na projekt — dotyczy to zarówno linków
aktywacyjnych, jak i resetu hasła. Przy intensywnym testowaniu szybko się to
kończy; docelowo podepnij własny SMTP (Authentication → SMTP Settings), co
odblokuje też własne szablony wiadomości.

_Site URL_ i _Redirect URLs_ są już ustawione dla `localhost` (porty 3000–3002).
Po wdrożeniu dopisz tam adres produkcyjny i ustaw `NEXT_PUBLIC_SITE_URL`.

### 3. Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local` i uzupełnij klucz publiczny
(Supabase → Project Settings → API Keys):

```
NEXT_PUBLIC_SUPABASE_URL=https://hlvziklzfkvqyjdoluog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Start

Wymagany **Node 20.9+**; projekt jest rozwijany na **Node 24** (`.nvmrc`).
Menedżer pakietów to **npm** — nie mieszaj z yarn/pnpm/bun, w repo jest
`package-lock.json`.

```bash
nvm use          # albo: fnm use  (czyta .nvmrc / .node-version)
npm ci           # instalacja dokładnie z lockfile'a
npm run dev
```

Pozostałe skrypty:

| Skrypt              | Co robi                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | serwer deweloperski (Turbopack)  |
| `npm run build`     | build produkcyjny                |
| `npm start`         | uruchomienie buildu              |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | `tsc --noEmit`                   |

## Supabase MCP (opcjonalnie, dla pracy z Claude Code)

Serwer jest skonfigurowany lokalnie (poza repo — token nie trafia do gita).
Gdyby trzeba było go odtworzyć, potrzebny jest Personal Access Token z
<https://supabase.com/dashboard/account/tokens>:

```bash
claude mcp add supabase --scope local \
  --env SUPABASE_ACCESS_TOKEN=sbp_... \
  -- npx -y @supabase/mcp-server-supabase@latest --project-ref=hlvziklzfkvqyjdoluog
```

## Model danych

| Tabela                | Rola                                                          |
| --------------------- | ------------------------------------------------------------- |
| `households`          | przestrzeń domowa (wspólny budżet)                            |
| `household_members`   | kto należy do przestrzeni (bez ról)                           |
| `household_invites`   | linki zaproszeń z tokenem i datą ważności                     |
| `categories`          | kategorie wydatków, kolor jako slot palety                    |
| `expenses` / `incomes`| konkretne wpisy, `period_month` liczone kolumną generowaną    |
| `recurring_*`         | szablony cykliczne                                            |
| `recurring_*_skips`   | pominięcia — skasowana pozycja cykliczna nie wraca            |

Dostęp pilnuje RLS: każdy wiersz jest widoczny tylko dla członków swojej
przestrzeni (`is_household_member()`). Operacje wymagające szerszych uprawnień
(akceptacja zaproszenia, materializacja miesiąca, usuwanie z pominięciem) idą
przez funkcje `security definer`.

## Wygląd

Aplikacja działa **tylko w trybie jasnym** — nie ma przełącznika motywu, a
`color-scheme: light` na `<html>` wymusza jasne kontrolki systemowe nawet u osób
z ciemnym motywem w systemie. Klasy `dark:` z komponentów shadcn zostają w kodzie,
ale nigdy się nie aktywują, bo klasa `.dark` nie trafia na `<html>`.

Układ jest mobile-first w duchu współczesnych aplikacji finansowych: jedna
dominująca liczba w nagłówku, karty bez obwódek odcinające się miękkim cieniem,
duże zaokrąglenia (`--radius: 1rem`), wiersze list z okrągłą plakietką kategorii
zamiast linii podziału, dolna nawigacja z wyciętym miejscem na pływający
przycisk dodawania wydatku.

Sześciomiesięczny wykres w nagłówku to **wyróżnienie, nie zestaw serii** —
bieżący miesiąc w kolorze, pozostałe wyszarzone. Kiedy liczy się jedna wartość,
kolorowanie wszystkiego tylko ją zakopuje. Słupki są klikalne, więc pełnią też
rolę szybkiej nawigacji po miesiącach.

Font to **Inter** (`next/font/google`), ładowany z subsetami `latin` i
`latin-ext`, więc polskie znaki idą z właściwego pliku, a nie z zastępczego.
Wariant zmienny pokrywa grubości 100–900 jednym plikiem, `font-display: swap`
plus dopasowany metrycznie fallback (`Inter Fallback` z `size-adjust`) sprawiają,
że tekst nie przeskakuje po doczytaniu fontu.

Zmiana fontu to jedno miejsce: import w `src/app/layout.tsx`. Zmienna CSS musi
nazywać się **inaczej** niż token `--font-sans` z `globals.css` — token wskazuje
na nią i dokłada stos zapasowy. Nazwanie obu tak samo daje odwołanie kołowe,
przez które cała reguła `font-family` jest nieważna i font w ogóle się nie
stosuje (tak było z pierwotnym Geistem).

Kolory kategorii pochodzą ze stałej, dziewięciosłotowej palety
(`src/lib/palette.ts`) zwalidowanej pod kątem daltonizmu na jasnym tle: najgorsza
para sąsiadująca ma CVD ΔE 9.1 przy progu 8. Kolejność slotów jest częścią tej
walidacji — przestawienie jej albo dorzucenie dziesiątego odcienia psuje
gwarancję rozróżnialności.

## Dlaczego strony pojawiają się od razu

Strony są synchroniczną ramką (nawigacja, nagłówki), a wszystko co sięga do bazy
siedzi w `<Suspense>` ze skeletonem. Do tego każdy segment ma `loading.tsx`
złożony z tych samych komponentów skeletonów, więc przejście między segmentem a
zawartością strony nie miga innym kształtem.

Pomiary na buildzie produkcyjnym (pulpit, 30 wydatków, łącze do Supabase ~90 ms
RTT) — czas od żądania do pojawienia się elementu:

| Element                                   | Czas   |
| ----------------------------------------- | ------ |
| Ramka: nawigacja dolna i wybór miesiąca   | 17 ms  |
| Skeletony sekcji                          | 17 ms  |
| Pasek górny z nazwą przestrzeni           | 136 ms |
| Dane: KPI, kategorie, lista, wykresy      | 335–358 ms |

Trzy rzeczy, które to umożliwiły:

1. **`getClaims()` zamiast `getUser()`** w `proxy.ts` i `getSessionContext()`.
   Projekt podpisuje tokeny kluczem ES256, więc podpis weryfikujemy lokalnie
   (~0,6 ms) zamiast pytać Auth API (~104 ms) — a robiliśmy to dwa razy na
   żądanie. Dla HS256 biblioteka sama spada z powrotem do `getUser()`.
2. **`materialize_range`** zamiast sześciu wywołań `materialize_month` przy
   wykresie trendu — jedno zapytanie set-based po `generate_series`.
3. **Bootstrap tylko gdy trzeba** — `bootstrap_user()` szedł wcześniej przy
   każdym renderze; teraz odpala się dopiero, gdy użytkownik faktycznie nie ma
   przestrzeni.
