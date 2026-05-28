  /* ── safe storage helpers ── */
  function storageGet(k) {
    try { return localStorage.getItem(k); } catch (_) { return null; }
  }
  function storageSet(k, v) {
    try { localStorage.setItem(k, v); } catch (_) { /* storage unavailable */ }
  }

  /* ── nav "More" dropdown ── */
  function toggleNavMore(e) {
    if (e) e.stopPropagation();
    const m = document.getElementById('navMore');
    if (!m) return;
    const open = m.classList.toggle('open');
    const btn = m.querySelector('.nav-more-btn');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.addEventListener('click', e => {
    const m = document.getElementById('navMore');
    if (!m || !m.classList.contains('open')) return;
    if (!m.contains(e.target)) {
      m.classList.remove('open');
      const btn = m.querySelector('.nav-more-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const m = document.getElementById('navMore');
      if (m) {
        m.classList.remove('open');
        const btn = m.querySelector('.nav-more-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    }
  });

  /* ── Lenis smooth scroll (https://lenis.dev) ── */
  (function loadLenis() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js';
    // TODO: add integrity="sha384-..." once you generate the SRI hash for this exact build (https://www.srihash.org/)
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    s.onload = () => {
      if (typeof Lenis === 'undefined') { console.warn('Lenis failed to load'); return; }
      const lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false,
        gestureOrientation: 'vertical',
        autoRaf: true,
      });
      window.lenis = lenis;
      console.info('Lenis active', lenis);
      // make anchor links work nicely with Lenis
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"], a[href^="/#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const onSamePage = href.startsWith('#') ||
          (href.startsWith('/#') && (location.pathname === '/' || location.pathname.endsWith('index.html')));
        if (!onSamePage) return;
        const id = href.replace(/^\/?#/, '');
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -64, duration: 1.4 });
      }, { passive: false });
    };
    s.onerror = () => console.warn('Lenis CDN unreachable');
    document.head.appendChild(s);
  })();

  /* ── nav sliding indicator (desktop only — skipped on mobile to avoid forced reflows) ── */
  (function() {
    const mq = window.matchMedia('(min-width: 701px)');
    if (!mq.matches) return; // mobile: .nav-links is display:none, skip entirely
    const nav = document.querySelector('.nav-links');
    const indicator = document.getElementById('navIndicator');
    if (!nav || !indicator) return;
    const links = nav.querySelectorAll('a');
    let activeLink = nav.querySelector('a.pill') || links[0];
    let rafId = null;
    let pendingTarget = null;

    function moveTo(el, animate = true) {
      if (!el) return;
      pendingTarget = el;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const target = pendingTarget;
        pendingTarget = null;
        if (!target) return;
        if (!animate) indicator.style.transition = 'none';
        const navRect = nav.getBoundingClientRect();
        const r = target.getBoundingClientRect();
        const left = r.left - navRect.left + nav.scrollLeft;
        indicator.style.width = r.width + 'px';
        indicator.style.transform = `translate3d(${left}px, -50%, 0)`;
        if (!animate) {
          void indicator.offsetWidth;
          indicator.style.transition = '';
        }
        indicator.classList.add('ready');
      });
    }

    function setActive(el) {
      if (!el) return;
      links.forEach(l => l.classList.remove('pill'));
      el.classList.add('pill');
      activeLink = el;
      moveTo(el);
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', () => moveTo(link), { passive: true });
      link.addEventListener('focus', () => moveTo(link), { passive: true });
      link.addEventListener('click', () => setActive(link));
    });
    nav.addEventListener('mouseleave', () => moveTo(activeLink), { passive: true });

    requestAnimationFrame(() => moveTo(activeLink, false));
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => moveTo(activeLink, false), 120);
    }, { passive: true });

    const sections = Array.from(links)
      .map(l => {
        const id = l.getAttribute('href');
        return id && id.startsWith('#') && id.length > 1 ? { link: l, el: document.querySelector(id) } : null;
      })
      .filter(s => s && s.el);
    if (sections.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const match = sections.find(s => s.el === e.target);
            if (match) setActive(match.link);
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sections.forEach(s => io.observe(s.el));
    }
  })();

  /* ── theme ── */
  function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = dark ? '☀️' : '🌙';
    storageSet('theme', dark ? 'dark' : 'light');
  }
  function toggleTheme() {
    const goingDark = !document.body.classList.contains('dark');
    document.body.classList.add('theme-switching');
    setTimeout(() => document.body.classList.remove('theme-switching'), 700);
    if (document.startViewTransition) {
      document.startViewTransition(() => applyTheme(goingDark));
    } else {
      applyTheme(goingDark);
    }
  }
  if (storageGet('theme') === 'dark') {
    document.body.classList.add('dark');
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = '☀️';
  }

  /* ── language ── */
  const T = {
    en: {
      'hero-badge':'✦ Personally Tested — 100% Paying',
      'hero-h1':'Turn Your Time<br>Into <em>Money</em>',
      'hero-desc':'Passive apps, AI training jobs, games, and surveys — all in one place. Signing up through these links often unlocks a welcome bonus you won\'t get going directly.',
      'hero-cta':'Explore AI Trainer Jobs →',
      'trust-1':'✓ 100% paying — personally tested',
      'trust-2':'✓ Signing up here unlocks bonus perks',
      'trust-3':'✓ Always free to join',
      'stat-platforms':'Platforms','stat-free':'Free to Join','stat-categories':'Categories','stat-cost':'Upfront Cost',
      'how-1-title':'Browse & pick your type','how-1-desc':'Filter by effort level or payout — passive, skill-based, games, and more.',
      'how-2-title':'Click the link & get bonus perks','how-2-desc':'Signing up through these links often unlocks welcome bonuses, cashback boosts, or extra starting credits — you won\'t get these going directly.',
      'how-3-title':'Sign up & start earning','how-3-desc':'No hidden fees. Most platforms start paying from day one — some within minutes.',
      'filter-title':'Filter','filter-all':'Show All','filter-effort':'Effort','filter-very-low':'Very Low','filter-low':'Low Effort',
      'filter-payout':'Payout','filter-idr':'IDR','filter-category':'Category',
      'cat-skill':'Skill-Based','cat-passive':'Passive','cat-invest':'Investment','cat-games':'Games','cat-surveys':'Surveys','cat-promos':'Promos',
      'nav-skill':'Skill-Based','nav-picks':'Top Picks','nav-passive':'Passive','nav-invest':'Investment','nav-games':'Games','nav-surveys':'Surveys','nav-promos':'Promos','nav-about':'About','nav-faq':'FAQ','nav-home':'Home','nav-more':'More',
      'about-cta-start':'Start with AI Trainer →','about-cta-faq':'See FAQ',
      'faq-cta-start':'Start Looking for Remote Jobs →','faq-cta-about':'About SpawnVault',
      'sec-ai-label':'Featured','sec-ai-title':'AI Trainer — Remote Work','sec-ai-desc':'Help train and improve AI models — work from anywhere, set your own hours',
      'ai-intro':'<strong>Why AI Training?</strong> Companies pay real money to have humans review AI outputs, label data, and generate training examples. No specific degree needed — just attention to detail and good language skills. Flexible hours, fully remote.',
      'sec-skill-title':'Skill-Based Work','sec-skill-desc':'Use your existing skills — content creation, social media, and more',
      'sec-picks-title':'Top Picks — Best to Start With','sec-picks-desc':'Highest value, lowest friction — start here if you\'re new',
      'sec-passive-title':'Passive Income','sec-passive-desc':'Apps that earn while you sleep — install once, earn continuously',
      'sec-invest-title':'Investment','sec-invest-desc':'Mutual funds & high-yield savings — grow your money passively',
      'sec-games-title':'Games — Play to Earn','sec-games-desc':'Earn real money while playing casual games on your phone',
      'sec-surveys-title':'Surveys — Share Your Opinion','sec-surveys-desc':'Get paid for your thoughts — short surveys, consistent trickle income',
      'sec-crypto-title':'Crypto — Faucets & Mining','sec-crypto-desc':'Free or low-effort crypto — values are volatile, for experimenters only',
      'sec-promos-title':'Promos & Discounts','sec-promos-desc':'Save money on things you already buy',
      'footer-main':'<strong>SpawnVault</strong> — All platforms personally tested and confirmed paying. Always free to join.',
      'footer-sub':'Crypto values are volatile. Earnings vary by usage and region. © 2026',
      'footer-website':'🌐 Need a website? →',
      'footer-credit':'A project by <a href="https://respawnsociety.web.id/" target="_blank" rel="noopener">Respawn Society</a>',
      'card1-desc':"Label data, review AI outputs, generate training sets for top AI companies. Pick your own projects, no fixed hours.",
      'card2-desc':"AI-powered job matching for remote AI roles. Fast application — get matched to AI training projects based on your skill set.",
      'card3-desc':'Join as a <strong>Business Analyst</strong> on a leading remote AI talent platform. Work with top tech companies — fully remote.',
      'card4-desc':"Earn as a Subject Matter Expert contributing to AI projects. Leverage your specialized knowledge in consulting and advisory work.",
      'card5-desc':"100% passive — install once and forget. Shares unused internet bandwidth in the background. Zero effort.",
      'card6-desc':"Dual income: passive bandwidth sharing + optional surveys & games. Min $5 — one of the lowest payout thresholds.",
      'card7-desc':"Free money from walking — something you already do every day. Convert your steps into SWEAT crypto. Hold or sell anytime.",
      'card8-desc':"Earn cashback on purchases you'd make anyway. Shop at your favourite e-commerce stores — zero extra effort.",
      'card9-desc':"Casual merge game — just play and earn. Cash out daily with no minimum hold period. Fastest cash-out on this list.",
      'card10-desc':"Six Bitcoin-earning games in one. Grind 16,000 pts/day across Sweet Bitcoin, Block, Sudoku, Knife Throw, Block 2, and Word Connect.",
      'card11-desc':"Performance-based content rewards. Post on social media, earn based on real engagement your posts generate. Min. $10 payout.",
      'card12-desc':"100% passive — install once and forget. Shares unused internet bandwidth in the background.",
      'card13-desc':"Dual income: passive bandwidth sharing + optional surveys & games. Min $5 payout.",
      'card14-desc':"Earn cashback on purchases you'd make anyway. Zero extra effort required.",
      'card15-desc':"Sell your photos and earn money. Use ref code for a 10% bonus on all earnings. App Store only.",
      'card16-desc':"Invest in mutual funds. Passive growth over time — ideal as a long-term savings tool.",
      'card17-desc':"Deposit interest up to 7.5% p.a. No admin fees, free transfers anywhere. Bonus discounts on Grab.",
      'card18-desc':"Casual merge game — just play and earn. Cash out daily, no minimum hold period.",
      'card19-desc':"Six Bitcoin-earning games. Grind 16,000 pts/day across Sweet Bitcoin, Block, Sudoku, Knife Throw, Block 2, and Word Connect.",
      'card20-desc':"Complete small tasks & mini-games to earn tokens redeemable for e-wallets. Telegram mini-app version available.",
      'card21-desc':"Trending Telegram mini-app games that pay in TON and other crypto tokens. Join the channel for ongoing updates on the latest games.",
      'card22-desc':"Beyond bandwidth sharing — earn extra by completing surveys and mini-games. Min $5 payout.",
      'card23-desc':"Survey & microtask platform. Guaranteed $0.01/day minimum from the daily survey — trickle income that adds up.",
      'card24-desc':"Always pays — even if you only complete half a survey. No mid-survey disqualifications.",
      'card25-desc':"More like a quiz than a boring survey — much less tedious. Enter the code after joining for bonus points.",
      'card26-desc':"Global paid survey platform — complete surveys and earn rewards. Use invitation code to get a sign-up bonus when you join.",
      'card27-desc':"Free crypto from walking — steps you take every day. SweatCoin tracks your steps; SweatWallet converts them to SWEAT tokens you can hold or sell.",
      'card28-desc':"Mining-style platform rewarding ROX tokens. Runs passively in the background — set up once and collect.",
      'card29-desc':"App-based Bitcoin mining. Collect BTC rewards in the background. Bonus up to 10% when joining via our link.",
      'card30-desc':"Free XNO/Nano token faucet. Claim tokens for free — no cost, no mining, just click and collect.",
      'card31-desc':"Voucher & promo discount platform for Indonesia. Sign up via our link and enjoy various attractive deals instantly.",
      'card32-desc':"Claim a 50% discount voucher from Kopi Kenangan. Click the link and claim instantly — no sign-up hassle.",
      'skip-to-content':'Skip to main content',
      'about-label':'About SpawnVault',
      'about-title':'SpawnVault — Remote Work &amp; Online Freelance Hub with USD Pay',
      'about-p1':'<strong>SpawnVault</strong> is a <strong>remote work &amp; online freelance website</strong> that helps Indonesian job seekers find platforms paid in <strong>US dollars (USD), PayPal, or crypto</strong>. Every platform we curate has been personally tested and <strong>confirmed paying</strong> — no scams, no MLM, no get-rich-quick schemes. If you <em>need a job</em> without capital or want extra income from home, SpawnVault is the right place to search for online work.',
      'about-p2':'We provide links to verified platforms: <strong>AI trainer jobs</strong> like Mercor, Micro1, Turing, and SME Careers that pay in USD per project or salary; <strong>passive income apps</strong> like HoneyGain and Pawns App that automatically earn dollars from internet bandwidth; <strong>paid surveys</strong> like ySense, TopSurveys, Milieu Surveys, and Surveyon; <strong>play-to-earn games</strong> like Merge Cats, Bling, and Xworld; and Indonesian investment (Bibit) &amp; high-yield savings (Superbank) platforms. Signing up through SpawnVault links often unlocks <strong>welcome bonuses</strong> or starting credits you won\'t get going directly.',
      'about-p3':'<strong>Who is SpawnVault for?</strong> Students looking for online side jobs, freelancers seeking USD income, office workers wanting a zero-capital side hustle, stay-at-home parents looking for work-from-home income, or anyone who wants to <em>earn dollars from home</em> legally and safely. No prior experience needed, no capital required — just a phone or laptop, internet, and willingness.',
      'about-p4':'<strong>Why use SpawnVault links?</strong> Same sign-up either way, but through our links you get bonus perks (welcome credits, cashback boost, free trials), we get a small commission from the platform, and you still pay nothing. Win-win — your cost stays zero while supporting SpawnVault helps us keep curating and adding new platforms that actually pay.',
      'faq-label':'FAQ',
      'faq-title':'Frequently Asked Questions',
      'faq-desc':'Everything you need to know before starting to earn through SpawnVault',
      'faq-q1':'Is SpawnVault free to use?',
      'faq-a1':'Yes, SpawnVault is 100% free. Every platform we list is also free to sign up — no hidden fees or upfront costs required.',
      'faq-q2':'Do side income apps on SpawnVault really pay?',
      'faq-a2':'Yes — every app on SpawnVault has been personally tested and confirmed paying to a real account. We only list platforms that actually send money to real users.',
      'faq-q3':'Are there remote jobs for Indonesians that pay in US dollars (USD)?',
      'faq-a3':'Yes. SpawnVault curates remote work platforms that accept workers from Indonesia and pay in USD or via PayPal. Examples: AI trainer (Mercor, Micro1, Turing, SME Careers), paid surveys (ySense, TopSurveys, Surveyon), and passive income apps (HoneyGain, Pawns App) — all doable from home.',
      'faq-q4':'Need a job? What\'s a legitimate place to find work-from-home jobs that actually pay?',
      'faq-a4':'SpawnVault is a directory of remote work & online freelance apps that have been personally tested and confirmed paying — not scams. You can start with AI trainer (Mercor, Micro1, Turing, SME Careers), passive income apps (HoneyGain, Pawns App), or paid surveys (ySense, TopSurveys). All can be done from home with zero capital.',
      'faq-q5':'How do I earn USD income from home legally and without scams?',
      'faq-a5':'Fastest way: sign up for AI trainer platforms like Mercor, Micro1, or Turing — they pay per project or salary in USD. For passive income, use HoneyGain or Pawns App which auto-pay in dollars via PayPal. Every platform we list is verified paying (no scam) and legal for Indonesian workers.',
      'faq-q6':'Are the USD-earning apps on SpawnVault safe and not scams?',
      'faq-a6':'Yes. Every app on SpawnVault has been personally tested and confirmed paying to real accounts. We don\'t include scams, MLMs, or platforms requiring upfront deposits. Dollar payouts go via PayPal, bank transfer, or crypto.',
      'faq-q7':'What are USD-paid online side jobs that need no experience?',
      'faq-a7':'For beginners with no experience: paid surveys (ySense, TopSurveys, Surveyon) and passive income apps (HoneyGain, Pawns App) — just install and run, paid in USD automatically. For higher USD pay, AI trainer (Mercor, Micro1) fits because it only needs English reading/writing skill.',
      'faq-q8':'What is passive income and how do I earn it from apps?',
      'faq-a8':'Passive income means earning money with minimal ongoing effort. Apps like HoneyGain and Pawns App share your unused internet bandwidth in the background, earning money 24/7 without you doing anything after setup.',
      'faq-q9':'Do I get a bonus by signing up through SpawnVault links?',
      'faq-a9':'Often yes. Many platforms offer welcome bonuses, starting credits, or cashback boost when you sign up through our website links — bonuses you won\'t get going directly.',
      'faq-q10':'What are the best apps on SpawnVault to start with?',
      'faq-a10':'Top picks on SpawnVault: HoneyGain (passive bandwidth, PayPal payout), Pawns App (bandwidth + surveys, min $5), SweatWallet &amp; SweatCoin (earn crypto by walking), ShopBack (cashback IDR), Merge Cats (casual game daily payout OVO/Dana), and Bling (6 Bitcoin-earning games).',
      'faq-q11':'Is SpawnVault a job website? What does it cost me?',
      'faq-a11':'Yes — SpawnVault is a remote work &amp; online freelance job website. We earn a commission from platforms when you sign up via our links, but it costs you ZERO. Many links even give bonus perks to new users. We use our commission to keep curating and adding new platforms that actually pay.',
    },
    id: {
      'hero-badge':'✦ Dicoba Sendiri — 100% Terbukti Bayar',
      'hero-h1':'Ubah Waktumu<br>Jadi <em>Uang</em>',
      'hero-desc':'Aplikasi pasif, kerja AI trainer, game, dan survei — semua di satu tempat. Daftar lewat link ini sering dapat bonus yang tidak ada kalau daftar langsung.',
      'hero-cta':'Lihat AI Trainer Jobs →',
      'trust-1':'✓ 100% terbukti bayar — dicoba sendiri',
      'trust-2':'✓ Daftar di sini dapat bonus ekstra',
      'trust-3':'✓ Selalu gratis untuk bergabung',
      'stat-platforms':'Platform','stat-free':'Gratis Daftar','stat-categories':'Kategori','stat-cost':'Modal Awal',
      'how-1-title':'Pilih sesuai tipe kamu','how-1-desc':'Filter berdasarkan level usaha atau metode pembayaran — pasif, skill-based, game, dan lainnya.',
      'how-2-title':'Klik link & dapat bonus','how-2-desc':'Daftar lewat link ini sering membuka welcome bonus, cashback ekstra, atau kredit awal — tidak akan kamu dapat kalau daftar langsung.',
      'how-3-title':'Daftar & mulai cuan','how-3-desc':'Tidak ada biaya tersembunyi. Kebanyakan platform mulai bayar dari hari pertama.',
      'filter-all':'Tampilkan Semua','filter-effort':'Usaha','filter-very-low':'Sangat Rendah','filter-low':'Rendah',
      'filter-title':'Filter','filter-payout':'Pembayaran','filter-idr':'Rupiah','filter-category':'Kategori',
      'cat-skill':'Skill-Based','cat-passive':'Pasif','cat-invest':'Investasi','cat-games':'Game','cat-surveys':'Survei','cat-promos':'Promo',
      'nav-skill':'Skill-Based','nav-picks':'Terbaik','nav-passive':'Pasif','nav-invest':'Investasi','nav-games':'Game','nav-surveys':'Survei','nav-promos':'Promo','nav-about':'Tentang','nav-faq':'FAQ','nav-home':'Beranda','nav-more':'Lainnya',
      'about-cta-start':'Mulai dari AI Trainer →','about-cta-faq':'Lihat FAQ',
      'faq-cta-start':'Mulai Cari Kerja Remote →','faq-cta-about':'Tentang SpawnVault',
      'sec-ai-label':'Unggulan','sec-ai-title':'AI Trainer — Kerja Remote','sec-ai-desc':'Bantu melatih model AI — kerja dari mana saja, atur jam sendiri',
      'ai-intro':'<strong>Kenapa AI Training?</strong> Perusahaan membayar untuk review output AI, pelabelan data, dan pembuatan contoh training. Tidak perlu gelar khusus — cukup teliti dan kemampuan bahasa yang baik. Jam fleksibel, full remote.',
      'sec-skill-title':'Kerja Berbasis Keahlian','sec-skill-desc':'Manfaatkan skill yang sudah kamu punya — konten, sosmed, dan lainnya',
      'sec-picks-title':'Pilihan Terbaik','sec-picks-desc':'Nilai tertinggi, paling mudah dimulai — mulai dari sini kalau kamu baru',
      'sec-passive-title':'Penghasilan Pasif','sec-passive-desc':'Aplikasi yang cuan saat kamu tidur — install sekali, terus menghasilkan',
      'sec-invest-title':'Investasi','sec-invest-desc':'Reksa dana & tabungan berbunga tinggi — uangmu tumbuh sendiri',
      'sec-games-title':'Game — Main Sambil Cuan','sec-games-desc':'Hasilkan uang nyata sambil main game kasual di ponselmu',
      'sec-surveys-title':'Survei — Bagikan Pendapatmu','sec-surveys-desc':'Dibayar untuk pendapatmu — survei singkat, penghasilan rutin',
      'sec-crypto-title':'Kripto — Faucet & Mining','sec-crypto-desc':'Kripto gratis atau usaha rendah — nilai fluktuatif, untuk yang suka eksperimen',
      'sec-promos-title':'Promo & Diskon','sec-promos-desc':'Hemat untuk hal-hal yang sudah biasa kamu beli',
      'footer-main':'<strong>SpawnVault</strong> — Semua platform dicoba sendiri dan terbukti bayar. Selalu gratis untuk bergabung.',
      'footer-sub':'Nilai kripto fluktuatif. Penghasilan bervariasi tergantung penggunaan dan wilayah. © 2026',
      'footer-website':'🌐 Butuh buat website? →',
      'footer-credit':'Sebuah proyek dari <a href="https://respawnsociety.web.id/" target="_blank" rel="noopener">Respawn Society</a>',
      'card1-desc':"Pelabelan data, review output AI, buat training set untuk perusahaan AI top. Pilih project sendiri, jam kerja fleksibel.",
      'card2-desc':"Job matching AI untuk peran remote AI. Aplikasi cepat — kamu di-match ke project AI training sesuai keahlian.",
      'card3-desc':'Bergabung sebagai <strong>Business Analyst</strong> di platform talenta AI remote terkemuka. Kerja dengan perusahaan tech top — full remote.',
      'card4-desc':"Cuan sebagai Subject Matter Expert berkontribusi di project AI. Manfaatkan keahlian khususmu untuk consulting & advisory.",
      'card5-desc':"100% pasif — install sekali, lupakan. Bagikan bandwidth internet yang tidak terpakai di background. Tanpa effort.",
      'card6-desc':"Penghasilan ganda: bagi bandwidth pasif + opsional survei & game. Min $5 — salah satu threshold payout terendah.",
      'card7-desc':"Uang gratis dari jalan kaki — yang kamu lakukan tiap hari. Konversi langkahmu jadi crypto SWEAT. Simpan atau jual kapan saja.",
      'card8-desc':"Dapat cashback dari belanja yang memang sudah kamu lakukan. Belanja di e-commerce favorit — tanpa effort tambahan.",
      'card9-desc':"Game merge santai — main dan cuan. Cash-out harian tanpa minimum hold. Pencairan tercepat di list ini.",
      'card10-desc':"Enam game penghasil Bitcoin dalam satu app. Grind 16.000 poin/hari lewat Sweet Bitcoin, Block, Sudoku, Knife Throw, Block 2, dan Word Connect.",
      'card11-desc':"Reward konten berbasis performa. Posting di sosmed, cuan dari engagement nyata postinganmu. Min. payout $10.",
      'card12-desc':"100% pasif — install sekali, lupakan. Bagikan bandwidth internet yang tidak terpakai di background.",
      'card13-desc':"Penghasilan ganda: bagi bandwidth pasif + opsional survei & game. Min payout $5.",
      'card14-desc':"Dapat cashback dari belanja yang memang sudah kamu lakukan. Tanpa effort tambahan.",
      'card15-desc':"Jual foto-fotomu dan dapatkan uang. Pakai ref code untuk bonus 10% dari semua earning. App Store only.",
      'card16-desc':"Investasi reksadana. Pertumbuhan pasif jangka panjang — cocok sebagai alat tabungan masa depan.",
      'card17-desc':"Bunga deposit hingga 7.5% p.a. Tanpa biaya admin, transfer gratis ke mana saja. Bonus diskon Grab.",
      'card18-desc':"Game merge santai — main dan cuan. Cash-out harian, tanpa minimum hold.",
      'card19-desc':"Enam game penghasil Bitcoin. Grind 16.000 poin/hari lewat Sweet Bitcoin, Block, Sudoku, Knife Throw, Block 2, dan Word Connect.",
      'card20-desc':"Selesaikan task kecil & mini-game untuk dapat token yang bisa ditukar e-wallet. Tersedia versi mini-app Telegram.",
      'card21-desc':"Game mini-app Telegram yang lagi tren, bayar pakai TON & token crypto lain. Join channel untuk update game terbaru.",
      'card22-desc':"Lebih dari sekadar bagi bandwidth — cuan ekstra lewat survei dan mini-game. Min payout $5.",
      'card23-desc':"Platform survei & microtask. Jaminan minimum $0.01/hari dari survei harian — penghasilan trickle yang ngumpul.",
      'card24-desc':"Selalu bayar — bahkan kalau kamu cuma selesaikan setengah survei. Tidak ada disqualifikasi di tengah jalan.",
      'card25-desc':"Lebih kayak kuis daripada survei membosankan — jauh lebih ringan. Masukkan kodenya setelah daftar untuk poin bonus.",
      'card26-desc':"Platform survei berbayar global — selesaikan survei dan dapat reward. Pakai invitation code untuk bonus sign-up.",
      'card27-desc':"Crypto gratis dari jalan kaki — langkah yang kamu lakukan tiap hari. SweatCoin melacak langkahmu; SweatWallet ubah jadi token SWEAT yang bisa kamu simpan atau jual.",
      'card28-desc':"Platform mining-style yang reward token ROX. Jalan pasif di background — setup sekali, kumpulkan.",
      'card29-desc':"Mining Bitcoin via app. Kumpulkan reward BTC di background. Bonus hingga 10% kalau daftar lewat link kami.",
      'card30-desc':"Faucet token XNO/Nano gratis. Klaim token gratis — tanpa biaya, tanpa mining, cukup klik dan kumpulkan.",
      'card31-desc':"Platform voucher & promo diskon untuk Indonesia. Daftar lewat link kami dan nikmati berbagai promo menarik instan.",
      'card32-desc':"Klaim voucher diskon 50% dari Kopi Kenangan. Klik link dan klaim instan — tanpa ribet sign-up.",
      'skip-to-content':'Lompat ke konten utama',
      'about-label':'Tentang SpawnVault',
      'about-title':'SpawnVault — Website Kerjaan Remote &amp; Freelance Online dengan Penghasilan Dolar',
      'about-p1':'<strong>SpawnVault</strong> adalah <strong>website kerjaan remote &amp; freelance online</strong> yang membantu pencari kerja di Indonesia menemukan platform yang membayar dalam <strong>dolar (USD), PayPal, atau crypto</strong>. Semua platform yang kami kurasi sudah dites secara pribadi dan <strong>terbukti membayar</strong> — bukan scam, bukan MLM, bukan skema cepat kaya. Kalau kamu sedang <em>butuh kerjaan</em> tanpa modal atau ingin tambahan penghasilan dari rumah, SpawnVault adalah tempat mencari kerja online yang tepat.',
      'about-p2':'Kami menyediakan link ke platform yang sudah diverifikasi: <strong>AI trainer jobs</strong> seperti Mercor, Micro1, Turing, dan SME Careers yang membayar dalam USD per project atau gaji; <strong>passive income apps</strong> seperti HoneyGain dan Pawns App yang otomatis menghasilkan dolar dari bandwidth internet; <strong>paid surveys</strong> seperti ySense, TopSurveys, Milieu Surveys, dan Surveyon; <strong>play-to-earn games</strong> seperti Merge Cats, Bling, dan Xworld; serta platform investasi (Bibit) dan tabungan high-yield (Superbank) untuk pasar Indonesia. Daftar lewat link SpawnVault sering memberikan <strong>welcome bonus</strong> atau kredit awal yang tidak akan kamu dapat kalau daftar langsung.',
      'about-p3':'<strong>Untuk siapa SpawnVault?</strong> Mahasiswa yang butuh kerja sampingan online, freelancer yang ingin pendapatan dolar, pekerja kantoran yang mau side hustle modal 0, ibu rumah tangga yang cari kerja dari rumah, atau siapa saja yang ingin <em>cara dapat penghasilan dolar dari rumah</em> secara legal dan aman. Tidak perlu pengalaman khusus, tidak perlu modal — cukup HP atau laptop, koneksi internet, dan kemauan.',
      'about-p4':'<strong>Kenapa pakai link SpawnVault?</strong> Sama-sama daftar, lewat link kami kamu dapat bonus ekstra (welcome credit, cashback boost, free trial), kami dapat sedikit komisi dari platform, dan kamu tetap bayar nol. Win-win — biaya untukmu tetap gratis, dukungan untuk SpawnVault membantu kami terus mengurasi dan menambah platform baru yang terbukti bayar.',
      'faq-label':'FAQ',
      'faq-title':'Pertanyaan yang Sering Diajukan',
      'faq-desc':'Semua yang kamu perlu tahu sebelum mulai cuan lewat SpawnVault',
      'faq-q1':'Apakah SpawnVault gratis digunakan?',
      'faq-a1':'Ya, SpawnVault 100% gratis. Setiap platform yang kami list juga gratis untuk didaftar — tidak ada biaya tersembunyi atau modal awal yang dibutuhkan.',
      'faq-q2':'Apakah aplikasi side income di SpawnVault benar-benar membayar?',
      'faq-a2':'Ya — setiap aplikasi di SpawnVault sudah dites secara pribadi dan terbukti membayar ke rekening nyata. Kami hanya mencantumkan platform yang benar-benar mengirim uang ke pengguna asli.',
      'faq-q3':'Apakah ada kerjaan remote untuk orang Indonesia dengan penghasilan dolar (USD)?',
      'faq-a3':'Ada. SpawnVault mengkurasi platform kerja remote yang menerima pekerja dari Indonesia dan membayar dalam dolar (USD) atau via PayPal. Contohnya AI trainer (Mercor, Micro1, Turing, SME Careers), paid surveys (ySense, TopSurveys, Surveyon), dan passive income apps (HoneyGain, Pawns App). Semuanya bisa dikerjakan dari rumah.',
      'faq-q4':'Butuh kerjaan? Apa tempat mencari kerja di rumah yang terbukti membayar?',
      'faq-a4':'SpawnVault adalah direktori kerja remote &amp; freelance online yang sudah dites pribadi dan terbukti membayar — bukan scam. Kamu bisa mulai dari AI trainer (Mercor, Micro1, Turing, SME Careers), passive income apps (HoneyGain, Pawns App), atau paid surveys (ySense, TopSurveys). Semua bisa dikerjakan dari rumah tanpa modal.',
      'faq-q5':'Bagaimana cara dapat penghasilan dolar (USD) dari rumah secara legal dan no scam?',
      'faq-a5':'Cara paling cepat: daftar di platform AI trainer seperti Mercor, Micro1, atau Turing — mereka membayar per project atau gaji dalam USD. Untuk passive income, gunakan HoneyGain atau Pawns App yang membayar otomatis dalam dolar via PayPal. Semua platform yang kami list sudah diverifikasi membayar (bukan penipuan / no scam) dan legal untuk pekerja Indonesia.',
      'faq-q6':'Apakah aplikasi penghasil dolar di SpawnVault aman dan bukan scam?',
      'faq-a6':'Ya. Setiap aplikasi di SpawnVault sudah dites secara pribadi dan terbukti membayar ke rekening nyata. Kami tidak memasukkan platform yang scam, MLM, atau membutuhkan deposit di awal. Pembayaran dalam dolar dilakukan via PayPal, transfer bank, atau crypto.',
      'faq-q7':'Apa kerja sampingan online yang dibayar dolar tanpa pengalaman?',
      'faq-a7':'Untuk pemula tanpa pengalaman: paid surveys (ySense, TopSurveys, Surveyon) dan passive income apps (HoneyGain, Pawns App) — cukup install dan jalankan, dibayar dolar otomatis. Untuk yang ingin gaji lebih besar dalam USD, AI trainer (Mercor, Micro1) cocok karena hanya butuh skill membaca/menulis bahasa Inggris.',
      'faq-q8':'Apa itu passive income dan bagaimana cara mendapatkannya dari aplikasi?',
      'faq-a8':'Passive income artinya menghasilkan uang dengan usaha minimal. Aplikasi seperti HoneyGain dan Pawns App membagikan bandwidth internet yang tidak terpakai di latar belakang, menghasilkan uang 24/7 tanpa kamu lakukan apa-apa setelah setup.',
      'faq-q9':'Apakah dapat bonus kalau daftar lewat link SpawnVault?',
      'faq-a9':'Sering kali ya. Banyak platform menawarkan welcome bonus, kredit awal ekstra, atau cashback boost saat kamu daftar lewat link kami — bonus yang tidak akan kamu dapat kalau daftar langsung.',
      'faq-q10':'Apa aplikasi terbaik di SpawnVault untuk dimulai?',
      'faq-a10':'Top picks di SpawnVault: HoneyGain (passive bandwidth, PayPal payout), Pawns App (bandwidth + surveys, min $5), SweatWallet &amp; SweatCoin (earn crypto by walking), ShopBack (cashback IDR), Merge Cats (casual game daily payout OVO/Dana), dan Bling (6 game penghasil Bitcoin).',
      'faq-q11':'Apakah SpawnVault sebuah website kerjaan? Berapa biayanya untuk saya?',
      'faq-a11':'Ya, SpawnVault adalah website kerjaan remote &amp; freelance online — kami dapat komisi dari platform saat kamu daftar lewat link kami, tapi biayanya untukmu tetap NOL. Bahkan banyak link memberikan bonus tambahan untuk pengguna baru. Komisi kami pakai untuk terus mengurasi dan menambah platform baru yang terbukti membayar.',
    }
  };

  function detectInitialLang() {
    const urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang === 'en' || urlLang === 'id') return urlLang;
    const stored = storageGet('lang');
    if (stored === 'en' || stored === 'id') return stored;
    return (navigator.language || 'en').toLowerCase().startsWith('id') ? 'id' : 'en';
  }
  let currentLang = detectInitialLang();
  function applyLang(lang, opts = {}) {
    const isInitial = opts.updateUrl === false;
    const swap = () => {
      currentLang = lang;
      storageSet('lang', lang);
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const val = T[lang][el.dataset.i18n];
        if (val !== undefined) el.innerHTML = val;
      });
      const btn = document.getElementById('langToggle');
      if (btn) {
        btn.textContent = lang === 'en' ? 'ID' : 'EN';
        btn.classList.toggle('active', lang === 'id');
      }
      document.documentElement.lang = lang;
      if (opts.updateUrl !== false) {
        const url = new URL(location.href);
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url);
      }
      const ogLocale = document.querySelector('meta[property="og:locale"]');
      if (ogLocale) ogLocale.setAttribute('content', lang === 'id' ? 'id_ID' : 'en_US');
      if (typeof updateFilterUI === 'function') updateFilterUI(typeof currentFilter !== 'undefined' ? currentFilter : 'all');
    };
    if (isInitial || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap();
      return;
    }
    // Native crossfade via View Transitions API (Chromium/Edge); fallback to no transition.
    if (document.startViewTransition) {
      document.documentElement.classList.add('lang-vt');
      const vt = document.startViewTransition(swap);
      vt.finished.finally(() => document.documentElement.classList.remove('lang-vt'));
    } else {
      swap();
    }
  }
  function cycleLang() { applyLang(currentLang === 'en' ? 'id' : 'en'); }
  applyLang(currentLang, { updateUrl: new URLSearchParams(location.search).has('lang') });
  function setMenu(open) {
    const menu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('menuBackdrop');
    const burger = document.getElementById('burger');
    menu.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-open', open);
  }
  function toggleMenu() { setMenu(!document.getElementById('mobileMenu').classList.contains('open')); }
  function closeMenu()  { setMenu(false); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  function toggleBling(btn) {
    const extra = btn.nextElementSibling;
    const open = extra.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '− Hide extra games ↑' : '+ Show 5 more games ↓';
  }
  function copyCode(btn, code) {
    const onOk = () => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    };
    const onFail = () => {
      btn.textContent = 'Copy failed';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(onOk).catch(() => fallbackCopy(code) ? onOk() : onFail());
    } else {
      fallbackCopy(code) ? onOk() : onFail();
    }
  }
  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (_) { return false; }
  }
  function updateFilterUI(filter) {
    const reset = document.getElementById('filterAll');
    const count = document.getElementById('filterCount');
    const filtered = filter !== 'all';
    if (reset) {
      // active = currently showing all; dim/clickable when filter is applied
      reset.classList.toggle('active', !filtered);
      reset.classList.toggle('clickable', filtered);
      reset.setAttribute('aria-pressed', filtered ? 'false' : 'true');
    }
    if (count) {
      const total = document.querySelectorAll('.card').length;
      const visible = document.querySelectorAll('.card:not(.hidden)').length;
      const lang = (typeof currentLang !== 'undefined' ? currentLang : 'en');
      count.textContent = filtered
        ? (lang === 'id' ? `${visible} dari ${total}` : `${visible} of ${total}`)
        : (lang === 'id' ? `${total} item` : `${total} items`);
      count.classList.toggle('filtered', filtered);
    }
  }
  let currentFilter = 'all';
  function setFilter(btn, filter) {
    const isActive = btn.classList.contains('active');
    if (isActive && filter !== 'all') {
      setFilter(document.getElementById('filterAll'), 'all');
      return;
    }
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    if (btn && btn.classList.contains('filter-btn')) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    }
    document.querySelectorAll('.card').forEach(card => {
      if (filter === 'all') { card.classList.remove('hidden'); return; }
      const effort = card.dataset.effort || '', payout = card.dataset.payout || '';
      let show = false;
      if (filter.startsWith('cat-')) {
        const sectionId = filter.slice(4);
        show = card.closest('section')?.id === sectionId;
      } else {
        if (filter === 'very-low' && effort === 'very-low') show = true;
        if (filter === 'low' && (effort === 'low' || effort === 'very-low')) show = true;
        const payouts = payout.split(' ');
        if (filter === 'paypal' && payouts.includes('paypal')) show = true;
        if (filter === 'idr' && payouts.includes('idr')) show = true;
        if (filter === 'crypto-pay' && payouts.includes('crypto-pay')) show = true;
      }
      card.classList.toggle('hidden', !show);
    });
    // Hide sections that have no visible cards (skip when filter === 'all')
    document.querySelectorAll('section').forEach(sec => {
      if (!sec.querySelector('.card')) return;
      if (filter === 'all') { sec.classList.remove('section-empty'); return; }
      const anyVisible = sec.querySelector('.card:not(.hidden)');
      sec.classList.toggle('section-empty', !anyVisible);
    });
    currentFilter = filter;
    updateFilterUI(filter);
  }
  updateFilterUI('all');
