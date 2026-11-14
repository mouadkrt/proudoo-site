# proudoo-site

Public website for **Proudoo** — served by GitHub Pages at **https://proudoo.app**.

| Path | Page |
|---|---|
| `/`, `/fr/` | Landing page (EN, FR) |
| `/chores/`, `/fr/taches/` | SEO page: chore chart / chore ideas by age |
| `/pocket-money/`, `/fr/argent-de-poche/` | SEO page: coins, rewards, family bank |
| `/routines/`, `/fr/routines/` | SEO page: routines and streaks |
| `/faq/`, `/fr/faq/` | Parents' FAQ (FAQPage schema) |
| `/privacy/` | Privacy policy (linked from the app's Settings and the Play Console) |
| `/delete-account/` | Account deletion — Google Play's required web deletion URL |
| `/pass/` (FR), `/pass/en/` | Pass Famille: what's included, prices, how to buy (WhatsApp → bank transfer) |
| `/pass/conditions/` (FR), `/pass/en/terms/` | Terms of sale |

**Google Play payments policy:** the app links to `/privacy/` and `/delete-account/` (and their `/fr/` versions). Those pages must **never** link to `/pass/`, directly or through their header/footer, and neither must the home page (the privacy pages link to it), nor any page the home page links to (the four SEO pages above and their header nav). Promote `/pass/` only from outside the app: WhatsApp, social networks, emails. No phone number, bank holder name or RIB on any public page.

Plain HTML + one stylesheet (`assets/site.css`), no build step. Edit a page, commit to `main`, and Pages republishes in about a minute.

App code and everything else live in a separate private repo. Keep this repo public-safe: no secrets, no internal notes.

## SEO and analytics (chorbit#211)

- Every page has a canonical URL, `hreflang` en/fr/x-default alternates and Open Graph tags (`assets/og-en.png`, `assets/og-fr.png`). Add a new page to `sitemap.xml` with both language versions.
- `robots.txt` allows everything and points to the sitemap. `404.html` is `noindex`.
- Visits are counted with GoatCounter (`proudoo.goatcounter.com`, no cookies). The script is on every page **except** `/privacy/` and `/delete-account/` (and their `/fr/` versions), which the app opens. Play button clicks are counted as events (`data-goatcounter-click`). Tag shared links with `?ref=whatsapp`, `?ref=instagram`, etc.
- Search Console: domain property `proudoo.app`, verified by DNS TXT record.
