/**
 * Hattan Registry — QR & Barcode Workspace controller
 */

let activeGenType = 'qr';
let html5QrCodeScanner = null;
let savedRecordsList = [];

document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initFormListeners();
    initSavedRecordsStorage();
    initPresetData();
    initUrlState();
});

/**
 * Toast Notification Helper
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

/**
 * Navigation & Tab Switcher
 */
function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTabId = tab.getAttribute('data-tab');
            switchTab(targetTabId);
        });
    });
}

function switchTab(tabId) {
    // Update nav tab active styling
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');

    // Hide all tab contents and show target
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(tabId);
    if (targetContent) targetContent.classList.add('active');

    // If switching to Record Details, refresh view
    if (tabId === 'tab-details') {
        renderRecordToView();
    }

    // If switching to Saved Records, refresh list
    if (tabId === 'tab-saved') {
        renderSavedRecordsTable();
    }

    if (tabId === 'tab-card') renderBarrierCard();
}

/**
 * Initialize Default Preset Data
 */
function initPresetData() {
    loadRecordToForm(DEFAULT_RECORD);
    renderRecordToView(DEFAULT_RECORD);
    triggerCodeGeneration();
}

/**
 * URL Parameter Handling
 */
function initUrlState() {
    const decodedRecord = decodeRecordFromUrl();
    if (decodedRecord) {
        document.body.classList.add('shared-record-mode');
        loadRecordToForm(decodedRecord);
        renderRecordToView(decodedRecord);
        switchTab('tab-details');
    }
}

/**
 * Toggle Code Type (QR vs Barcode)
 */
function setGenType(type) {
    activeGenType = type;
    const qrBtn = document.getElementById('btn-type-qr');
    const barBtn = document.getElementById('btn-type-barcode');
    const qrContainer = document.getElementById('qr-canvas-container');
    const barContainer = document.getElementById('barcode-svg-container');

    if (type === 'qr') {
        qrBtn.classList.add('active');
        barBtn.classList.remove('active');
        qrContainer.style.display = 'block';
        barContainer.style.display = 'none';
    } else {
        barBtn.classList.add('active');
        qrBtn.classList.remove('active');
        qrContainer.style.display = 'none';
        barContainer.style.display = 'block';
    }

    triggerCodeGeneration();
}

/**
 * Trigger Generation
 */
function triggerCodeGeneration() {
    const record = getRecordFromForm();
    const content = encodeRecordToUrl(record);

    if (activeGenType === 'qr') {
        // Canonical QR style: plain black/white modules with no label or decoration.
        const enableBadge = false;
        const badgeText = '';
        const badgeInput = document.getElementById('input-badge-text');
        if (badgeInput) badgeInput.value = badgeText;

        renderCustomQRCode({
            content: content,
            darkColor: '#000000',
            lightColor: '#ffffff',
            enableFrame: false,
            enableBadge: enableBadge,
            badgeText: badgeText,
            badgeIcon: 'fa-globe'
        });
    } else {
        renderCustomBarcode({
            content: record.recordId || 'HHH260466',
            format: 'CODE128'
        });
    }
}

function getQrLinkLabel(recordUrl) {
    try {
        const url = new URL(recordUrl);
        if (url.protocol === 'file:') return 'LOCAL RECORD LINK';
        return url.host.length > 24 ? `${url.host.slice(0, 21)}…` : url.host;
    } catch (_) {
        return 'RECORD LINK';
    }
}

/**
 * Form Event Listeners & Action Buttons
 */
