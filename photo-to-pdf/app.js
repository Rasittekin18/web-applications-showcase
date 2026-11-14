/* ============================================================
   app.js — PhotoPDF | Photo to PDF Converter
   Hızlı, güvenli ve ücretsiz PDF dönüştürücü.
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
let photos = [];         // Array of { file, src, name, displayName, relativePath, lastModified, id }
let dragSrcIndex = null; // Index of card being dragged
let lightboxIndex = 0;
let nextPhotoId = 1;
let activeFolderName = '';
let filenameTouched = false;

const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|bmp|gif|tiff?|avif)$/i;
const IGNORED_SYSTEM_FILES = new Set(['thumbs.db', '.ds_store', 'desktop.ini']);
const naturalCollator = new Intl.Collator('tr', { numeric: true, sensitivity: 'base' });

// ─── DOM Refs ─────────────────────────────────────────────────
const uploadZone        = document.getElementById('uploadZone');
const fileInput         = document.getElementById('fileInput');
const folderInput       = document.getElementById('folderInput');
const selectBtn         = document.getElementById('selectBtn');
const selectFolderBtn   = document.getElementById('selectFolderBtn');
const addMoreBtn        = document.getElementById('addMoreBtn');
const addFolderBtn      = document.getElementById('addFolderBtn');
const clearAllBtn       = document.getElementById('clearAllBtn');
const controlsSection   = document.getElementById('controlsSection');
const previewSection    = document.getElementById('previewSection');
const convertSection    = document.getElementById('convertSection');
const photoGrid         = document.getElementById('photoGrid');
const photoCountText    = document.getElementById('photoCountText');
const folderBadge       = document.getElementById('folderBadge');
const folderBadgeText   = document.getElementById('folderBadgeText');
const sortOrderSelect   = document.getElementById('sortOrder');
const convertPhotoCount = document.getElementById('convertPhotoCount');
const convertBtn        = document.getElementById('convertBtn');
const progressOverlay   = document.getElementById('progressOverlay');
const progressBar       = document.getElementById('progressBar');
const progressText      = document.getElementById('progressText');
const toast             = document.getElementById('toast');
const lightbox          = document.getElementById('lightbox');
const lightboxImg       = document.getElementById('lightboxImg');
const lightboxClose     = document.getElementById('lightboxClose');
const lightboxPrev      = document.getElementById('lightboxPrev');
const lightboxNext      = document.getElementById('lightboxNext');
const lightboxCounter   = document.getElementById('lightboxCounter');
const pdfFilenameInput  = document.getElementById('pdfFilename');
const bgColorInput      = document.getElementById('bgColor');
const colorLabel        = document.getElementById('colorLabel');
const bgParticles       = document.getElementById('bgParticles');

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

// ─── Form Inputs ──────────────────────────────────────────────
bgColorInput.addEventListener('input', () => {
  colorLabel.textContent = bgColorInput.value;
});

pdfFilenameInput.addEventListener('input', () => {
  const val = pdfFilenameInput.value.trim();
  filenameTouched = val !== '' && val !== 'fotograf-pdf' && val !== activeFolderName;
});

sortOrderSelect.addEventListener('change', () => {
  const mode = sortOrderSelect.value;
  if (mode === 'manual' || photos.length === 0) return;
  applySort(mode, true);
});

// ─── Upload Zone Events ───────────────────────────────────────
selectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

selectFolderBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openFolderPicker();
});

addMoreBtn.addEventListener('click', () => fileInput.click());
addFolderBtn.addEventListener('click', () => openFolderPicker());

let directoryPickerBlocked = false;

async function openFolderPicker() {
  const canUseDirectoryPicker =
    !directoryPickerBlocked &&
    typeof window.showDirectoryPicker === 'function' &&
    window.isSecureContext &&
    window.location?.protocol !== 'file:';

  if (canUseDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const collected = [];
      await readDirectoryHandle(dirHandle, dirHandle.name, collected);
      if (collected.length) {
        addPhotos(collected, { rootFolderName: dirHandle.name, fromFolder: true });
      } else {
        showToast('Seçilen klasörde geçerli görüntü dosyası bulunamadı.', 'error');
      }
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      directoryPickerBlocked = true;
      console.warn('showDirectoryPicker fallback to folderInput:', err);
      // Fallback requires a fresh gesture in some browsers if await consumed activation
      if ('webkitdirectory' in folderInput) {
        try {
          folderInput.click();
          return;
        } catch {
          showToast('Klasör seçiciyi açmak için Klasör Seç butonuna tekrar tıklayın.', 'error');
          return;
        }
      }
    }
  }

  if ('webkitdirectory' in folderInput) {
    folderInput.click();
  } else {
    showToast('Tarayıcınız klasör seçimini desteklemiyor. Klasörü sürükleyip bırakabilirsiniz.', 'error');
  }
}

async function readDirectoryHandle(dirHandle, currentPath, collected) {
  for await (const entry of dirHandle.values()) {
    const entryPath = `${currentPath}/${entry.name}`;
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      collected.push({ file, relativePath: entryPath });
    } else if (entry.kind === 'directory') {
      await readDirectoryHandle(entry, entryPath, collected);
    }
  }
}

uploadZone.addEventListener('dragover', (e) => {
  if (dragSrcIndex !== null) return;
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', (e) => {
  if (!uploadZone.contains(e.relatedTarget)) {
    uploadZone.classList.remove('drag-over');
  }
});

uploadZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  if (dragSrcIndex !== null) return;

  // Capture FileSystemEntry handles synchronously before DataTransferItemList clears
  const dtItems = Array.from(e.dataTransfer.items || []);
  const entries = dtItems
    .map(item => (typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null))
    .filter(Boolean);

  if (entries.length > 0) {
    const hasDirectory = entries.some(entry => entry.isDirectory);
    const rootFolderName = entries.length === 1 && entries[0].isDirectory ? entries[0].name : '';
    const collected = [];

    for (const entry of entries) {
      await traverseEntry(entry, collected);
    }

    if (collected.length) {
      addPhotos(collected, { rootFolderName, fromFolder: hasDirectory });
    } else {
      showToast(
        hasDirectory ? 'Klasörde geçerli görüntü dosyası bulunamadı.' : 'Lütfen geçerli görüntü dosyaları seçin.',
        'error'
      );
    }
    return;
  }

  const files = Array.from(e.dataTransfer.files || []).map(f => ({
    file: f,
    relativePath: f.webkitRelativePath || f.name,
  }));
  if (files.length) addPhotos(files);
  else showToast('Lütfen geçerli görüntü dosyaları seçin.', 'error');
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (files.length) {
    const items = files.map(f => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name,
    }));
    addPhotos(items);
  }
  fileInput.value = '';
});

folderInput.addEventListener('change', () => {
  const files = Array.from(folderInput.files);
  if (files.length) {
    const items = files.map(f => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name,
    }));
    const rootFolderName = extractRootFolderName(items);
    addPhotos(items, { rootFolderName, fromFolder: true });
  }
  folderInput.value = '';
});

// ─── Directory Traversal (Drag & Drop) ────────────────────────
function readFileEntry(fileEntry) {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

/**
 * Chromium's readEntries returns at most 100 items per call; loop until empty.
 */
