# proudoo-site

Public website for **Proudoo** — served by GitHub Pages at **https://proudoo.app**.

| Path | Page |
|---|---|
| `/`, `/fr/`, `/ar/` | Landing page (EN, FR, AR) |
| `/chores/`, `/fr/taches/`, `/ar/chores/` | SEO page: chore chart / chore ideas by age |
| `/pocket-money/`, `/fr/argent-de-poche/`, `/ar/pocket-money/` | SEO page: coins, rewards, family bank |
| `/routines/`, `/fr/routines/`, `/ar/routines/` | SEO page: routines and streaks |
| `/faq/`, `/fr/faq/`, `/ar/faq/` | Parents' FAQ (FAQPage schema) |
| `/privacy/`, `/fr/privacy/`, `/ar/privacy/` | Privacy policy (linked from the app's Settings and the Play Console) |
| `/delete-account/`, `/fr/delete-account/`, `/ar/delete-account/` | Account deletion — Google Play's required web deletion URL |
| `/pass/` (FR), `/pass/en/`, `/pass/ar/` | Pass Famille: what's included, prices, how to buy (WhatsApp → bank transfer) |
| `/pass/conditions/` (FR), `/pass/en/terms/`, `/pass/ar/terms/` | Terms of sale |

**Google Play payments policy:** the app links to `/privacy/` and `/delete-account/` (and their `/fr/` and `/ar/` versions). Those pages must **never** link to `/pass/`, directly or through their header/footer, and neither must the home page (the privacy pages link to it), nor any page the home page links to (the four SEO pages above and their header nav). Promote `/pass/` only from outside the app: WhatsApp, social networks, emails. No phone number, bank holder name or RIB on any public page.

Plain HTML + one stylesheet (`assets/site.css`), no build step. Edit a page, commit to `main`, and Pages republishes in about a minute.

App code and everything else live in a separate private repo. Keep this repo public-safe: no secrets, no internal notes.

## Arabic

- Arabic pages live under `/ar/` and `/pass/ar/`, with `<html lang="ar" dir="rtl">`. They are translations of the **French** pages; the legal ones (privacy, account deletion, terms of sale) say that the French version prevails, and need a native legal review before that line is removed.
- The app itself is not in Arabic yet, so Arabic pages say "available in French and English for now". Parents are addressed in the plural (أنتم), which is gender-neutral.
- Styles use direction-neutral properties (`margin-inline-start`, `inset-inline-end`…), so one stylesheet serves both directions. Don't add `left`/`right` rules.
- Arabic text uses the self-hosted Noto Sans Arabic (`assets/fonts/`, SIL Open Font License), loaded only on pages that contain Arabic. No Google Fonts request.
- The Arabic pages use the English Google Play badge: add the official Arabic badge to `assets/badges/` when available.

## SEO and analytics (chorbit#211)

- Every page has a canonical URL, `hreflang` en/fr/ar/x-default alternates and Open Graph tags (`assets/og-en.png`, `assets/og-fr.png`). Add a new page to `sitemap.xml` with all three language versions.
- `robots.txt` allows everything and points to the sitemap. `404.html` is `noindex`.
- Visits are counted with GoatCounter (`proudoo.goatcounter.com`, no cookies). The script is on every page **except** `/privacy/` and `/delete-account/` (and their `/fr/` and `/ar/` versions), which the app opens. Play button clicks are counted as events (`data-goatcounter-click`). Tag shared links with `?ref=whatsapp`, `?ref=instagram`, etc.
- Search Console: domain property `proudoo.app`, verified by DNS TXT record.