function initFormListeners() {
    document.querySelectorAll('[data-picture-index]').forEach(input => {
        input.addEventListener('change', handleRecordPictureUpload);
    });
    document.getElementById('record-picture-items')?.addEventListener('click', event => {
        const button = event.target.closest('[data-picture-action]');
        if (!button) return;
        const panel = document.getElementById(button.dataset.picturePanel);
        if (!panel) return;
        panel.hidden = button.dataset.pictureAction !== 'show';
        if (!panel.hidden) panel.querySelector('img')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // 1. Generate QR & Barcode Button
    document.getElementById('btn-generate-both')?.addEventListener('click', () => {
        const record = getRecordFromForm();
        triggerCodeGeneration();
        renderRecordToView(record);
        showToast('Generated QR Code & Barcode updated!');
    });

    // 2. Save Record & Generate Button
    document.getElementById('btn-save-record')?.addEventListener('click', () => {
        const record = getRecordFromForm();
        saveRecordToLocalStorage(record);
        triggerCodeGeneration();
        renderRecordToView(record);
        showToast(`Record ${record.recordId} saved & QR generated!`);
        switchTab('tab-details');
    });

    // 3. Clear Form Button
    document.getElementById('btn-clear-form')?.addEventListener('click', () => {
        document.getElementById('rec-workshop').value = '';
        document.getElementById('rec-maker-code').value = '';
        document.getElementById('rec-barrier-no').value = '';
        document.getElementById('rec-vehicle-type').value = '';
        document.getElementById('rec-vin').value = '';
        document.getElementById('rec-brand').value = '';
        document.getElementById('rec-model').value = '';
        document.getElementById('rec-model-year').value = '';
        document.getElementById('rec-made-on').value = '';
        document.getElementById('rec-card-issued').value = '';
        document.getElementById('rec-id').value = generateRandomRecordId();
        [1, 2, 3].forEach(index => {
            const input = document.getElementById(index === 1 ? 'rec-picture' : `rec-picture-${index}`);
            const url = document.getElementById(index === 1 ? 'rec-picture-url' : `rec-picture-url-${index}`);
            const name = document.getElementById(index === 1 ? 'rec-picture-name' : `rec-picture-name-${index}`);
            const status = document.getElementById(index === 1 ? 'rec-picture-status' : `rec-picture-status-${index}`);
            if (input) input.value = '';
            if (url) url.value = '';
            if (name) name.value = '';
            if (status) status.textContent = 'Optional picture. Anyone with the QR code can view an uploaded image.';
        });
        showToast('Form cleared! Enter new record details.');
    });

    // Generate New Random ID Button
    document.getElementById('btn-gen-id')?.addEventListener('click', () => {
        const newId = generateRandomRecordId();
        document.getElementById('rec-id').value = newId;
        showToast('Generated new Record ID: ' + newId);
    });

    // Load Sample Data
    document.getElementById('btn-load-preset')?.addEventListener('click', () => {
        loadRecordToForm(DEFAULT_RECORD);
        renderRecordToView(DEFAULT_RECORD);
        triggerCodeGeneration();
        showToast('Loaded Hattan Fleet Registry sample data!');
    });

    // View Details Button in Preview Column
    document.getElementById('btn-view-details')?.addEventListener('click', () => {
        const rec = getRecordFromForm();
        renderRecordToView(rec);
        switchTab('tab-details');
    });

    // Keep the optional QR link label visibly disabled until the user turns it on.
    const badgeToggle = document.getElementById('check-enable-badge');
    badgeToggle?.addEventListener('change', () => {
        syncBadgeSettings();
        triggerCodeGeneration();
    });
    syncBadgeSettings();

    // Download PNG
    document.getElementById('btn-download-png')?.addEventListener('click', () => {
        downloadQRPNG();
    });

    // Copy Link
    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
        const record = getRecordFromForm();
        const recUrl = encodeRecordToUrl(record);
        navigator.clipboard.writeText(recUrl).then(() => {
            showToast('Shareable Record URL copied to clipboard!');
        });
    });

    document.getElementById('btn-share-details')?.addEventListener('click', () => {
        const record = getRecordFromForm();
        const recUrl = encodeRecordToUrl(record);
        navigator.clipboard.writeText(recUrl).then(() => {
            showToast('Record URL copied to clipboard!');
        });
    });

    // Lookup Button in Scan/Lookup Tab
    document.getElementById('btn-do-lookup')?.addEventListener('click', doRecordLookup);
    document.getElementById('input-lookup-id')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') doRecordLookup();
    });

    // Saved Records Search Filter
    document.getElementById('input-search-saved')?.addEventListener('input', (e) => {
        renderSavedRecordsTable(e.target.value.toLowerCase().trim());
    });

    // Clear Saved Records
    document.getElementById('btn-clear-saved')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved records?')) {
            savedRecordsList = [];
            localStorage.removeItem('cognetify_saved_records');
            renderSavedRecordsTable();
            updateSavedCountBadge();
            showToast('Cleared all saved records!');
        }
    });

    // Scanner Buttons
    document.getElementById('btn-start-scanner')?.addEventListener('click', startCameraScanner);
    document.getElementById('input-qr-file')?.addEventListener('change', scanQrFromFile);

    ['card-vin', 'card-maker', 'card-maker-code', 'card-country', 'card-manufacture-date', 'card-issue-date', 'card-model', 'card-brand', 'card-year', 'card-upd-type', 'card-barrier', 'card-technical'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', renderBarrierCard);
        document.getElementById(id)?.addEventListener('change', renderBarrierCard);
    });
    document.getElementById('btn-download-card-pdf')?.addEventListener('click', downloadBarrierCardPdf);
    document.getElementById('btn-download-mobile-pdf')?.addEventListener('click', downloadMobileBarrierCardPdf);
}

