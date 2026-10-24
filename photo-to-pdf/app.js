/* ============================================================
   app.js — PhotoPDF | Photo to PDF Converter
   Hızlı, güvenli ve ücretsiz PDF dönüştürücü.
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
let photos = [];         // Array of { file, src, name, id }
let dragSrcIndex = null; // Index of card being dragged
let lightboxIndex = 0;

// ─── DOM Refs ─────────────────────────────────────────────────
const uploadZone       = document.getElementById('uploadZone');
const fileInput        = document.getElementById('fileInput');
const selectBtn        = document.getElementById('selectBtn');
const addMoreBtn       = document.getElementById('addMoreBtn');
const clearAllBtn      = document.getElementById('clearAllBtn');
const controlsSection  = document.getElementById('controlsSection');
const previewSection   = document.getElementById('previewSection');
const convertSection   = document.getElementById('convertSection');
const photoGrid        = document.getElementById('photoGrid');
const photoCountText   = document.getElementById('photoCountText');
const convertPhotoCount= document.getElementById('convertPhotoCount');
const convertBtn       = document.getElementById('convertBtn');
const progressOverlay  = document.getElementById('progressOverlay');
const progressBar      = document.getElementById('progressBar');
const progressText     = document.getElementById('progressText');
const toast            = document.getElementById('toast');
const lightbox         = document.getElementById('lightbox');
const lightboxImg      = document.getElementById('lightboxImg');
const lightboxClose    = document.getElementById('lightboxClose');
const lightboxPrev     = document.getElementById('lightboxPrev');
const lightboxNext     = document.getElementById('lightboxNext');
const lightboxCounter  = document.getElementById('lightboxCounter');
const bgColorInput     = document.getElementById('bgColor');
const colorLabel       = document.getElementById('colorLabel');
const bgParticles      = document.getElementById('bgParticles');

// ─── Init Particles ───────────────────────────────────────────
function initParticles() {
  const colors = ['#a78bfa', '#ec4899', '#818cf8', '#f472b6', '#c084fc'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const dur = Math.random() * 20 + 12;
    const delay = Math.random() * 20;
    Object.assign(p.style, {
      width: size + 'px',
      height: size + 'px',
      background: color,
      left: left + '%',
      bottom: '-10px',
      animationDuration: dur + 's',
      animationDelay: delay + 's',
      boxShadow: `0 0 ${size * 2}px ${color}`,
    });
    bgParticles.appendChild(p);
  }
}

initParticles();

// ─── Color Picker ─────────────────────────────────────────────
bgColorInput.addEventListener('input', () => {
  colorLabel.textContent = bgColorInput.value;
});

// ─── Upload Zone Events ───────────────────────────────────────
uploadZone.addEventListener('click', (e) => {
  if (!e.target.closest('.btn')) fileInput.click();
});

selectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

addMoreBtn.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', (e) => {
  if (!uploadZone.contains(e.relatedTarget)) {
    uploadZone.classList.remove('drag-over');
  }
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) addPhotos(files);
  else showToast('Lütfen geçerli görüntü dosyaları seçin.', 'error');
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (files.length) addPhotos(files);
  fileInput.value = '';
});

// ─── Add Photos ───────────────────────────────────────────────
function addPhotos(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) {
    showToast('Desteklenmeyen dosya formatı!', 'error');
    return;
  }

  let loaded = 0;
  const results = [];

  imageFiles.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      results[i] = { file, src: e.target.result, name: file.name, id: Date.now() + i };
      loaded++;
      if (loaded === imageFiles.length) {
        photos = [...photos, ...results];
        updateUI();
        showToast(`${imageFiles.length} fotoğraf eklendi ✓`, 'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

// ─── Update UI ────────────────────────────────────────────────
function updateUI() {
  const count = photos.length;
  const hasPhotos = count > 0;

  controlsSection.style.display = hasPhotos ? '' : 'none';
  previewSection.style.display  = hasPhotos ? '' : 'none';
  convertSection.style.display  = hasPhotos ? '' : 'none';

  photoCountText.textContent = `${count} fotoğraf`;
  convertPhotoCount.textContent = count;

  renderGrid();
}

// ─── Render Photo Grid ────────────────────────────────────────
function renderGrid() {
  photoGrid.innerHTML = '';
  photos.forEach((photo, index) => {
    const card = createPhotoCard(photo, index);
    photoGrid.appendChild(card);
  });
}

function createPhotoCard(photo, index) {
  const card = document.createElement('div');
  card.className = 'photo-card';
  card.draggable = true;
  card.dataset.index = index;

  card.innerHTML = `
    <img src="${photo.src}" alt="${escapeHtml(photo.name)}" loading="lazy" />
    <div class="photo-card-overlay">
      <div class="photo-card-actions">
        <button class="card-btn card-btn-view" title="Önizle" data-action="view" data-index="${index}">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="card-btn card-btn-remove" title="Kaldır" data-action="remove" data-index="${index}">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l.75 9.5h4.5L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
    <div class="photo-card-index">${index + 1}</div>
    <div class="photo-card-name">${escapeHtml(photo.name)}</div>
  `;

  // Drag events for reordering
  card.addEventListener('dragstart', (e) => {
    dragSrcIndex = index;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.photo-card').forEach(c => c.classList.remove('drag-target'));
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcIndex !== index) {
      document.querySelectorAll('.photo-card').forEach(c => c.classList.remove('drag-target'));
      card.classList.add('drag-target');
    }
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-target');
    if (dragSrcIndex !== null && dragSrcIndex !== index) {
      const moved = photos.splice(dragSrcIndex, 1)[0];
      photos.splice(index, 0, moved);
      dragSrcIndex = null;
      renderGrid();
      showToast('Sıralama güncellendi', 'success');
    }
  });

  // Button actions
  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = parseInt(btn.dataset.index);

    if (action === 'remove') {
      removePhoto(idx);
    } else if (action === 'view') {
      openLightbox(idx);
    }
  });

  return card;
}

// ─── Remove Photo ─────────────────────────────────────────────
function removePhoto(index) {
  photos.splice(index, 1);
  updateUI();
  if (photos.length === 0) {
    showToast('Tüm fotoğraflar kaldırıldı', 'success');
  }
}

// ─── Clear All ────────────────────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  if (photos.length === 0) return;
  photos = [];
  updateUI();
  showToast('Tüm fotoğraflar temizlendi', 'success');
});

// ─── Lightbox ─────────────────────────────────────────────────
function openLightbox(index) {
  lightboxIndex = index;
  lightbox.style.display = 'flex';
  updateLightbox();
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.style.display = 'none';
  document.body.style.overflow = '';
}

function updateLightbox() {
  lightboxImg.src = photos[lightboxIndex].src;
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${photos.length}`;
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

lightboxPrev.addEventListener('click', () => {
  lightboxIndex = (lightboxIndex - 1 + photos.length) % photos.length;
  updateLightbox();
});

lightboxNext.addEventListener('click', () => {
  lightboxIndex = (lightboxIndex + 1) % photos.length;
  updateLightbox();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.style.display !== 'none') {
    if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + photos.length) % photos.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % photos.length; updateLightbox(); }
    if (e.key === 'Escape')     closeLightbox();
  }
});

// ─── Convert to PDF ───────────────────────────────────────────
convertBtn.addEventListener('click', generatePDF);

async function generatePDF() {
  if (photos.length === 0) {
    showToast('Önce fotoğraf ekleyin!', 'error');
    return;
  }

  // Get settings
  const pageSizeSetting = document.getElementById('pageSize').value;
  const orientationSetting = document.getElementById('pageOrientation').value;
  const qualitySetting = parseFloat(document.getElementById('imageQuality').value);
  const fitSetting = document.getElementById('imageFit').value;
  const filenameRaw = document.getElementById('pdfFilename').value.trim() || 'fotograf-pdf';
  const filename = filenameRaw.replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ ]/g, '_');
  const bgHex = bgColorInput.value;

  // Show progress
  progressOverlay.style.display = 'flex';
  progressBar.style.width = '0%';
  progressText.textContent = 'PDF hazırlanıyor...';

  // Small delay to let the UI paint
  await sleep(80);

  try {
    const { jsPDF } = window.jspdf;

    let pdfDoc = null;
    const total = photos.length;

    for (let i = 0; i < total; i++) {
      // Update progress
      const pct = Math.round(((i) / total) * 90);
      progressBar.style.width = pct + '%';
      progressText.textContent = `Fotoğraf ${i + 1} / ${total} işleniyor...`;
      await sleep(10);

      // Load image dimensions
      const { width: imgW, height: imgH, dataUrl, format } = await loadImageDimensions(photos[i].src, qualitySetting);

      // Determine orientation for this page
      let orient;
      if (orientationSetting === 'auto') {
        orient = imgW >= imgH ? 'landscape' : 'portrait';
      } else {
        orient = orientationSetting;
      }

      // Page size in mm
      const pageDims = getPageDimsMm(pageSizeSetting, orient);
      const pw = pageDims.w;
      const ph = pageDims.h;

      if (!pdfDoc) {
        pdfDoc = new jsPDF({ orientation: orient, unit: 'mm', format: pageSizeSetting });
      } else {
        pdfDoc.addPage(pageSizeSetting, orient);
      }

      // Background
      pdfDoc.setFillColor(hexToR(bgHex), hexToG(bgHex), hexToB(bgHex));
      pdfDoc.rect(0, 0, pw, ph, 'F');

      // Calculate image placement
      const placement = calcPlacement(imgW, imgH, pw, ph, fitSetting);

      // Add image
      pdfDoc.addImage(dataUrl, format, placement.x, placement.y, placement.w, placement.h, undefined, 'FAST');
    }

    progressBar.style.width = '98%';
    progressText.textContent = 'PDF kaydediliyor...';
    await sleep(150);

    pdfDoc.save(`${filename}.pdf`);

    progressBar.style.width = '100%';
    await sleep(300);
    progressOverlay.style.display = 'none';
    showToast(`✓ ${total} sayfalık PDF başarıyla oluşturuldu!`, 'success');

  } catch (err) {
    console.error(err);
    progressOverlay.style.display = 'none';
    showToast('PDF oluşturulurken hata oluştu: ' + err.message, 'error');
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadImageDimensions(src, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Draw on canvas to get compressed dataUrl
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Try JPEG first for compression, PNG for transparency
      let format = 'JPEG';
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Fallback: if src is PNG and quality is max, keep PNG
      if (src.startsWith('data:image/png') && quality === 1.0) {
        format = 'PNG';
        dataUrl = canvas.toDataURL('image/png');
      }

      resolve({ width: img.naturalWidth, height: img.naturalHeight, dataUrl, format });
    };
    img.src = src;
  });
}

function getPageDimsMm(sizeKey, orient) {
  const sizes = {
    a4:     { portrait: { w: 210, h: 297 }, landscape: { w: 297, h: 210 } },
    a3:     { portrait: { w: 297, h: 420 }, landscape: { w: 420, h: 297 } },
    letter: { portrait: { w: 216, h: 279 }, landscape: { w: 279, h: 216 } },
    legal:  { portrait: { w: 216, h: 356 }, landscape: { w: 356, h: 216 } },
  };
  return sizes[sizeKey]?.[orient] ?? sizes.a4.portrait;
}

function calcPlacement(imgW, imgH, pw, ph, fitMode) {
  const margin = fitMode === 'center' ? 10 : 0;
  const availW = pw - margin * 2;
  const availH = ph - margin * 2;

  let drawW, drawH, drawX, drawY;

  if (fitMode === 'fill') {
    // Cover: fill page, may crop
    const scale = Math.max(availW / imgW, availH / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
    drawX = margin + (availW - drawW) / 2;
    drawY = margin + (availH - drawH) / 2;
  } else {
    // Fit (default) and center: contain inside page
    const scale = Math.min(availW / imgW, availH / imgH);
    drawW = imgW * scale;
    drawH = imgH * scale;
    drawX = margin + (availW - drawW) / 2;
    drawY = margin + (availH - drawH) / 2;
  }

  return { x: drawX, y: drawY, w: drawW, h: drawH };
}

function hexToR(hex) { return parseInt(hex.slice(1, 3), 16); }
function hexToG(hex) { return parseInt(hex.slice(3, 5), 16); }
function hexToB(hex) { return parseInt(hex.slice(5, 7), 16); }

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Toast ────────────────────────────────────────────────────
let toastTimer = null;

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = 'toast' + (type ? ' ' + type : '') + ' show';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
