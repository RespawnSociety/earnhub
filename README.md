# SpawnVault

**Website kerjaan remote & freelance online** — direktori kurasi platform side income dengan pembayaran **USD, PayPal, atau crypto**, semua dites pribadi dan terbukti membayar.

🌐 Live: [spawnvault.respawnsociety.web.id](https://spawnvault.respawnsociety.web.id/)

---

## Tentang

SpawnVault adalah static website yang membantu pencari kerja di Indonesia menemukan platform remote work, AI trainer, passive income, paid surveys, play-to-earn games, investasi, dan promo — yang membayar dalam USD, PayPal, IDR, atau crypto.

Setiap platform sudah:

- Dites secara pribadi
- Terbukti membayar ke rekening nyata
- Modal 0 — selalu gratis untuk bergabung
- Bukan scam, MLM, atau skema cepat kaya

## Fitur

- **Bilingual** (Indonesia / English) dengan toggle real-time via View Transitions API
- **Filter** berdasarkan effort level, payout method, dan kategori
- **Dark mode** dengan persistence via `localStorage`
- **JSON-LD structured data** (Organization, WebSite, WebPage, ItemList, FAQPage, BreadcrumbList)
- **Smooth scroll** via Lenis
- **Responsive** — desktop & mobile
- **Aksesibilitas** — skip link, ARIA states, keyboard navigation
- **SEO-friendly** — hreflang, sitemap, OpenGraph, Twitter Cards

## Struktur

```
.
├── index.html              # Homepage + semua card platform
├── about/index.html        # Halaman About
├── faq/index.html          # Halaman FAQ
├── app.js                  # JS: i18n, theme, filter, copy, nav, Lenis
├── styles.css              # Styling
├── assets/                 # Logo & gambar
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Crawler rules
├── CNAME                   # Custom domain (GitHub Pages)
├── DESIGN.md               # Catatan design (tidak ikut deploy)
├── listbug.md              # Audit report (tidak ikut deploy)
└── .github/workflows/
    └── deploy.yml          # Deploy ke VPS via rsync
```

## Kategori Platform

| Kategori | Contoh |
|---|---|
| AI Trainer | Mercor, Micro1, Turing, SME Careers |
| Passive Income | HoneyGain, Pawns App, KLED |
| Skill-Based | Gimi |
| Top Picks | HoneyGain, Pawns App, SweatWallet, ShopBack, Merge Cats, Bling |
| Investment | Bibit, Superbank |
| Games | Merge Cats, Bling, Xworld, Telegram Earning Games |
| Surveys | ySense, TopSurveys, Milieu Surveys, Surveyon, Pawns App |
| Crypto | SweatWallet, Robox, Cloud Mine Crypto, XNO Faucet |
| Promos | Qpon, Kopi Kenangan |

## Development

Static site — tidak ada build step. Buka langsung di browser atau jalankan local server:

```bash
# Python
python -m http.server 8000

# Node (via npx)
npx serve .
```

Lalu buka `http://localhost:8000`.

### Menambah card baru

1. Tambahkan `<div class="card">` di section yang sesuai pada `index.html`
2. Set `data-effort` (`very-low` | `low` | `medium`) dan `data-payout` (`paypal` | `idr` | `crypto-pay`, dipisah spasi jika lebih dari satu)
3. Tambahkan deskripsi terjemahan di `app.js` (`T.en` dan `T.id`)
4. Update `ItemList` JSON-LD di `index.html`

### Menambah bahasa

Tambahkan key baru pada object `T` di [app.js](app.js), lalu update `detectInitialLang()` dan toggle `cycleLang()`.

## Deployment

Deploy otomatis ke VPS via GitHub Actions setiap push ke `main`. Workflow:

1. Clone/pull repo ke direktori privat di luar `public_html`
2. `rsync` hanya file publik ke web root (exclude `.git`, `.github`, `*.md`, `*.xlsx`)

Lihat [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Stack

- Vanilla HTML, CSS, JavaScript — tanpa framework, tanpa build tool
- [Lenis](https://github.com/darkroomengineering/lenis) untuk smooth scroll
- Google Fonts (Inter)
- View Transitions API untuk language crossfade

## License

Konten & branding © Respawn Society. Kode source dapat dibaca untuk referensi pembelajaran.

## Credits

Proyek dari [Respawn Society](https://respawnsociety.web.id/).
