/* ============================================
   JOSH — app.js
   Shared loader: fetch JSON → inject nav, footer,
   stats, categories. Dispatches 'app:ready'.
   Built on Bootstrap 5 (navbar collapse, etc.)
   ============================================ */

const JOSH = {
  data: { content: null, jobs: null },
  state: { currentPage: '', jobsFiltered: [], page: 1, perPage: 6 }
};

// ─── Fetch JSON ───────────────────────────────
async function loadData() {
  const bp = basePath();
  const [cRes, jRes] = await Promise.all([
    fetch(bp + '/data/content.json'),
    fetch(bp + '/data/jobs.json')
  ]);
  const contentRaw = await cRes.json();
  const jobsRaw = await jRes.json();

  // ── Normalize content.json ──
  // nav: object with .links array → flat array + cta
  const navLinks = (contentRaw.nav?.links || []).map(l => ({
    label: l.label,
    href: l.href,
    page: l.page || ''
  }));
  // categories: { name, icon } → add id = name
  const categories = (contentRaw.categories || []).map(c => ({
    id: c.name,
    name: c.name,
    icon: c.icon
  }));
  // jobTypes: array of strings → { id, label }
  const jobTypes = (contentRaw.post?.jobTypes || ['Full-time','Part-time','Kontrak','Magang','Freelance'])
    .map((t, i) => ({ id: t, label: t }));
  // footer: flatten nested structure
  const footer = {
    tagline: contentRaw.footer?.tagline || '',
    description: contentRaw.footer?.tagline || '',
    nav: (contentRaw.footer?.colLinks?.items || []).map(i => ({ label: i.label, href: i.href })),
    contact: {
      address: contentRaw.footer?.colContact?.area || '',
      phone: contentRaw.footer?.colContact?.phone || '',
      email: contentRaw.footer?.colContact?.email || ''
    },
    copyright: contentRaw.footer?.copyright || ''
  };

  JOSH.data.content = {
    ...contentRaw,
    nav: navLinks,
    categories,
    jobTypes,
    footer
  };

  // ── Normalize jobs.json ──
  // jobs.json is { jobs: [...] }, unwrap to array
  const jobsArr = jobsRaw.jobs || jobsRaw || [];
  // Ensure each job has consistent fields
  JOSH.data.jobs = jobsArr.map(j => ({
    ...j,
    // category is already a name string, use as-is
    // type is already a label string, use as-is
    featured: j.featured || false
  }));

  return JOSH.data;
}

// ─── Navbar ──────────────────────────────────
function renderNavbar() {
  const { nav } = JOSH.data.content;
  const page = document.body.dataset.page || '';
  JOSH.state.currentPage = page;

  const navHTML = `
    <nav class="navbar navbar-expand-lg fixed-top navbar-josh" id="mainNav">
      <div class="container">
        <a class="navbar-brand" href="${basePath()}/index.html">
          <img src="${basePath()}/Logo-White.png" alt="JOSH — Job Optimisation and Staffing Hub" class="navbar-logo">
        </a>
        <button class="navbar-toggler" type="button"
          data-bs-toggle="collapse" data-bs-target="#navMain"
          aria-controls="navMain" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            ${nav.map(link => {
              const isActive = link.page === page && !link.href.includes('#');
              return `
                <li class="nav-item">
                  <a class="nav-link ${isActive ? 'active' : ''}" href="${basePath()}/${link.href}">
                    ${link.label}
                  </a>
                </li>`;
            }).join('')}
            <li class="nav-item ms-lg-2">
              <a class="btn btn-cta" href="${basePath()}/pasang.html">Pasang Lowongan</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>`;

  const slot = document.getElementById('nav-slot');
  if (slot) slot.innerHTML = navHTML;

  // Scroll shadow
  const navEl = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 8) navEl?.classList.add('scrolled');
    else navEl?.classList.remove('scrolled');
  }, { passive: true });
}