function readAllDirectoryEntries(dirReader) {
  return new Promise((resolve, reject) => {
    const allEntries = [];
    function readBatch() {
      dirReader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(allEntries);
        } else {
          allEntries.push(...batch);
          readBatch();
        }
      }, reject);
    }
    readBatch();
  });
}

async function traverseEntry(entry, collected) {
  if (entry.isFile) {
    try {
      const file = await readFileEntry(entry);
      const relPath = (entry.fullPath || file.name).replace(/^\/+/, '');
      collected.push({ file, relativePath: relPath });
    } catch (err) {
      console.warn('Dosya okunamadı:', entry.fullPath, err);
    }
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const children = await readAllDirectoryEntries(dirReader);
    for (const child of children) {
      await traverseEntry(child, collected);
    }
  }
}

// ─── Natural Sorting & Path Helpers ───────────────────────────
function isImageFile(file) {
  if (!file || !file.name) return false;
  const lower = file.name.toLowerCase();
  if (IGNORED_SYSTEM_FILES.has(lower) || lower.startsWith('._')) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  return IMAGE_EXT_REGEX.test(file.name);
}

function extractRootFolderName(items) {
  if (!items.length) return '';
  const firstParts = (items[0].relativePath || '').replace(/\\/g, '/').split('/').filter(Boolean);
  if (firstParts.length < 2) return '';
  const candidate = firstParts[0];
  const allShareRoot = items.every(item => {
    const parts = (item.relativePath || '').replace(/\\/g, '/').split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === candidate;
  });
  return allShareRoot ? candidate : '';
}

function deriveDisplayName(cleanPath, rootFolderName, fallbackName) {
  if (!cleanPath || !cleanPath.includes('/')) return fallbackName;
  if (rootFolderName && cleanPath.startsWith(rootFolderName + '/')) {
    return cleanPath.slice(rootFolderName.length + 1) || fallbackName;
  }
  return cleanPath;
}