async function handleRecordPictureUpload(event) {
    const file = event.target.files?.[0];
    const pictureIndex = Number(event.currentTarget.dataset.pictureIndex || 1);
    const statusId = pictureIndex === 1 ? 'rec-picture-status' : `rec-picture-status-${pictureIndex}`;
    const urlId = pictureIndex === 1 ? 'rec-picture-url' : `rec-picture-url-${pictureIndex}`;
    const nameId = pictureIndex === 1 ? 'rec-picture-name' : `rec-picture-name-${pictureIndex}`;
    const status = document.getElementById(statusId);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        if (status) status.textContent = 'Choose an image file (JPG, PNG, or WebP).';
        event.target.value = '';
        return;
    }
    if (file.size > 15 * 1024 * 1024) {
        if (status) status.textContent = 'Image is too large. Please choose a file under 15 MB.';
        event.target.value = '';
        return;
    }
    if (status) status.textContent = 'Preparing and uploading picture…';

    const objectUrl = URL.createObjectURL(file);
    try {
        const image = await new Promise((resolve, reject) => {
            const loadedImage = new Image();
            loadedImage.onload = () => resolve(loadedImage);
            loadedImage.onerror = reject;
            loadedImage.src = objectUrl;
        });
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not prepare the selected image.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not prepare the selected image.')), 'image/jpeg', 0.8);
        });
        if (imageBlob.size > 4 * 1024 * 1024) throw new Error('The optimized picture is still over 4 MB. Please use a smaller image.');

        const response = await fetch('/api/record-picture', {
            method: 'POST',
            headers: { 'Content-Type': 'image/jpeg' },
            body: imageBlob
        });
        const responseBody = await response.text();
        let result = {};
        try {
            result = responseBody ? JSON.parse(responseBody) : {};
        } catch (_) {
            // Vercel's default 404/500 pages are HTML, so preserve the HTTP status for diagnosis.
        }
        if (!response.ok) {
            const errorMessage = result.error
                || (response.status === 404
                    ? 'Vercel did not find /api/record-picture. Deploy the latest project files and confirm the project root includes the api folder.'
                    : response.status >= 500
                        ? `Vercel upload function failed (HTTP ${response.status}). Check the deployment function logs and Blob store connection.`
                        : `Picture upload failed (HTTP ${response.status}).`);
            throw new Error(errorMessage);
        }
        if (!isVercelBlobPictureUrl(result.url)) throw new Error('Upload returned an invalid picture link.');

        document.getElementById(urlId).value = result.url;
        document.getElementById(nameId).value = file.name.slice(0, 120);
        const record = getRecordFromForm();
        renderRecordToView(record);
        if (activeGenType === 'qr') triggerCodeGeneration();
        else setGenType('qr');
        // Keep the card's QR preview in sync with the freshly generated main-record QR.
        renderBarrierCard();
        if (status) status.textContent = `${file.name} uploaded as picture ${pictureIndex}. The QR preview has been refreshed.`;
    } catch (error) {
        console.error('Could not upload record picture:', error);
        if (status) status.textContent = error.message || 'Could not upload this picture. Please try again.';
        event.target.value = '';
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function syncBadgeSettings() {
    const toggle = document.getElementById('check-enable-badge');
    const settings = document.getElementById('badge-settings');
    if (settings && toggle) settings.hidden = !toggle.checked;
}

function renderBarrierCard() {
    const table = document.getElementById('card-table');
    const qrTarget = document.getElementById('card-qr');
    if (!table || !qrTarget) return;
    const value = (id, fallback = '—') => document.getElementById(id)?.value.trim() || fallback;
    const cardIssueDate = value('card-issue-date', '13/10/2026');
    document.getElementById('hdr-card-date-en').textContent = cardIssueDate;
    document.getElementById('hdr-card-date-ar').textContent = cardIssueDate;
    // All values are intentionally sourced from the Barrier Card editor only.
    // This template never changes the main QR generator or its record data.
    const maker = value('card-maker');
    const makerCode = value('card-maker-code');
    const country = document.getElementById('card-country')?.value.trim() || 'Saudi Arabia';
    const manufactureDate = value('card-manufacture-date');
    const technical = value('card-technical');
    const model = value('card-model');
    const brand = value('card-brand');
    const year = value('card-year');
    const updType = value('card-upd-type');
    const vin = value('card-vin');
    const barrier = value('card-barrier');
    const vinGrid = document.getElementById('card-vin-grid');
    if (vinGrid) {
        vinGrid.innerHTML = '';
        const characters = [...vin.replace(/\s+/g, '')];
        vinGrid.style.gridTemplateColumns = `repeat(${Math.max(characters.length, 1)}, minmax(0, 1fr))`;
        characters.forEach(character => {
            const cell = document.createElement('span');
            cell.textContent = character;
            vinGrid.appendChild(cell);
        });
    }
    const rows = [
        ['Manufacturer’s Name', 'اسم المصنع/الورشة', maker],
        ['Manufacturer Assigned Code', 'رمز المنشأة', makerCode],
        ['Country of Origin', 'بلد المنشأ', country],
        ['Date of Manufacture', 'تاريخ الصنع', manufactureDate],
        ['Vehicle Model Name', 'اسم طراز المركبة', model],
        ['Vehicle Brand', 'ماركة المركبة', brand],
        ['Vehicle Model Year', 'سنة موديل المركبة', year],
        ['UPD Type (Front, Side, Rear)', 'نوع الحاجز (أمامي، جانبي، خلفي)', updType],
        ['Sample Reference', 'مرجع تجريبي', barrier],
        ['Technical References', 'المتطلبات الفنية', technical]
    ];
    table.innerHTML = '';
    rows.forEach(row => {
        const item = document.createElement('div');
        item.className = 'card-field';
        const fieldValue = document.createElement('span');
        fieldValue.className = 'card-field-value';
        fieldValue.textContent = row[2] || '—';
        const labels = document.createElement('div');
        labels.className = 'card-field-labels';
        const english = document.createElement('span');
        english.textContent = row[0];
        const arabic = document.createElement('bdi');
        arabic.dir = 'rtl';
        arabic.textContent = row[1];
        labels.append(english, arabic);
        item.append(fieldValue, labels);
        table.appendChild(item);
    });
    qrTarget.innerHTML = '';
    const mainQrCanvas = document.querySelector('#qr-canvas-container canvas');
    if (mainQrCanvas) {
        const image = new Image();
        image.src = mainQrCanvas.toDataURL('image/png');
        image.alt = 'Generated record QR code';
        qrTarget.appendChild(image);
    } else {
        // Fallback matches the main generator's record URL if the preview has not rendered yet.
        new QRCode(qrTarget, { text: encodeRecordToUrl(getRecordFromForm()), width: 180, height: 180, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    }
    renderMobileBarrierCard();
}

function renderMobileBarrierCard() {
    const documentEl = document.getElementById('barrier-card-mobile-document');
    if (!documentEl) return;
    const value = (id, fallback = '—') => document.getElementById(id)?.value.trim() || fallback;
    const cardIssueDate = value('card-issue-date', '13/10/2026');
    const fields = [
        ['Manufacturer’s Name', 'اسم المصنع/الورشة', value('card-maker')],
        ['Manufacturer Assigned Code', 'رمز المنشأة', value('card-maker-code')],
        ['Country of Origin', 'بلد المنشأ', value('card-country')],
        ['Date of Manufacture', 'تاريخ الصنع', value('card-manufacture-date')],
        ['Vehicle Model Name', 'اسم طراز المركبة', value('card-model')],
        ['Vehicle Brand', 'ماركة المركبة', value('card-brand')],
        ['Vehicle Model Year', 'سنة موديل المركبة', value('card-year')],
        ['UPD Type (Front, Side, Rear)', 'نوع الحاجز', value('card-upd-type')],
        ['Vehicle Chassis Number (VIN)', 'رقم هيكل المركبة (VIN)', value('card-vin')],
        ['Sample Reference', 'مرجع تجريبي', value('card-barrier')],
        ['Technical References', 'المتطلبات الفنية', value('card-technical')]
    ];
    documentEl.innerHTML = `
        <header><div class="card-header-saso-img" style="width:100%;overflow:hidden;max-height:90px;"><img src="assets/saso-header.png" alt="Saudi Standards - SASO" style="display:block;width:100%;height:90px;object-fit:cover;object-position:center;"></div><div class="mobile-card-meta" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 14px;background:#eaf5f6;border-top:1px solid #d3e8e9;"><div><span>Card Number</span><b>8801004743</b><span>Card Issue Date</span><b>${escapeHtml(cardIssueDate)}</b></div><div dir="rtl"><span>رقم البطاقة</span><b>8801004743</b><span>تاريخ إصدار البطاقة</span><b>${escapeHtml(cardIssueDate)}</b></div></div></header>
        <section class="card-intro"><div class="card-intro-copy"><p>Hattan Registry organizes sample fleet information in a clear, easy-to-review workspace.</p><p dir="rtl">ينظم Hattan Registry معلومات الأسطول التجريبية في مساحة واضحة وسهلة المراجعة.</p></div><div class="card-intro-brand"><img class="card-intro-logo" src="assets/uploaded-registry-symbol.jfif?v=1" alt="Hattan Registry sample mark"></div></section>
        <section class="mobile-card-maker">${fields.slice(0, 5).map(([english, arabic, content]) => `<div><b>${escapeHtml(english)}</b><span>${escapeHtml(content)}</span><em dir="rtl">${escapeHtml(arabic)}</em></div>`).join('')}</section>
        <h2>Vehicle Details · بيانات المركبة (نموذج تجريبي)</h2>
        <section>${fields.slice(5).map(([english, arabic, content]) => `<div><b>${escapeHtml(english)}</b><span>${escapeHtml(content)}</span><em dir="rtl">${escapeHtml(arabic)}</em></div>`).join('')}</section>
        <div class="mobile-card-verification"><p>This Hattan Registry sample links to its demo record. Scan the QR to view the sample details.</p><div class="mobile-card-qr" id="mobile-card-qr"></div><p dir="rtl">هذا نموذج تجريبي من Hattan Registry. امسح رمز QR لعرض بيانات النموذج.</p></div>
        <div class="mobile-card-notice">DEMO WORKSPACE · This sample is not an official certificate or government record.<br><span dir="rtl">مساحة تجريبية · هذا النموذج ليس شهادة رسمية أو سجلاً حكومياً.</span></div>
        <div class="mobile-card-footer-band"><div><strong>Hattan<span>Registry</span></strong><small>Demo workspace</small></div><div><span>Sample record</span><small>Editable vehicle details</small></div><div><span>QR-linked preview</span><small>Opens this demo record</small></div><div dir="rtl"><span>معاينة تجريبية</span><small>بيانات قابلة للتعديل</small></div></div>`;
    const target = document.getElementById('mobile-card-qr');
    const mainQrCanvas = document.querySelector('#qr-canvas-container canvas');
    if (target && mainQrCanvas) {
        const image = new Image(); image.src = mainQrCanvas.toDataURL('image/png'); image.width = 116; image.height = 116; target.appendChild(image);
    }
}

async function downloadBarrierCardPdf() {
    const card = document.getElementById('barrier-card-document');
    if (!card || !window.html2canvas || !window.jspdf) {
        showToast('PDF export library is not available. Please check your connection.');
        return;
    }
    renderBarrierCard();
    try {
        if (document.fonts) await document.fonts.ready;
        const canvas = await html2canvas(card, { backgroundColor: '#ffffff', scale: 4, useCORS: true });
        const { jsPDF } = window.jspdf;
        // A4 portrait document with print-safe margins.
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 5;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        const pdfWidth = canvas.width * scale;
        const pdfHeight = canvas.height * scale;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - pdfWidth) / 2, (pageHeight - pdfHeight) / 2, pdfWidth, pdfHeight);
        const filename = (document.getElementById('card-barrier')?.value || 'record').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
        pdf.save(`barrier-card-${filename || 'record'}.pdf`);
        showToast('Barrier card PDF downloaded.');
    } catch (error) {
        console.error('PDF export failed:', error);
        showToast('Could not create PDF. Please try again.');
    }
}

async function downloadMobileBarrierCardPdf() {
    const card = document.getElementById('barrier-card-mobile-document');
    if (!card || !window.html2canvas || !window.jspdf) {
        showToast('PDF export library is not available. Please check your connection.');
        return;
    }
    renderBarrierCard();
    try {
        if (document.fonts) await document.fonts.ready;
        const canvas = await html2canvas(card, { backgroundColor: '#ffffff', scale: 4, useCORS: true });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const maxWidth = 190;
        const maxHeight = 277;
        const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (210 - width) / 2, (297 - height) / 2, width, height);
        pdf.save('barrier-card-mobile.pdf');
        showToast('Mobile PDF downloaded.');
    } catch (error) {
        console.error('Mobile PDF export failed:', error);
        showToast('Could not create Mobile PDF. Please try again.');
    }
}

