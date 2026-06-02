# List Bug Audit

Audit date: 2026-05-28
Scope: static site files in repo root. Only this file was edited.

Verification passes run:
- JS syntax check: `node --check app.js` passes.
- JSON-LD parse check: `index.html`, `about/index.html`, and `faq/index.html` parse successfully.
- Local reference check: local `href` and `src` targets exist.
- i18n key check: all `data-i18n` keys used by HTML exist in both `en` and `id`.
- Duplicate id check: no duplicate HTML ids found.
- Image dimension check: `favicon.png` and `assets/spawnvault.png` are both `1254x1254`.

## Status bug dari audit sebelumnya

- Fixed: deploy tidak lagi menjalankan `git reset --hard` langsung di `public_html`; workflow sekarang memakai `REPO_DIR` lalu `rsync` ke `WEB_ROOT`.
- Fixed: deploy baru sudah mengecualikan `.git`, `.github`, `*.md`, `*.xlsx`, dan `.gitignore` untuk sync berikutnya.
- Fixed: `SearchAction` JSON-LD yang mengiklankan `?q=` tanpa fitur search sudah tidak ada.
- Fixed: `.btn-secondary` sekarang sudah punya style di `styles.css`.
- Fixed: count filter sekarang dipanggil lagi setelah ganti bahasa.
- Partially fixed: social image sudah diganti dari `.ico` ke `.png`, tetapi dimensi/aspect ratio metadata masih salah.
- Partially fixed: ItemList JSON-LD sudah memakai nama platform yang lebih sesuai, tetapi jumlah item masih tidak konsisten.

## 1. High - Deploy baru tidak membersihkan file sensitif yang sudah terlanjur ada

Evidence: `.github/workflows/deploy.yml:23-29` memakai `rsync -av --delete` dengan `--exclude='.git'`, `--exclude='.github'`, `--exclude='*.md'`, dan `--exclude='*.xlsx'`.

Impact: exclude pada `rsync --delete` biasanya melindungi file yang dikecualikan dari deletion. Jadi kalau deployment lama sudah pernah menaruh `.git`, `.github`, `listbug.md`, `DESIGN.md`, atau `side_income_EN.xlsx` di `public_html`, workflow baru bisa saja tidak menghapus salinan lama itu.

Recommendation: lakukan cleanup eksplisit di `WEB_ROOT` untuk file lama yang sensitif, atau gunakan strategi sync yang juga menghapus excluded artifacts lama secara aman.

## 2. Medium - Social image metadata masih menyatakan rasio 1200x630 padahal asset square

Evidence: `index.html:40-42` memakai `assets/spawnvault.png` sebagai `og:image` tetapi mendeklarasikan width `1200` dan height `630`. Local inspection menunjukkan `assets/spawnvault.png` berukuran `1254x1254`. `about/index.html:28`, `about/index.html:32`, `about/index.html:35`, `faq/index.html:28`, `faq/index.html:32`, dan `faq/index.html:35` juga memakai square `favicon.png` untuk `summary_large_image`.

Impact: preview social/Twitter dapat crop aneh atau mengabaikan metadata karena dimensi yang dideklarasikan tidak cocok dengan file asli.

Recommendation: buat image social khusus 1200x630 dan pakai konsisten untuk OG, Twitter, sitemap image, dan JSON-LD.

## 3. Medium - JSON-LD ItemList masih tidak lengkap

Evidence: `index.html:121` menyatakan `numberOfItems` adalah `25`, tetapi `itemListElement` di `index.html:123-145` hanya berisi posisi 1 sampai 22. Card visible untuk `XNO Faucet`, `Qpon`, dan `Kopi Kenangan` ada di `index.html:882-884`, `index.html:909-914`, dan `index.html:917-922`, tetapi tidak masuk ItemList.

Impact: structured data tidak sama dengan konten yang ditampilkan, sehingga sinyal SEO/rich result menjadi tidak konsisten.

Recommendation: generate ItemList dari sumber data card yang sama, atau lengkapi item 23-25.

## 4. Medium - Homepage memuat FAQPage schema tanpa FAQ visible di homepage

Evidence: `index.html:149-230` berisi JSON-LD `FAQPage`, tetapi FAQ yang terlihat oleh user hanya ada di halaman FAQ (`faq/index.html:138-190`). Homepage tidak punya section FAQ visible.

Impact: structured data FAQ bisa dianggap tidak sesuai dengan konten halaman karena markup FAQ tidak terlihat di halaman yang sama.

