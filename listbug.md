# List Bug Audit

Audit date: 2026-05-28  
Scope: static site files in repo root. Only this file was edited.

## 1. High - Production web root appears to be a Git checkout

Evidence: `.github/workflows/deploy.yml:15-17` changes directory into `/home/el/web/spawnvault.respawnsociety.web.id/public_html` and runs `git pull origin main`.

Impact: if the web server does not block dot directories, `/.git/` can expose source history, remote config, branch refs, and deployment details. This setup also deploys every repo file into the public web root.

Recommendation: keep the Git checkout outside `public_html`, then sync only public artifacts (`index.html`, `robots.txt`, `sitemap.xml`, `assets/`). Also block dotfiles/directories at the web server level.

## 2. High - Favicon, social image, JSON-LD logo, and sitemap image point to a missing file

Evidence: `index.html:13`, `index.html:37`, `index.html:46`, `index.html:60`, `index.html:64`, `index.html:119`, and `sitemap.xml:12` reference `assets/respawn-society-logo.svg`. Current `assets/` only contains `spawnvault.ico`.

Impact: browser favicon can break, social previews can have no image, structured data can reference a dead logo, and the sitemap image entry can return 404.

Recommendation: restore `assets/respawn-society-logo.svg`, or update all references to an existing asset. For social cards, prefer a real `1200x630` PNG/JPG.

## 3. Medium - Non-site files are likely publicly deployed

Evidence: root contains `.github/`, `DESIGN.md`, `side_income_EN.xlsx`, and `listbug.md`. The workflow pulls the whole repo into `public_html`.

Impact: source-only files, spreadsheets, workflow details, and this audit report can be downloadable from the live domain. `robots.txt` allows crawling everything.

Recommendation: deploy from a clean output folder or deny non-public files server-side (`.git`, `.github`, `*.md`, `*.xlsx`, etc.).

## 4. Medium - Structured data advertises a search endpoint that does not exist

Evidence: `index.html:95-98` declares a `SearchAction` with `https://spawnvault.respawnsociety.web.id/?q={search_term_string}`. The script only reads `lang` from `location.search`; no code handles `q`.

Impact: Google can see an internal site search capability that the page does not implement. Users or crawlers landing on `?q=...` get the same unfiltered page.

Recommendation: remove `SearchAction` or implement real query handling/search UI for `q`.

## 5. Medium - JSON-LD ItemList is inconsistent with the visible cards

Evidence: `index.html:128` says `numberOfItems` is `22`, but the JSON-LD list has only 11 `ListItem` entries. It also lists Outlier, DataAnnotation, Scale AI, Prolific, and Freecash at `index.html:133-138`, while these are not visible card names in the page.

Impact: structured data can become misleading and inconsistent with page content, which may hurt SEO trust or eligibility for rich results.

Recommendation: generate ItemList from the same card data used by the page, or remove apps that are not actually rendered.

## 6. Medium - Payout filters still return wrong cards because `data-payout` is inconsistent

Evidence:
- Bling says `BTC / PayPal` at `index.html:1254` and `index.html:1422`, but both cards use `data-payout="crypto-pay"` at `index.html:1250` and `index.html:1420`, so the PayPal filter misses it.
- Gimi says `Bank Transfer / USDT` at `index.html:1296`, but uses `data-payout="paypal"` at `index.html:1292`, so PayPal wrongly includes it and Crypto misses it.
- ShopBack says `Cashback (IDR)` at `index.html:1346`, but the passive card uses `data-payout="paypal"` at `index.html:1344`.
- Xworld says `Dana / GoPay / OVO / USDT` at `index.html:1439`, but uses only `data-payout="idr"` at `index.html:1438`, so Crypto misses it.
- Filter logic checks exact tokens from `data-payout` at `index.html:1864-1868`.

Impact: users filtering by PayPal, IDR, or Crypto see inaccurate results.

Recommendation: normalize `data-payout` tokens to include every real payout method, for example `data-payout="crypto-pay paypal"` or `data-payout="idr crypto-pay"`.

## 7. Medium - Reset filter icon is removed by the i18n system