/**
 * Local Storage Operations
 */
function initSavedRecordsStorage() {
    try {
        const raw = localStorage.getItem('cognetify_saved_records');
        if (raw) {
            savedRecordsList = JSON.parse(raw);
        } else {
            // Pre-seed with DEFAULT_RECORD
            savedRecordsList = [{ ...DEFAULT_RECORD, timestamp: new Date().toISOString() }];
            localStorage.setItem('cognetify_saved_records', JSON.stringify(savedRecordsList));
        }
    } catch (e) {
        savedRecordsList = [];
    }
    updateSavedCountBadge();
}

function saveRecordToLocalStorage(record) {
    const index = savedRecordsList.findIndex(r => r.recordId === record.recordId);
    const item = { ...record, timestamp: new Date().toISOString() };
    if (index >= 0) {
        savedRecordsList[index] = item;
    } else {
        savedRecordsList.unshift(item);
    }
    localStorage.setItem('cognetify_saved_records', JSON.stringify(savedRecordsList));
    updateSavedCountBadge();
}

function deleteSavedRecord(recordId) {
    savedRecordsList = savedRecordsList.filter(r => r.recordId !== recordId);
    localStorage.setItem('cognetify_saved_records', JSON.stringify(savedRecordsList));
    renderSavedRecordsTable();
    updateSavedCountBadge();
    showToast(`Deleted record ${recordId}`);
}