function splitNameExt(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return { stem: filename, ext: '' };
  return { stem: filename.slice(0, dot), ext: filename.slice(dot + 1) };
}

function compareNaturalStrings(a, b) {
  const res = naturalCollator.compare(a, b);
  if (res !== 0) return res;
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : (a > b ? 1 : 0);
}

/**
 * Compares paths segment-by-segment using natural numeric ordering (e.g. 1, 2, 3, 5, 7, 10)
 * and compares file stems before extensions so "1.jpg" precedes "1 (2).jpg".
 */
function comparePathsNatural(pathA, pathB) {
  const segsA = (pathA || '').split('/');
  const segsB = (pathB || '').split('/');
  const len = Math.min(segsA.length, segsB.length);

  for (let i = 0; i < len; i++) {
    const isLastA = i === segsA.length - 1;
    const isLastB = i === segsB.length - 1;

    if (isLastA && isLastB) {
      const aParts = splitNameExt(segsA[i]);
      const bParts = splitNameExt(segsB[i]);
      const stemCmp = compareNaturalStrings(aParts.stem, bParts.stem);
      if (stemCmp !== 0) return stemCmp;
      const extCmp = compareNaturalStrings(aParts.ext, bParts.ext);
      if (extCmp !== 0) return extCmp;
      return 0;
    }

    const segCmp = compareNaturalStrings(segsA[i], segsB[i]);
    if (segCmp !== 0) return segCmp;
  }

  return segsA.length - segsB.length;
}

function getSortComparator(mode) {
  switch (mode) {
    case 'natural-asc':
      return (a, b) => comparePathsNatural(a.relativePath, b.relativePath) || (a.id - b.id);
    case 'natural-desc':
      return (a, b) => comparePathsNatural(b.relativePath, a.relativePath) || (a.id - b.id);
    case 'date-asc':
      return (a, b) => ((a.lastModified || 0) - (b.lastModified || 0)) || comparePathsNatural(a.relativePath, b.relativePath) || (a.id - b.id);
    case 'date-desc':
      return (a, b) => ((b.lastModified || 0) - (a.lastModified || 0)) || comparePathsNatural(a.relativePath, b.relativePath) || (a.id - b.id);
    default:
      return null;
  }
}

function applySort(mode, shouldRender = true) {
  const comparator = getSortComparator(mode);
  if (!comparator) return;
  photos.sort(comparator);
  if (shouldRender) {
    renderGrid();
    showToast('Sıralama güncellendi', 'success');
  }
}

// ─── Add Photos ───────────────────────────────────────────────
function addPhotos(rawItems, { rootFolderName = '', fromFolder = false } = {}) {
  const normalized = rawItems.map(item =>
    item instanceof File
      ? { file: item, relativePath: item.webkitRelativePath || item.name }
      : item
  );

  const imageItems = normalized.filter(item => isImageFile(item.file));
  if (!imageItems.length) {
    showToast(
      fromFolder ? 'Seçilen klasörde geçerli görüntü dosyası bulunamadı.' : 'Desteklenmeyen dosya formatı!',
      'error'
    );
    return;
  }

  const wasEmpty = photos.length === 0;
  const effectiveRoot = rootFolderName || (fromFolder ? extractRootFolderName(imageItems) : '');

  const newEntries = imageItems.map(({ file, relativePath }) => {
    const cleanPath = (relativePath || file.name).replace(/\\/g, '/').replace(/^\/+/, '');
    const displayName = deriveDisplayName(cleanPath, effectiveRoot, file.name);
    return {
      file,
      src: URL.createObjectURL(file),
      name: file.name,
      displayName,
      relativePath: cleanPath,
      lastModified: file.lastModified || 0,
      id: nextPhotoId++,
    };
  });

  // Sort incoming batch naturally first so folder files never keep arbitrary filesystem order
  newEntries.sort((a, b) => comparePathsNatural(a.relativePath, b.relativePath) || (a.id - b.id));

  photos = [...photos, ...newEntries];

  const sortMode = sortOrderSelect.value;
  if (sortMode !== 'manual') {
    applySort(sortMode, false);
  }

  if (effectiveRoot) {
    if (wasEmpty) {
      activeFolderName = effectiveRoot;
      if (!filenameTouched) {
        pdfFilenameInput.value = effectiveRoot;
      }
    } else if (activeFolderName && activeFolderName !== effectiveRoot) {
      activeFolderName = `${activeFolderName} + …`;
    }
  }

  updateUI();

  const sourceLabel = fromFolder ? 'Klasörden ' : '';
  const sortHint = sortMode === 'natural-asc' ? ' (doğal sırada)' : '';
  showToast(`${sourceLabel}${newEntries.length} fotoğraf eklendi${sortHint} ✓`, 'success');
}