// ─── Footer ──────────────────────────────────
function renderFooter() {
  const { footer } = JOSH.data.content;
  const yr = new Date().getFullYear();

  const footerHTML = `
    <footer class="footer-josh">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4 col-md-6">
            <div class="footer-logo">JOSH</div>
            <p>${footer.tagline}</p>
            <p class="mt-2" style="opacity:.6;font-size:.8rem">${footer.description}</p>
          </div>
          <div class="col-lg-2 col-md-3 col-6">
            <h5>Navigasi</h5>
            <ul>
              ${footer.nav.map(l => `<li><a href="${basePath()}/${l.href}">${l.label}</a></li>`).join('')}
            </ul>
          </div>
          <div class="col-lg-3 col-md-3 col-6">
            <h5>Kategori</h5>
            <ul>
              ${JOSH.data.content.categories.slice(0, 5).map(c =>
                `<li><a href="${basePath()}/lowongan.html?cat=${c.id}">${c.name}</a></li>`
              ).join('')}
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h5>Kontak</h5>
            <div class="footer-contact-item">📍 ${footer.contact.address}</div>
            <div class="footer-contact-item">📞 ${footer.contact.phone}</div>
            <div class="footer-contact-item">✉️ ${footer.contact.email}</div>
          </div>
        </div>
        <div class="footer-bottom-josh">
          <p>© ${yr} ${footer.copyright}</p>
        </div>
      </div>
    </footer>`;

  const slot = document.getElementById('footer-slot');
  if (slot) slot.innerHTML = footerHTML;
}

// ─── Stats Strip ─────────────────────────────
function renderStats() {
  const { stats } = JOSH.data.content;
  const slot = document.getElementById('stats-slot');
  if (!slot) return;

  slot.innerHTML = `
    <div class="container">
      <div class="row g-3">
        ${stats.map(s => `
          <div class="col-6 col-lg-3">
            <div class="stat-item">
              <div class="stat-value">${s.value}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── Categories Grid ─────────────────────────
function renderCategories() {
  const { categories } = JOSH.data.content;
  const slot = document.getElementById('categories-slot');
  if (!slot) return;

  const counts = {};
  JOSH.data.jobs.forEach(j => { counts[j.category] = (counts[j.category] || 0) + 1; });

  slot.innerHTML = categories.map(c => `
    <div class="col-6 col-md-4 col-lg-3 reveal">
      <a href="${basePath()}/lowongan.html?cat=${c.id}" class="cat-card-josh">
        <div class="cat-icon">${c.icon}</div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${counts[c.id] || 0} lowongan</div>
      </a>
    </div>`).join('');
}

// ─── Scroll Reveal ───────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

// ─── Helpers ─────────────────────────────────
function basePath() {
  const p = window.location.pathname.replace(/\/+$/, '');
  const last = p.split('/').pop() || '';
  const hasFile = last.includes('.');
  const dir = hasFile ? p.slice(0, p.lastIndexOf('/')) : p;
  return dir;
}

function fmtSalary(job) {
  if (!job.salary || job.salary === '-') return 'Negotiable';
  return job.salary;
}

// posted field in JSON is already a formatted string like "2 hari lalu"
function fmtDate(posted) {
  if (!posted) return 'Baru saja';
  // If it's already a relative string, return as-is
  if (typeof posted === 'string' && posted.includes('lalu')) return posted;
  if (typeof posted === 'string' && (posted.includes('hari') || posted.includes('minggu') || posted.includes('bulan') || posted === 'Hari ini' || posted === 'Kemarin')) return posted;
  // Fallback: try to parse as date
  try {
    const d = new Date(posted);
    if (!isNaN(d)) {
      const now = new Date();
      const diff = Math.floor((now - d) / 86400000);
      if (diff === 0) return 'Hari ini';
      if (diff === 1) return 'Kemarin';
      if (diff < 7) return diff + ' hari lalu';
      if (diff < 30) return Math.floor(diff / 7) + ' minggu lalu';
      return Math.floor(diff / 30) + ' bulan lalu';
    }
  } catch(e) {}
  return posted;
}

function getCatName(catId) {
  const c = JOSH.data.content.categories.find(x => x.id === catId || x.name === catId);
  return c ? c.name : catId;
}

function getCatIcon(catId) {
  const c = JOSH.data.content.categories.find(x => x.id === catId || x.name === catId);
  return c ? c.icon : '💼';
}

function getJobType(typeId) {
  const t = JOSH.data.content.jobTypes.find(x => x.id === typeId || x.label === typeId);
  return t ? t.label : typeId;
}

function normalizeWA(phone) {
  let p = phone.replace(/[^0-9]/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p;
}

function showToast(msg) {
  let t = document.querySelector('.toast-josh');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast-josh';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Query params helper ─────────────────────
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ─── Init ────────────────────────────────────
async function initApp() {
  try {
    await loadData();
    renderNavbar();
    renderFooter();
    renderStats();
    renderCategories();
    initScrollReveal();
    window.dispatchEvent(new CustomEvent('app:ready', { detail: JOSH }));
  } catch (err) {
    console.error('[JOSH] init error:', err);
  }
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Expose for other scripts
window.JOSH = JOSH;
