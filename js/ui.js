/* ============================================
   JOSH — ui.js
   Page-specific: home featured jobs, listings
   filter+paginate, detail (?id=) loader, scroll reveal.
   Listens for 'app:ready' event from app.js
   ============================================ */

window.addEventListener('app:ready', () => {
  const page = JOSH.state.currentPage;

  switch (page) {
    case 'index':       initHome(); break;
    case 'lowongan':    initListings(); break;
    case 'detail':      initDetail(); break;
  }
});

// ═══════════════════════════════════════════
// HOME — Featured Jobs
// ═══════════════════════════════════════════
function initHome() {
  renderFeaturedJobs();
  initHeroSearch();
}

function renderFeaturedJobs() {
  const slot = document.getElementById('featured-slot');
  if (!slot) return;

  const featured = JOSH.data.jobs
    .filter(j => j.featured)
    .slice(0, 6);

  const list = featured.length ? featured : JOSH.data.jobs.slice(0, 6);

  slot.innerHTML = list.map(j => `
    <div class="col-md-6 col-lg-4 reveal">
      <a href="${basePath()}/detail.html?id=${j.id}" class="job-card-josh">
        <div class="job-card-top">
          <div class="job-card-icon">${j.icon || getCatIcon(j.category)}</div>
          <div class="job-card-info">
            <h3 class="job-card-title">${j.title}</h3>
            <p class="job-card-company">${j.company}</p>
          </div>
        </div>
        <div class="d-flex gap-1 flex-wrap">
          <span class="badge-josh badge-cat-josh">${getCatName(j.category)}</span>
          <span class="badge-josh badge-type-josh">${getJobType(j.type)}</span>
          <span class="badge-josh badge-loc-josh">📍 ${j.location}</span>
        </div>
        <div class="job-card-bottom">
          <span class="job-card-salary">${fmtSalary(j)}</span>
          <span class="job-card-posted">${fmtDate(j.posted)}</span>
        </div>
      </a>
    </div>`).join('');

  // Re-init reveal for new elements
  setTimeout(() => initScrollReveal(), 50);
}

function initHeroSearch() {
  const form = document.getElementById('hero-search-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = form.querySelector('input').value.trim();
    const url = new URL(basePath() + '/lowongan.html', window.location.origin);
    if (q) url.searchParams.set('q', q);
    window.location.href = url.pathname + url.search;
  });
}

// ═══════════════════════════════════════════
// LISTINGS — Filter + Paginate
// ═══════════════════════════════════════════
function initListings() {
  const { categories, jobTypes } = JOSH.data.content;
  const jobs = JOSH.data.jobs;

  // Populate filter selects
  const catSel = document.getElementById('filter-cat');
  const typeSel = document.getElementById('filter-type');
  const locSel = document.getElementById('filter-loc');

  if (catSel) {
    catSel.innerHTML = '<option value="">Semua Kategori</option>' +
      categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  if (typeSel) {
    typeSel.innerHTML = '<option value="">Semua Tipe</option>' +
      jobTypes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
  }
  if (locSel) {
    const locs = [...new Set(jobs.map(j => j.location))].sort();
    locSel.innerHTML = '<option value="">Semua Lokasi</option>' +
      locs.map(l => `<option value="${l}">${l}</option>`).join('');
  }

  // Read URL params for pre-filter
  const params = new URLSearchParams(window.location.search);
  const preQ = params.get('q') || '';
  const preCat = params.get('cat') || '';
  const preType = params.get('type') || '';
  const preLoc = params.get('loc') || '';

  const searchInput = document.getElementById('search-input');
  if (searchInput && preQ) searchInput.value = preQ;
  if (catSel && preCat) catSel.value = preCat;
  if (typeSel && preType) typeSel.value = preType;
  if (locSel && preLoc) locSel.value = preLoc;

  // State
  JOSH.state.filters = { q: preQ, cat: preCat, type: preType, loc: preLoc };
  JOSH.state.page = 1;

  // Event listeners
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      JOSH.state.filters.q = searchInput.value.trim().toLowerCase();
      JOSH.state.page = 1;
      renderJobList();
    });
  }
  [catSel, typeSel, locSel].forEach(sel => {
    if (!sel) return;
    sel.addEventListener('change', () => {
      JOSH.state.filters.cat = catSel ? catSel.value : '';
      JOSH.state.filters.type = typeSel ? typeSel.value : '';
      JOSH.state.filters.loc = locSel ? locSel.value : '';
      JOSH.state.page = 1;
      renderJobList();
    });
  });

  // Clear filters button
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      JOSH.state.filters = { q: '', cat: '', type: '', loc: '' };
      JOSH.state.page = 1;
      if (searchInput) searchInput.value = '';
      if (catSel) catSel.value = '';
      if (typeSel) typeSel.value = '';
      if (locSel) locSel.value = '';
      renderJobList();
    });
  }

  renderJobList();
}