Evidence: the reset button contains icon markup at `index.html:1019-1020`, but it also has `data-i18n="filter-all"`. `applyLang` replaces translated nodes via `el.innerHTML = val` at `index.html:1784`.

Impact: on page load or language toggle, the reset icon span is deleted. CSS that targets `.filter-reset-icon` at `index.html:641`, `index.html:646`, and `index.html:650` no longer applies.

Recommendation: translate only the text span, or make the translation value include the icon markup intentionally.

## 8. Medium - Clipboard copy can fail silently

Evidence: `index.html:1820-1821` calls `navigator.clipboard.writeText(code).then(...)` without feature detection or `.catch(...)`.

Impact: copy buttons fail with no user feedback when clipboard permission is denied, the page is not in a secure context, or Clipboard API is unavailable.

Recommendation: add a fallback and failure state, or disable copy buttons when Clipboard API is unavailable.

## 9. Medium - `localStorage` access is unguarded

Evidence: `index.html:1689`, `index.html:1701`, `index.html:1774`, and `index.html:1781` call `localStorage` directly.

Impact: browsers can throw `SecurityError` when storage is blocked or unavailable. If that happens, later script features such as language, menu, copy, and filters can stop running.

Recommendation: wrap storage reads/writes in safe helper functions with `try/catch`, and continue with defaults when storage is unavailable.

## 10. Low - Canonical and hreflang conflict for client-only language variants

Evidence: `index.html:8-11` sets canonical to `/` while also declaring `?lang=en` and `?lang=id` hreflang alternates. The same static HTML is served before JS changes text. `sitemap.xml` also lists the query-string language URLs.

Impact: crawlers can receive mixed signals: alternate language URLs are declared, but the canonical says the root is the preferred version. Bots that do not execute JS also see the same initial document for both languages.

Recommendation: create real static language pages (`/en/`, `/id/`) with matching canonical/hreflang metadata, or avoid indexing query-string language variants.

## 11. Low - Default metadata mixes Indonesian copy with English language/locale

Evidence: `index.html:2` sets `<html lang="en">`, `index.html:43` sets `og:locale` to `en_US`, but `index.html:6`, `index.html:15`, and `index.html:35` use Indonesian-focused copy.

Impact: screen readers, search engines, and social parsers can classify the page language incorrectly.

Recommendation: align initial `html lang`, Open Graph locale, title, description, and body copy for the default page.

## 12. Low - 2025 copy is stale in 2026

Evidence: `index.html:6`, `index.html:35`, `index.html:987`, `index.html:1617`, `index.html:1736`, and `index.html:1766` still say `2025`, while `sitemap.xml` uses `2026-05-28`.

Impact: snippets and on-page trust signals can look outdated.

Recommendation: update year-sensitive copy to 2026 or remove fixed years where possible.

## 13. Low - Filter and expandable controls do not expose selected/open state

Evidence: filter buttons at `index.html:1028-1050` only toggle CSS class `active`; Bling toggles at `index.html:1264` and `index.html:1427` only change text. There is no `aria-pressed` for filters and no `aria-expanded` for the Bling buttons. The burger has `aria-expanded` but no `aria-controls`.

Impact: assistive technology does not reliably know which filter is active or whether the extra games list is expanded.

Recommendation: update `aria-pressed` on filter buttons, `aria-expanded` on Bling toggles, and add `aria-controls` for controlled menus/panels.

## 14. Low - Filter count language does not refresh after changing language

Evidence: `updateFilterUI` formats the count based on `currentLang` at `index.html:1827-1842`, but `applyLang` at `index.html:1777-1799` does not call `updateFilterUI`.

Impact: if a user changes language after filtering, the count can remain in the previous language until another filter action runs.

Recommendation: call `updateFilterUI(currentFilter)` after changing language, or store the active filter and refresh the count inside `applyLang`.

## 15. Low - Filters leave empty sections visible

Evidence: `setFilter` only toggles `.hidden` on individual `.card` elements at `index.html:1854-1869`; it does not hide parent sections that have no visible cards.

Impact: after a payout/effort filter, users can scroll through section headings with no visible cards.

Recommendation: after filtering cards, hide empty sections or show an explicit empty-state message.

