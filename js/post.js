/* ============================================
   JOSH — post.js
   Form pasang lowongan: populate selects from
   content.json, validate, build WA message, submit.
   Listens for 'app:ready' event from app.js
   ============================================ */

window.addEventListener('app:ready', () => {
  if (JOSH.state.currentPage === 'pasang') {
    initPostForm();
  }
});

function initPostForm() {
  const { categories, jobTypes, postForm } = JOSH.data.content;
  const form = document.getElementById('post-job-form');
  if (!form) return;

  // Populate category select
  const catSel = document.getElementById('f-category');
  if (catSel) {
    catSel.innerHTML = '<option value="">Pilih kategori...</option>' +
      categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  // Populate type select
  const typeSel = document.getElementById('f-type');
  if (typeSel) {
    typeSel.innerHTML = '<option value="">Pilih tipe...</option>' +
      jobTypes.map(t => `<option value="${t.label}">${t.label}</option>`).join('');
  }

  // Populate location select
  const locSel = document.getElementById('f-location');
  if (locSel) {
    const locs = [...new Set(JOSH.data.jobs.map(j => j.location))].sort();
    locSel.innerHTML = '<option value="">Pilih lokasi...</option>' +
      locs.map(l => `<option value="${l}">${l}</option>`).join('') +
      '<option value="other">Lainnya</option>';
  }

  // Submit handler
  form.addEventListener('submit', e => {
    e.preventDefault();

    const data = {
      company: form.querySelector('#f-company').value.trim(),
      contact: form.querySelector('#f-contact').value.trim(),
      phone: form.querySelector('#f-phone').value.trim(),
      title: form.querySelector('#f-title').value.trim(),
      category: form.querySelector('#f-category').value,
      type: form.querySelector('#f-type').value,
      location: form.querySelector('#f-location').value,
      salary: form.querySelector('#f-salary').value.trim(),
      requirements: form.querySelector('#f-requirements').value.trim(),
      description: form.querySelector('#f-description').value.trim()
    };

    // Validate
    const errors = [];
    const required = ['company', 'contact', 'phone', 'title', 'category', 'type', 'location', 'description'];
    required.forEach(field => {
      const input = form.querySelector(`#f-${field}`);
      const wrap = input?.closest('.form-field-josh');
      if (!data[field]) {
        errors.push(field);
        wrap?.classList.add('invalid');
      } else {
        wrap?.classList.remove('invalid');
      }
    });

    if (data.phone && !/^08[0-9]{8,12}$/.test(data.phone.replace(/[^0-9]/g, ''))) {
      errors.push('phone');
      form.querySelector('#f-phone')?.closest('.form-field-josh')?.classList.add('invalid');
    }

    if (errors.length) {
      showToast('Mohon lengkapi data yang wajib diisi (*)');
      // Scroll to first error
      const firstErr = form.querySelector('.form-field-josh.invalid');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build WA message
    const wa = JOSH.data.content.footer.contact.phone;
    const msg = buildWAMessage(data);
    const waUrl = `https://wa.me/${normalizeWA(wa)}?text=${encodeURIComponent(msg)}`;

    showToast('Mengarahkan ke WhatsApp...');
    setTimeout(() => {
      window.open(waUrl, '_blank');
      form.reset();
    }, 800);
  });

  // Clear invalid on input
  form.querySelectorAll('.form-control-josh, .form-select-josh').forEach(el => {
    el.addEventListener('input', () => {
      el.closest('.form-field-josh')?.classList.remove('invalid');
    });
    el.addEventListener('change', () => {
      el.closest('.form-field-josh')?.classList.remove('invalid');
    });
  });
}

function buildWAMessage(d) {
  const lines = [
    '🧑‍💼 *PASANG LOWONGAN BARU*',
    '========================',
    '',
    '📋 *DATA PERUSAHAAN*',
    `Nama Perusahaan: ${d.company}`,
    `Nama Kontak: ${d.contact}`,
    `No. WhatsApp: ${d.phone}`,
    '',
    '💼 *DETAIL LOWONGAN*',
    `Judul Posisi: ${d.title}`,
    `Kategori: ${d.category}`,
    `Tipe Pekerjaan: ${d.type}`,
    `Lokasi: ${d.location}`,
    `Gaji: ${d.salary || 'Negotiable'}`,
    '',
    '📝 *DESKRIPSI*',
    d.description,
  ];

  if (d.requirements) {
    lines.push('', '✅ *PERSYARATAN*', d.requirements);
  }

  lines.push('', '========================', '_Dikirim via JOSH - Job Optimisation & Staffing Hub_');

  return lines.join('\n');
}