function filterJobs() {
  const f = JOSH.state.filters;
  return JOSH.data.jobs.filter(j => {
    if (f.cat && j.category !== f.cat) return false;
    if (f.type && j.type !== f.type) return false;
    if (f.loc && j.location !== f.loc) return false;
    if (f.q) {
      const hay = (j.title + ' ' + j.company + ' ' + j.location + ' ' + getCatName(j.category)).toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
}

function renderJobList() {
  const grid = document.getElementById('job-grid');
  const pagi = document.getElementById('pagination');
  if (!grid) return;

  const filtered = filterJobs();
  JOSH.state.jobsFiltered = filtered;

  // Update count
  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = filtered.length;

  // Pagination
  const perPage = JOSH.state.perPage;
  const totalPages = Math.ceil(filtered.length / perPage);
  if (JOSH.state.page > totalPages && totalPages > 0) JOSH.state.page = 1;
  const start = (JOSH.state.page - 1) * perPage;
  const pageJobs = filtered.slice(start, start + perPage);

  if (pageJobs.length === 0) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state-josh">
          <div class="icon">🔍</div>
          <h3>Tidak ada lowongan ditemukan</h3>
          <p class="text-muted">Coba ubah filter atau kata kunci pencarian.</p>
          <button class="btn btn-outline-dark mt-3" id="empty-clear">Reset Filter</button>
        </div>
      </div>`;
    const ec = document.getElementById('empty-clear');
    if (ec) ec.addEventListener('click', () => document.getElementById('clear-filters')?.click());
    if (pagi) pagi.innerHTML = '';
    return;
  }

  grid.innerHTML = pageJobs.map(j => `
    <div class="col-md-6 col-lg-4 reveal visible">
      <a href="${basePath()}/detail.html?id=${j.id}" class="job-card-josh">
        <div class="job-card-top">
          <div class="job-card-icon">${j.icon || getCatIcon(j.category)}</div>
          <div class="job-card-info">
            <h3 class="job-card-title">${j.title}</h3>
            <p class="job-card-company">${j.company}</p>
          </div>
        </div>
        <div class="d-flex gap-1 flex-wrap">
          <span class="badge-josh badge-cat-josh">${getCatName(j.category)}</span>
          <span class="badge-josh badge-type-josh">${getJobType(j.type)}</span>
          <span class="badge-josh badge-loc-josh">📍 ${j.location}</span>
        </div>
        <div class="job-card-bottom">
          <span class="job-card-salary">${fmtSalary(j)}</span>
          <span class="job-card-posted">${fmtDate(j.posted)}</span>
        </div>
      </a>
    </div>`).join('');

  // Render pagination
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagi = document.getElementById('pagination');
  if (!pagi || totalPages <= 1) {
    if (pagi) pagi.innerHTML = '';
    return;
  }

  const cur = JOSH.state.page;
  let pages = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages = [1];
    if (cur > 3) pages.push('...');
    const start = Math.max(2, cur - 1);
    const end = Math.min(totalPages - 1, cur + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (cur < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  pagi.innerHTML = `
    <nav>
      <ul class="pagination justify-content-center gap-1">
        <li class="page-item ${cur === 1 ? 'disabled' : ''}">
          <button class="page-link border-0 bg-transparent text-dark" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''} aria-label="Previous">‹</button>
        </li>
        ${pages.map(p => {
          if (p === '...') return '<li class="page-item disabled"><span class="page-link border-0 bg-transparent text-muted">…</span></li>';
          return `<li class="page-item ${p === cur ? 'active' : ''}">
            <button class="page-link border-0 ${p === cur ? 'bg-dark text-white' : 'bg-transparent text-dark'}" data-page="${p}">${p}</button>
          </li>`;
        }).join('')}
        <li class="page-item ${cur === totalPages ? 'disabled' : ''}">
          <button class="page-link border-0 bg-transparent text-dark" data-page="${cur + 1}" ${cur === totalPages ? 'disabled' : ''} aria-label="Next">›</button>
        </li>
      </ul>
    </nav>`;

  pagi.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p >= 1 && p <= totalPages && p !== cur) {
        JOSH.state.page = p;
        renderJobList();
        window.scrollTo({ top: 200, behavior: 'smooth' });
      }
    });
  });
}

// ═══════════════════════════════════════════
// DETAIL — Job detail page (?id=)
// ═══════════════════════════════════════════
function initDetail() {
  const slot = document.getElementById('detail-slot');
  if (!slot) return;

  const id = parseInt(getParam('id'), 10);
  const job = JOSH.data.jobs.find(j => j.id === id);

  if (!job) {
    slot.innerHTML = `
      <div class="detail-notfound-josh">
        <div class="icon">🤷</div>
        <h2>Lowongan tidak ditemukan</h2>
        <p class="text-muted">Lowongan yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
        <a href="${basePath()}/lowongan.html" class="btn btn-dark mt-3">Lihat Semua Lowongan</a>
      </div>`;
    return;
  }

  const wa = JOSH.data.content.footer.contact.phone;
  const waMsg = `Halo, saya tertarik melamar untuk posisi *${job.title}* di *${job.company}*. Mohon info lebih lanjut.`;
  const waUrl = `https://wa.me/${normalizeWA(wa)}?text=${encodeURIComponent(waMsg)}`;

  // Similar jobs
  const similar = JOSH.data.jobs
    .filter(j => j.category === job.category && j.id !== job.id)
    .slice(0, 3);

  document.title = `${job.title} — ${job.company} | JOSH`;

  slot.innerHTML = `
    <div class="detail-hero-josh">
      <div class="container">
        <a href="${basePath()}/lowongan.html" class="detail-back-josh">← Kembali ke Lowongan</a>
        <div class="detail-hero-top">
          <div class="detail-icon-josh">${getCatIcon(job.category)}</div>
          <div class="detail-title-block">
            <h1>${job.title}</h1>
            <p class="detail-company">${job.company}</p>
            <div class="detail-badges">
              <span class="badge-josh badge-cat-josh">${getCatName(job.category)}</span>
              <span class="badge-josh badge-type-josh">${getJobType(job.type)}</span>
              <span class="badge-josh badge-loc-josh">📍 ${job.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="py-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-8 detail-main-josh">
            <h2>Deskripsi Pekerjaan</h2>
            <p>${job.description}</p>

            <h2>Persyaratan</h2>
            <ul>
              ${job.requirements.map(r => `<li>${r}</li>`).join('')}
            </ul>

            <h2>Tentang ${job.company}</h2>
            <p>${job.about || 'Perusahaan yang berlokasi di ' + job.location + ', berkomitmen memberikan layanan terbaik bagi pelanggan dan lingkungan sekitar.'}</p>

            ${similar.length ? `
              <h2>Lowongan Serupa</h2>
              <div class="row g-3 mt-2">
                ${similar.map(s => `
                  <div class="col-md-4">
                    <a href="${basePath()}/detail.html?id=${s.id}" class="job-card-josh">
                      <div class="job-card-top">
                        <div class="job-card-icon" style="width:40px;height:40px;font-size:1.4rem">${s.icon || getCatIcon(s.category)}</div>
                        <div class="job-card-info">
                          <h3 class="job-card-title">${s.title}</h3>
                          <p class="job-card-company">${s.company}</p>
                        </div>
                      </div>
                      <div class="job-card-bottom">
                        <span class="job-card-salary">${fmtSalary(s)}</span>
                        <span class="job-card-posted">${fmtDate(s.posted)}</span>
                      </div>
                    </a>
                  </div>`).join('')}
              </div>` : ''}
          </div>

          <div class="col-lg-4">
            <div class="detail-sidebar-josh">
              <div class="apply-card-josh">
                <h3>Lamar Pekerjaan Ini</h3>
                <div class="apply-meta">
                  <div class="apply-meta-row">
                    <span class="apply-meta-label">Gaji</span>
                    <span class="apply-meta-val">${fmtSalary(job)}</span>
                  </div>
                  <div class="apply-meta-row">
                    <span class="apply-meta-label">Tipe</span>
                    <span class="apply-meta-val">${getJobType(job.type)}</span>
                  </div>
                  <div class="apply-meta-row">
                    <span class="apply-meta-label">Lokasi</span>
                    <span class="apply-meta-val">${job.location}</span>
                  </div>
                  <div class="apply-meta-row">
                    <span class="apply-meta-label">Dipasang</span>
                    <span class="apply-meta-val">${fmtDate(job.posted)}</span>
                  </div>
                </div>
                <a href="${waUrl}" target="_blank" class="btn btn-dark w-100 mb-2">
                  💬 Lamar via WhatsApp
                </a>
                <button class="btn btn-outline-dark w-100" onclick="navigator.share?.({title:'${job.title}',url:window.location.href}).catch(()=>copyLink())">
                  🔗 Bagikan Lowongan
                </button>
                <p class="text-muted text-center mt-3" style="font-size:.75rem">
                  Lamaran dikirim langsung ke perusahaan via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function copyLink() {
  navigator.clipboard?.writeText(window.location.href);
  showToast('Link disalin!');
}