function updateSavedCountBadge() {
    const badge = document.getElementById('saved-count-badge');
    if (badge) badge.textContent = savedRecordsList.length;
}

/**
 * Render Saved Records Table
 */
function renderSavedRecordsTable(query = '') {
    const tbody = document.getElementById('saved-records-tbody');
    const emptyState = document.getElementById('saved-empty-state');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filtered = savedRecordsList.filter(r => {
        if (!query) return true;
        return (r.recordId && r.recordId.toLowerCase().includes(query)) ||
               (r.vin && r.vin.toLowerCase().includes(query)) ||
               (r.brand && r.brand.toLowerCase().includes(query)) ||
               (r.workshop && r.workshop.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach(rec => {
        const tr = document.createElement('tr');
        const addCell = (value, className = '') => {
            const cell = document.createElement('td');
            cell.className = className;
            cell.textContent = value || '—';
            tr.appendChild(cell);
            return cell;
        };
        const recordIdCell = addCell(rec.recordId, 'font-mono');
        recordIdCell.style.fontWeight = '700';
        recordIdCell.style.color = '#08766c';
        addCell(rec.workshop);
        addCell(rec.vehicleType);
        addCell(rec.vin, 'font-mono');
        addCell([rec.brand, rec.model].filter(Boolean).join(' '));
        addCell(rec.cardIssued || rec.madeOn);

        const actionsCell = document.createElement('td');
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';
        const viewButton = document.createElement('button');
        viewButton.className = 'btn btn-primary btn-sm';
        viewButton.title = 'View and generate QR';
        viewButton.innerHTML = '<i class="fa-solid fa-eye"></i> View';
        viewButton.addEventListener('click', () => loadAndOpenRecord(rec.recordId));
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger-outline btn-sm';
        deleteButton.title = 'Delete record';
        deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteButton.addEventListener('click', () => deleteSavedRecord(rec.recordId));
        actions.append(viewButton, deleteButton);
        actionsCell.appendChild(actions);
        tr.appendChild(actionsCell);
        tbody.appendChild(tr);
    });
}

function loadAndOpenRecord(recordId) {
    const rec = savedRecordsList.find(r => r.recordId === recordId);
    if (rec) {
        loadRecordToForm(rec);
        renderRecordToView(rec);
        triggerCodeGeneration();
        switchTab('tab-details');
        showToast(`Loaded record ${recordId}`);
    }
}

/**
 * Record Lookup in Scan/Lookup Tab
 */
function doRecordLookup() {
    const searchVal = document.getElementById('input-lookup-id')?.value.trim().toLowerCase();
    if (!searchVal) {
        showToast('Please enter a Record ID or VIN');
        return;
    }

    const match = savedRecordsList.find(r => 
        (r.recordId && r.recordId.toLowerCase() === searchVal) ||
        (r.vin && r.vin.toLowerCase().includes(searchVal)) ||
        (r.barrierNo && r.barrierNo.toLowerCase().includes(searchVal))
    );

    if (match) {
        loadRecordToForm(match);
        renderRecordToView(match);
        triggerCodeGeneration();
        switchTab('tab-details');
        showToast(`Found matching record: ${match.recordId}`);
    } else {
        showToast(`No record found matching "${searchVal}"`);
    }
}

/**
 * Camera Scanner & File Upload
 */
function startCameraScanner() {
    const placeholder = document.getElementById('scanner-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    html5QrCodeScanner = new Html5Qrcode("reader");
    html5QrCodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            handleScanSuccess(decodedText);
            html5QrCodeScanner.stop();
        },
        () => {}
    ).catch(err => {
        showToast('Camera permission denied or camera unavailable.');
        if (placeholder) placeholder.style.display = 'block';
    });
}

function scanQrFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            handleScanSuccess(decodedText);
        })
        .catch(err => {
            showToast('No valid QR code detected in uploaded file.');
        });
}

function handleScanSuccess(text) {
    const resultBox = document.getElementById('scan-result-card');
    const resultText = document.getElementById('scan-result-text');
    const openBtn = document.getElementById('btn-open-scanned');

    if (resultText) resultText.textContent = text;
    if (resultBox) resultBox.style.display = 'block';

    if (openBtn) {
        openBtn.onclick = () => {
            if (text.includes('rec=')) {
                window.location.href = text;
                initUrlState();
            } else {
                showToast('Scanned text: ' + text);
                window.open(text, '_blank');
            }
        };
    }

    showToast('QR Code Scanned Successfully!');
}