Recommendation: pindahkan FAQPage schema hanya ke `/faq`, atau tampilkan FAQ yang sama di homepage.

## 5. Medium - Copy publik masih menyebut platform yang tidak ada sebagai card

Evidence: `about/index.html:133`, `faq/index.html:50`, `faq/index.html:156`, `faq/index.html:172`, `app.js:234`, `app.js:245`, `app.js:249`, `app.js:253`, `app.js:331`, `app.js:342`, `app.js:346`, dan `app.js:350` menyebut Outlier, DataAnnotation, Scale AI, Prolific, dan Freecash. Platform tersebut tidak muncul sebagai visible card di homepage.

Impact: user dijanjikan platform yang tidak tersedia di direktori, sehingga trust dan relevansi konten turun.

Recommendation: tambahkan card untuk platform itu atau hapus dari copy/FAQ/schema.

## 6. Medium - Filter payout masih memberi hasil yang salah

Evidence:
- Bling menampilkan `BTC / PayPal` di `index.html:578` dan `index.html:746`, tetapi card memakai `data-payout="crypto-pay"` di `index.html:574` dan `index.html:744`, jadi filter PayPal tidak memasukkannya.
- Gimi menampilkan `Bank Transfer / USDT` di `index.html:620`, tetapi memakai `data-payout="paypal"` di `index.html:616`, jadi PayPal salah memasukkannya dan Crypto/IDR bisa melewatkannya.
- ShopBack passive menampilkan `Cashback (IDR)` di `index.html:670`, tetapi memakai `data-payout="paypal"` di `index.html:668`.
- Xworld menampilkan `Dana / GoPay / OVO / USDT` di `index.html:763`, tetapi memakai `data-payout="idr"` di `index.html:762`, jadi Crypto melewatkannya.
- Filter membaca token exact dari `data-payout` di `app.js:471-474`.

Impact: user yang filter PayPal, IDR, atau Crypto melihat hasil yang tidak akurat.

Recommendation: normalisasi token, misalnya `data-payout="crypto-pay paypal"` atau `data-payout="idr crypto-pay"` sesuai payout asli.

## 7. Medium - Menu yang tertutup masih bisa masuk tab order

Evidence: `.nav-more-panel` disembunyikan dengan opacity/pointer-events/transform di `styles.css:228-246`, dan `.mobile-menu` disembunyikan dengan opacity/pointer-events/transform di `styles.css:305-320`. JS hanya toggle class di `app.js:409-417`. Tidak ada `hidden`, `inert`, `aria-hidden`, atau tab index management.

Impact: link menu yang tidak terlihat masih bisa saja terfokus lewat keyboard, terutama pada mobile menu tertutup.

Recommendation: saat menu tertutup, gunakan `hidden`/`inert`/`aria-hidden` dan keluarkan link dari tab order; pulihkan saat menu dibuka.

## 8. Medium - `localStorage` access masih tidak dijaga

Evidence: `app.js:146`, `app.js:158`, `app.js:365`, dan `app.js:374` memakai `localStorage` langsung. Inline script di `about/index.html:66` dan `faq/index.html:80` juga memanggil `localStorage.getItem` langsung.

Impact: browser bisa throw `SecurityError` saat storage diblokir. Jika itu terjadi, fitur theme, language, menu, copy, dan filter bisa berhenti.

Recommendation: buat helper safe storage dengan `try/catch`, lalu fallback ke default saat storage tidak tersedia.

## 9. Medium - Clipboard copy masih bisa gagal diam-diam

Evidence: `app.js:428-432` memakai `navigator.clipboard.writeText(code).then(...)` tanpa feature detection dan tanpa `.catch(...)`.

Impact: copy button gagal tanpa feedback pada insecure context, browser lama, atau permission denied.

Recommendation: cek `navigator.clipboard`, tambahkan fallback, dan tampilkan error state jika gagal.

## 10. Medium - Third-party script dinamis tidak memakai integrity pinning

Evidence: `app.js:29-30` membuat `<script>` dan memuat `https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js`. Tidak ada `integrity` atau `crossOrigin`.

Impact: jika CDN response berubah/terkompromi, third-party JS akan berjalan di site.

Recommendation: self-host dependency atau pasang SRI hash dengan `crossOrigin="anonymous"` dan pertimbangkan CSP.

## 11. Low - Reset filter icon masih dihapus oleh i18n

Evidence: reset button punya icon dan text di `index.html:332-334`, tetapi parent button juga punya `data-i18n="filter-all"`. `applyLang` mengganti seluruh isi node dengan `el.innerHTML = val` di `app.js:375-377`.