// ─── Update UI ────────────────────────────────────────────────
function updateUI() {
  const count = photos.length;
  const hasPhotos = count > 0;

  controlsSection.style.display = hasPhotos ? '' : 'none';
  previewSection.style.display  = hasPhotos ? '' : 'none';
  convertSection.style.display  = hasPhotos ? '' : 'none';

  photoCountText.textContent = `${count} fotoğraf`;
  convertPhotoCount.textContent = `${count} fotoğraf`;

  if (hasPhotos && activeFolderName) {
    folderBadge.style.display = '';
    folderBadgeText.textContent = activeFolderName;
    folderBadge.title = activeFolderName;
  } else {
    folderBadge.style.display = 'none';
    folderBadgeText.textContent = '';
  }

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
  card.title = photo.relativePath || photo.name;

  const label = photo.displayName || photo.name;

  card.innerHTML = `
    <img src="${photo.src}" alt="${escapeHtml(label)}" loading="lazy" />
    <div class="photo-card-overlay">
      <div class="photo-card-actions">
        <button class="card-btn card-btn-view" title="Önizle" type="button" data-action="view" data-index="${index}">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="card-btn card-btn-remove" title="Kaldır" type="button" data-action="remove" data-index="${index}">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l.75 9.5h4.5L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
    <div class="photo-card-index">${index + 1}</div>
    <div class="photo-card-name">${escapeHtml(label)}</div>
  `;

  // Drag events for reordering
  card.addEventListener('dragstart', (e) => {
    dragSrcIndex = index;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    dragSrcIndex = null;
    card.classList.remove('dragging');
    document.querySelectorAll('.photo-card').forEach(c => c.classList.remove('drag-target'));
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcIndex !== null && dragSrcIndex !== index) {
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
      sortOrderSelect.value = 'manual';
      renderGrid();
      showToast('Sıralama güncellendi', 'success');
    }
  });

  // Button actions
  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = parseInt(btn.dataset.index, 10);

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
  const [removed] = photos.splice(index, 1);
  if (removed && removed.src && removed.src.startsWith('blob:')) {
    URL.revokeObjectURL(removed.src);
  }
  if (photos.length === 0) {
    activeFolderName = '';
    if (!filenameTouched) {
      pdfFilenameInput.value = 'fotograf-pdf';
    }
  }
  updateUI();
  if (photos.length === 0) {
    showToast('Tüm fotoğraflar kaldırıldı', 'success');
  }
}

// ─── Clear All ────────────────────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  if (photos.length === 0) return;
  photos.forEach(p => {
    if (p.src && p.src.startsWith('blob:')) URL.revokeObjectURL(p.src);
  });
  photos = [];
  activeFolderName = '';
  if (!filenameTouched) {
    pdfFilenameInput.value = 'fotograf-pdf';
  }
  sortOrderSelect.value = 'natural-asc';
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
  const current = photos[lightboxIndex];
  lightboxImg.src = current.src;
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${photos.length} — ${current.displayName || current.name}`;
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
  const filenameRaw = (pdfFilenameInput.value.trim() || 'fotograf-pdf').replace(/\.pdf$/i, '');
  const filename = filenameRaw.replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ ]/g, '_').trim() || 'fotograf-pdf';
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
      const pct = Math.round((i / total) * 90);
      progressBar.style.width = pct + '%';
      progressText.textContent = `Fotoğraf ${i + 1} / ${total} işleniyor (${photos[i].name})...`;
      await sleep(10);

      // Load image dimensions
      const { width: imgW, height: imgH, dataUrl, format } = await loadImageDimensions(photos[i], qualitySetting, bgHex);

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

function loadImageDimensions(photo, quality, bgHex = '#ffffff') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      const isPng = photo.file?.type === 'image/png' || /\.png$/i.test(photo.name);
      let format = 'JPEG';
      let dataUrl;

      if (isPng && quality === 1.0) {
        ctx.drawImage(img, 0, 0);
        format = 'PNG';
        dataUrl = canvas.toDataURL('image/png');
      } else {
        // Fill background before JPEG export so transparent PNG/WEBP areas do not turn black
        ctx.fillStyle = bgHex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      canvas.width = 0;
      canvas.height = 0;

      resolve({ width: img.naturalWidth, height: img.naturalHeight, dataUrl, format });
    };
    img.onerror = () => {
      reject(new Error(`"${photo.name}" görüntüsü yüklenemedi veya desteklenmiyor.`));
    };
    img.src = photo.src;
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
