# proudoo-site

Public website for **Proudoo** — served by GitHub Pages at **https://proudoo.app**.

| Path | Page |
|---|---|
| `/` | Landing page |
| `/privacy/` | Privacy policy (linked from the app's Settings and the Play Console) |
| `/delete-account/` | Account deletion — Google Play's required web deletion URL |
| `/pass/` (FR), `/pass/en/` | Pass Famille: what's included, prices, how to buy (WhatsApp → bank transfer) |
| `/pass/conditions/` (FR), `/pass/en/terms/` | Terms of sale |

**Google Play payments policy:** the app links to `/privacy/` and `/delete-account/` (and their `/fr/` versions). Those pages must **never** link to `/pass/`, directly or through their header/footer, and neither must the home page (the privacy pages link to it). Promote `/pass/` only from outside the app: WhatsApp, social networks, emails. No phone number, bank holder name or RIB on any public page.

Plain HTML + one stylesheet (`assets/site.css`), no build step. Edit a page, commit to `main`, and Pages republishes in about a minute.

App code and everything else live in a separate private repo. Keep this repo public-safe: no secrets, no internal notes.