Impact: setelah load/ganti bahasa, span `.filter-reset-icon` hilang. CSS untuk icon di `styles.css:517`, `styles.css:522`, dan `styles.css:526` tidak berlaku.

Recommendation: taruh `data-i18n` hanya pada text span, bukan pada button parent.

## 12. Low - Canonical dan hreflang masih konflik untuk query-string language pages

Evidence: `index.html:8-10`, `about/index.html:8-10`, dan `faq/index.html:8-10` canonical ke URL tanpa query, tetapi hreflang menunjuk ke `?lang=en` dan `?lang=id`. Sitemap juga memasukkan query variants di `sitemap.xml:20-31`, `sitemap.xml:39-40`, dan `sitemap.xml:48-49`.

Impact: crawler menerima sinyal campur: alternate language URL diiklankan, tetapi canonical meminta URL non-query.

Recommendation: buat static language URLs seperti `/en/` dan `/id/`, atau jangan index query-string language variants.

## 13. Low - Static language/locale masih tidak konsisten

Evidence: homepage memakai `<html lang="id">` di `index.html:2`, tetapi initial body masih English di `index.html:285-288` sebelum JS mengganti bahasa. `about/index.html:2` dan `faq/index.html:2` memakai `lang="en"`, sementara banyak metadata/body default berbahasa Indonesia di `about/index.html:15`, `about/index.html:128-137`, `faq/index.html:15`, dan `faq/index.html:142-188`.

Impact: crawler tanpa JS, screen reader, dan social parser bisa membaca bahasa halaman secara salah.

Recommendation: samakan static HTML default dengan `lang` dan metadata, atau buat halaman statis per bahasa.

## 14. Low - Copy 2025 masih tersisa di 2026

Evidence: `index.html:300`, `index.html:940`, `about/index.html:171`, `faq/index.html:223`, `app.js:195`, dan `app.js:292` masih menyebut `2025`, sementara audit berjalan pada 2026-05-28.

Impact: halaman terlihat stale walaupun metadata lain sudah diperbarui ke 2026.

Recommendation: update copy yang sensitif tahun ke 2026 atau pakai tahun dinamis untuk footer.

## 15. Low - Control state aksesibilitas belum lengkap

Evidence: filter buttons di `index.html:341-363` hanya toggle class, bukan `aria-pressed`. Bling toggle di `index.html:588` dan `index.html:751` tidak punya `aria-expanded`. Burger di `index.html:262`, `about/index.html:101`, dan `faq/index.html:115` punya `aria-expanded`, tetapi tidak punya `aria-controls`. Escape handler untuk More menu di `app.js:19-23` menutup panel tanpa reset `aria-expanded`.

Impact: assistive technology tidak selalu tahu filter mana yang aktif atau panel mana yang sedang terbuka.

Recommendation: sinkronkan `aria-pressed`, `aria-expanded`, `aria-controls`, dan state saat Escape/click close.

## 16. Low - Filter masih meninggalkan section kosong

Evidence: `setFilter` hanya toggle `.hidden` pada `.card` di `app.js:461-478`. Parent `<section>` tetap tampil walaupun semua card di section tersebut hidden.

Impact: user bisa scroll melewati heading section tanpa card setelah filter aktif.

Recommendation: hide section kosong atau tampilkan empty state per section.

## 17. Low - Homepage masih tidak punya main landmark atau skip link

Evidence: homepage mulai dari `<body>` di `index.html:240`, footer mulai di `index.html:930`, dan tidak ada `<main>` atau `.skip-link` pada homepage. Sebaliknya, About dan FAQ punya skip link/main di `about/index.html:71`/`122` dan `faq/index.html:85`/`136`.

Impact: keyboard dan screen-reader user lebih sulit lompat langsung ke konten utama homepage.

Recommendation: tambahkan skip link dan wrap konten homepage dalam `<main id="main">`.

## 18. Low - `pre-dark` class tidak punya style, jadi anti-flash dark mode tidak bekerja

Evidence: `about/index.html:65-67` dan `faq/index.html:79-80` menambahkan class `pre-dark` ke `documentElement`. CSS hanya mendefinisikan dark mode via `body.dark` seperti di `styles.css:23`; tidak ada selector `.pre-dark`.

Impact: user yang menyimpan dark theme tetap bisa melihat flash light theme sampai `app.js` berjalan dan menambahkan `body.dark`.

Recommendation: samakan mekanisme pre-render dark mode, misalnya set class pada body seawal mungkin atau tambahkan CSS untuk `html.pre-dark`.
