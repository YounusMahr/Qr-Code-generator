/**
 * Record Viewer Module - DEMO BUILD 3.0
 * Replication logic for Image 1: Hattan Fleet Registry
 */

const DEFAULT_RECORD = {
    workshop: "مصنع مقطورات السحب",
    makerCode: "E12",
    barrierNo: "KSA  E12  S/R/F  RRR  297615",
    vehicleType: "شاحنة",
    vin: "RS3NHMAJ6P0735625",
    brand: "MERCEDES",
    model: "خلاطه  /  RRR",
    modelYear: "2023",
    madeOn: "14/09/2026",
    cardIssued: "14/09/2026",
    recordId: "FH3VnKa9"
};

let currentRecordState = { ...DEFAULT_RECORD };

/**
 * Format YYYY-MM-DD date string to DD/MM/YYYY
 */
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '14/09/2026';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

/**
 * Generate a random alphanumeric Record ID (like FH3VnKa9)
 */
function generateRandomRecordId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Get record data from the builder form inputs
 */
function getRecordFromForm() {
    const madeOnRaw = document.getElementById('rec-made-on')?.value || '2026-09-14';
    const cardIssuedRaw = document.getElementById('rec-card-issued')?.value || '2026-09-14';

    return {
        workshop: document.getElementById('rec-workshop')?.value.trim() || DEFAULT_RECORD.workshop,
        makerCode: document.getElementById('rec-maker-code')?.value.trim() || DEFAULT_RECORD.makerCode,
        barrierNo: document.getElementById('rec-barrier-no')?.value.trim() || DEFAULT_RECORD.barrierNo,
        vehicleType: document.getElementById('rec-vehicle-type')?.value.trim() || DEFAULT_RECORD.vehicleType,
        vin: document.getElementById('rec-vin')?.value.trim() || DEFAULT_RECORD.vin,
        brand: document.getElementById('rec-brand')?.value.trim() || DEFAULT_RECORD.brand,
        model: document.getElementById('rec-model')?.value.trim() || DEFAULT_RECORD.model,
        modelYear: document.getElementById('rec-model-year')?.value.trim() || DEFAULT_RECORD.modelYear,
        madeOn: formatDateForDisplay(madeOnRaw),
        cardIssued: formatDateForDisplay(cardIssuedRaw),
        recordId: document.getElementById('rec-id')?.value.trim() || DEFAULT_RECORD.recordId
    };
}

/**
 * Populate form inputs with record data
 */
function loadRecordToForm(data) {
    if (!data) return;
    if (document.getElementById('rec-workshop')) document.getElementById('rec-workshop').value = data.workshop || '';
    if (document.getElementById('rec-maker-code')) document.getElementById('rec-maker-code').value = data.makerCode || '';
    if (document.getElementById('rec-barrier-no')) document.getElementById('rec-barrier-no').value = data.barrierNo || '';
    if (document.getElementById('rec-vehicle-type')) document.getElementById('rec-vehicle-type').value = data.vehicleType || '';
    if (document.getElementById('rec-vin')) document.getElementById('rec-vin').value = data.vin || '';
    if (document.getElementById('rec-brand')) document.getElementById('rec-brand').value = data.brand || '';
    if (document.getElementById('rec-model')) document.getElementById('rec-model').value = data.model || '';
    if (document.getElementById('rec-model-year')) document.getElementById('rec-model-year').value = data.modelYear || '';
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for date inputs if needed
    const convertToIso = (dStr) => {
        if (!dStr) return '2026-09-14';
        if (dStr.includes('/')) {
            const p = dStr.split('/');
            if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
        }
        return dStr;
    };

    if (document.getElementById('rec-made-on')) document.getElementById('rec-made-on').value = convertToIso(data.madeOn);
    if (document.getElementById('rec-card-issued')) document.getElementById('rec-card-issued').value = convertToIso(data.cardIssued);
    if (document.getElementById('rec-id')) document.getElementById('rec-id').value = data.recordId || generateRandomRecordId();
}

/**
 * Update the Image 1 View component with the given record data
 */
function renderRecordToView(data = currentRecordState) {
    currentRecordState = { ...data };
    
    // Target text elements in Image 1 view
    const viewWorkshop = document.getElementById('view-workshop');
    const viewMakerCode = document.getElementById('view-maker-code');
    const viewBarrierNo = document.getElementById('view-barrier-no');
    const viewVehicleType = document.getElementById('view-vehicle-type');
    const viewVin = document.getElementById('view-vin');
    const viewBrand = document.getElementById('view-brand');
    const viewModel = document.getElementById('view-model');
    const viewModelYear = document.getElementById('view-model-year');
    const viewMadeOn = document.getElementById('view-made-on');
    const viewCardIssued = document.getElementById('view-card-issued');
    const viewRecordId = document.getElementById('view-record-id');

    if (viewWorkshop) viewWorkshop.textContent = data.workshop;
    if (viewMakerCode) viewMakerCode.textContent = data.makerCode;
    if (viewBarrierNo) viewBarrierNo.textContent = data.barrierNo;
    if (viewVehicleType) viewVehicleType.textContent = data.vehicleType;
    if (viewVin) viewVin.textContent = data.vin;
    if (viewBrand) viewBrand.textContent = data.brand;
    if (viewModel) viewModel.textContent = data.model;
    if (viewModelYear) viewModelYear.textContent = data.modelYear;
    if (viewMadeOn) viewMadeOn.textContent = data.madeOn;
    if (viewCardIssued) viewCardIssued.textContent = data.cardIssued;
    if (viewRecordId) viewRecordId.textContent = data.recordId;
}

/**
 * Encode current record data into URL Hash or Search Param
 */
function encodeRecordToUrl(record = currentRecordState) {
    // Compact field order keeps the QR modules large enough for reliable phone scans.
    const compactRecord = [
        record.workshop, record.makerCode, record.barrierNo, record.vehicleType,
        record.vin, record.brand, record.model, record.modelYear,
        record.madeOn, record.cardIssued, record.recordId
    ];
    const bytes = new TextEncoder().encode(JSON.stringify(compactRecord));
    const b64 = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // `origin` is "null" when index.html is opened directly from disk.
    // Keep that local URL valid, while hosted versions remain shareable across devices.
    const baseUrl = window.location.protocol === 'file:'
        ? window.location.href.split('?')[0].split('#')[0]
        : window.location.origin + window.location.pathname;
    return `${baseUrl}?rec=${b64}`;
}

/**
 * Decode record data from current URL if query params exist
 */
function decodeRecordFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const recParam = urlParams.get('rec');
        if (recParam) {
            const normalised = recParam.replace(/-/g, '+').replace(/_/g, '/');
            const padded = normalised + '='.repeat((4 - normalised.length % 4) % 4);
            const binary = atob(padded);
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            const parsed = JSON.parse(new TextDecoder().decode(bytes));
            if (Array.isArray(parsed)) {
                const [workshop, makerCode, barrierNo, vehicleType, vin, brand, model, modelYear, madeOn, cardIssued, recordId] = parsed;
                return { workshop, makerCode, barrierNo, vehicleType, vin, brand, model, modelYear, madeOn, cardIssued, recordId };
            }
            return parsed;
        }
    } catch (e) {
        // Support links generated by versions before compact URL encoding.
        try {
            const legacyParam = new URLSearchParams(window.location.search).get('rec');
            return JSON.parse(decodeURIComponent(atob(legacyParam)));
        } catch (_) {
            console.warn('Could not parse record from URL:', e);
        }
    }
    return null;
}
