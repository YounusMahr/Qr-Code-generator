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
        const enableBadge = document.getElementById('check-enable-badge')?.checked !== false;
        const badgeText = getQrLinkLabel(content);
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
    // 1. Generate QR & Barcode Button
    document.getElementById('btn-generate-both')?.addEventListener('click', () => {
        const record = getRecordFromForm();
        renderRecordToView(record);
        triggerCodeGeneration();
        showToast('Generated QR Code & Barcode updated!');
    });

    // 2. Save Record & Generate Button
    document.getElementById('btn-save-record')?.addEventListener('click', () => {
        const record = getRecordFromForm();
        saveRecordToLocalStorage(record);
        renderRecordToView(record);
        triggerCodeGeneration();
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
        const recUrl = encodeRecordToUrl(getRecordFromForm());
        navigator.clipboard.writeText(recUrl).then(() => {
            showToast('Shareable Record URL copied to clipboard!');
        });
    });

    document.getElementById('btn-share-details')?.addEventListener('click', () => {
        const recUrl = encodeRecordToUrl(getRecordFromForm());
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

    ['card-maker', 'card-maker-code', 'card-country', 'card-manufacture-date', 'card-technical', 'card-model', 'card-brand', 'card-year', 'card-upd-type', 'card-vin', 'card-barrier', 'card-issue-date'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', renderBarrierCard);
        document.getElementById(id)?.addEventListener('change', renderBarrierCard);
    });
    document.getElementById('btn-download-card-pdf')?.addEventListener('click', downloadBarrierCardPdf);
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
    const issueDate = value('card-issue-date');
    const rows = [
        ['Manufacturer’s Name', 'اسم المصنع/الورشة', maker],
        ['Manufacturer Assigned Code', 'رمز المنشأة', makerCode],
        ['Country of Origin', 'بلد المنشأ', country],
        ['Date of Manufacture', 'تاريخ الصنع', manufactureDate],
        ['Technical References', 'المتطلبات الفنية', technical],
        ['section', 'Vehicle (Truck/trailer) Information - بيانات المركبة'],
        ['Vehicle Model Name', 'اسم طراز المركبة', model],
        ['Vehicle Brand', 'ماركة المركبة', brand],
        ['Vehicle Model Year', 'سنة موديل المركبة', year],
        ['UPD Type (Front, Side, Rear)', 'نوع الحاجز (أمامي، جانبي، خلفي)', updType],
        ['Vehicle Chassis Number (VIN)', 'رقم هيكل المركبة (VIN)', vin],
        ['Distinguished Under-Run Number', 'الرقم المميز للحاجز', barrier],
        ['Card’s issue date', 'تاريخ إصدار البطاقة', issueDate]
    ];
    table.innerHTML = '';
    rows.forEach(row => {
        if (row[0] === 'section') {
            const section = document.createElement('div');
            section.className = 'card-table-section';
            section.textContent = row[1];
            table.appendChild(section);
            return;
        }
        const item = document.createElement('div');
        item.className = row[0] === 'Distinguished Under-Run Number' ? 'card-table-row card-barrier-row' : 'card-table-row';
        const left = document.createElement('b'); left.textContent = `${row[0]}:`;
        const value = document.createElement('span'); value.className = 'card-table-value'; value.textContent = row[2] || '—';
        const right = document.createElement('b'); right.dir = 'rtl'; right.textContent = row[1];
        item.append(left, value, right);
        table.appendChild(item);
    });
    qrTarget.innerHTML = '';
    const mainQrCanvas = document.querySelector('#qr-canvas-container canvas');
    if (mainQrCanvas) {
        const image = new Image();
        image.src = mainQrCanvas.toDataURL('image/png');
        image.width = 86;
        image.height = 86;
        image.alt = 'Generated record QR code';
        qrTarget.appendChild(image);
    } else {
        // Fallback matches the main generator's record URL if the preview has not rendered yet.
        new QRCode(qrTarget, { text: encodeRecordToUrl(getRecordFromForm()), width: 86, height: 86, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
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
        const canvas = await html2canvas(card, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const maxWidth = 283;
        const maxHeight = 196;
        const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
        const pdfWidth = canvas.width * scale;
        const pdfHeight = canvas.height * scale;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (297 - pdfWidth) / 2, (210 - pdfHeight) / 2, pdfWidth, pdfHeight);
        const filename = (document.getElementById('card-barrier')?.value || 'record').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
        pdf.save(`barrier-card-${filename || 'record'}.pdf`);
        showToast('Barrier card PDF downloaded.');
    } catch (error) {
        console.error('PDF export failed:', error);
        showToast('Could not create PDF. Please try again.');
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
