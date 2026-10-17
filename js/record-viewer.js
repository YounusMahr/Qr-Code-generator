/**
 * Record Viewer Module - SASO Barrier Unique ID Card Edition
 * Exact replication of the Saudi Standards (SASO) Government Verification Interface
 */

const DEFAULT_RECORD = {
    recordId: "8801005508",
    workshop: "almahawir walmaqturat Factory For Manufacturing",
    address: "Building 5187, Al Mariad 6, Al Maarid Dist.,\nKHAMIS MUSHAYT, 62451, Saudi Arabia",
    applicantType: "Factory",
    status: "Valid",
    cardIssued: "14/10/2026",
    brand: "VOLVO/VOLVO",
    vehicleType: "Front Barrier, Side Barrier, Rear Barrier",
    model: "رأس",
    modelYear: "2022",
    vin: "YV2RTY0A6NA898438",
    madeOn: "2026-10-14",
    serialNumber: "5144",
    barrierNo: "KSAS/RMMM265144",
    makerCode: "E13",
    pictureUrl: "assets/barrier-sample.jpg",
    pictureName: "b7bb2372ebf34c32bbdb.jpg",
    picture2Url: "",
    picture2Name: "",
    picture3Url: "assets/barrier-sample.jpg",
    picture3Name: "b7bb2372ebf34c32bbdb.jpg"
};

let currentRecordState = { ...DEFAULT_RECORD };

/**
 * Check if a picture URL is valid (Vercel Blob, local blob, data URL, or local asset)
 */
function isVercelBlobPictureUrl(value) {
    if (!value) return false;
    try {
        const url = new URL(value, window.location.origin);
        return url.hostname.endsWith('.public.blob.vercel-storage.com') ||
               url.protocol === 'blob:' ||
               url.protocol === 'data:' ||
               url.pathname.includes('assets/');
    } catch (_) {
        return typeof value === 'string' && (value.startsWith('data:') || value.startsWith('blob:') || value.includes('assets/'));
    }
}
window.isVercelBlobPictureUrl = isVercelBlobPictureUrl;

/**
 * Format date string to DD/MM/YYYY or YYYY-MM-DD
 */
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '14/10/2026';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

/**
 * Generate a random 10-digit SASO Card Number (like 8801005508)
 */
function generateRandomRecordId() {
    return '880' + Math.floor(1000000 + Math.random() * 9000000).toString();
}

/**
 * Get record data from the builder form inputs
 */
function getRecordFromForm() {
    const madeOnRaw = document.getElementById('rec-made-on')?.value || '2026-10-14';
    const cardIssuedRaw = document.getElementById('rec-card-issued')?.value || '2026-10-14';

    return {
        recordId: document.getElementById('rec-id')?.value.trim() || DEFAULT_RECORD.recordId,
        workshop: document.getElementById('rec-workshop')?.value.trim() || DEFAULT_RECORD.workshop,
        address: document.getElementById('rec-address')?.value.trim() || DEFAULT_RECORD.address,
        applicantType: document.getElementById('rec-applicant-type')?.value.trim() || DEFAULT_RECORD.applicantType,
        status: document.getElementById('rec-status')?.value.trim() || DEFAULT_RECORD.status,
        cardIssued: formatDateForDisplay(cardIssuedRaw),
        brand: document.getElementById('rec-brand')?.value.trim() || DEFAULT_RECORD.brand,
        vehicleType: document.getElementById('rec-vehicle-type')?.value.trim() || DEFAULT_RECORD.vehicleType,
        model: document.getElementById('rec-model')?.value.trim() || DEFAULT_RECORD.model,
        modelYear: document.getElementById('rec-model-year')?.value.trim() || DEFAULT_RECORD.modelYear,
        vin: document.getElementById('rec-vin')?.value.trim() || DEFAULT_RECORD.vin,
        madeOn: madeOnRaw, // Image has 2026-10-14
        serialNumber: document.getElementById('rec-serial-no')?.value.trim() || DEFAULT_RECORD.serialNumber,
        barrierNo: document.getElementById('rec-barrier-no')?.value.trim() || DEFAULT_RECORD.barrierNo,
        makerCode: document.getElementById('rec-maker-code')?.value.trim() || DEFAULT_RECORD.makerCode,
        pictureUrl: document.getElementById('rec-picture-url')?.value.trim() || DEFAULT_RECORD.pictureUrl,
        pictureName: document.getElementById('rec-picture-name')?.value.trim() || DEFAULT_RECORD.pictureName,
        picture2Url: document.getElementById('rec-picture-url-2')?.value.trim() || '',
        picture2Name: document.getElementById('rec-picture-name-2')?.value.trim() || '',
        picture3Url: document.getElementById('rec-picture-url-3')?.value.trim() || DEFAULT_RECORD.picture3Url,
        picture3Name: document.getElementById('rec-picture-name-3')?.value.trim() || DEFAULT_RECORD.picture3Name
    };
}

/**
 * Populate form inputs with record data
 */
function loadRecordToForm(data) {
    if (!data) return;
    if (document.getElementById('rec-id')) document.getElementById('rec-id').value = data.recordId || generateRandomRecordId();
    if (document.getElementById('rec-workshop')) document.getElementById('rec-workshop').value = data.workshop || '';
    if (document.getElementById('rec-address')) document.getElementById('rec-address').value = data.address || DEFAULT_RECORD.address;
    if (document.getElementById('rec-applicant-type')) document.getElementById('rec-applicant-type').value = data.applicantType || 'Factory';
    if (document.getElementById('rec-status')) document.getElementById('rec-status').value = data.status || 'Valid';
    if (document.getElementById('rec-brand')) document.getElementById('rec-brand').value = data.brand || '';
    if (document.getElementById('rec-vehicle-type')) document.getElementById('rec-vehicle-type').value = data.vehicleType || '';
    if (document.getElementById('rec-model')) document.getElementById('rec-model').value = data.model || '';
    if (document.getElementById('rec-model-year')) document.getElementById('rec-model-year').value = data.modelYear || '';
    if (document.getElementById('rec-vin')) document.getElementById('rec-vin').value = data.vin || '';
    if (document.getElementById('rec-serial-no')) document.getElementById('rec-serial-no').value = data.serialNumber || '5144';
    if (document.getElementById('rec-barrier-no')) document.getElementById('rec-barrier-no').value = data.barrierNo || '';
    if (document.getElementById('rec-maker-code')) document.getElementById('rec-maker-code').value = data.makerCode || '';

    // Convert DD/MM/YYYY to YYYY-MM-DD for date inputs if needed
    const convertToIso = (dStr) => {
        if (!dStr) return '2026-10-14';
        if (dStr.includes('/')) {
            const p = dStr.split('/');
            if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
        }
        return dStr;
    };

    if (document.getElementById('rec-made-on')) document.getElementById('rec-made-on').value = convertToIso(data.madeOn);
    if (document.getElementById('rec-card-issued')) document.getElementById('rec-card-issued').value = convertToIso(data.cardIssued);

    if (document.getElementById('rec-picture-url')) document.getElementById('rec-picture-url').value = data.pictureUrl || '';
    if (document.getElementById('rec-picture-name')) document.getElementById('rec-picture-name').value = data.pictureName || DEFAULT_RECORD.pictureName;
    if (document.getElementById('rec-picture-url-2')) document.getElementById('rec-picture-url-2').value = data.picture2Url || '';
    if (document.getElementById('rec-picture-name-2')) document.getElementById('rec-picture-name-2').value = data.picture2Name || '';
    if (document.getElementById('rec-picture-url-3')) document.getElementById('rec-picture-url-3').value = data.picture3Url || '';
    if (document.getElementById('rec-picture-name-3')) document.getElementById('rec-picture-name-3').value = data.picture3Name || DEFAULT_RECORD.picture3Name;
}

/**
 * Update the SASO Barrier Unique ID Card view component with current record
 */
function renderRecordToView(data = currentRecordState) {
    currentRecordState = { ...data };

    // Section 1: Unique ID & Company Info
    const viewRecordId = document.getElementById('view-record-id');
    const viewWorkshop = document.getElementById('view-workshop');
    const viewAddress = document.getElementById('view-address');
    const viewApplicantType = document.getElementById('view-applicant-type');
    const viewCardIssued = document.getElementById('view-card-issued');
    const viewStatus = document.getElementById('view-status');

    if (viewRecordId) viewRecordId.textContent = data.recordId || DEFAULT_RECORD.recordId;
    if (viewWorkshop) viewWorkshop.textContent = data.workshop || DEFAULT_RECORD.workshop;
    if (viewAddress) {
        const addr = data.address || DEFAULT_RECORD.address;
        viewAddress.innerHTML = addr.replace(/\n/g, '<br>');
    }
    if (viewApplicantType) viewApplicantType.textContent = data.applicantType || 'Factory';
    if (viewCardIssued) viewCardIssued.textContent = data.cardIssued || '14/10/2026';
    if (viewStatus) {
        viewStatus.textContent = data.status || 'Valid';
        if ((data.status || 'Valid').toLowerCase().includes('valid')) {
            viewStatus.className = 'saso-status-badge valid';
        } else {
            viewStatus.className = 'saso-status-badge expired';
        }
    }

    // Section 2: Card Data
    const viewBrand = document.getElementById('view-brand');
    const viewVehicleType = document.getElementById('view-vehicle-type');
    const viewModelYear = document.getElementById('view-model-year');
    const viewVin = document.getElementById('view-vin');
    const viewMadeOn = document.getElementById('view-made-on');
    const viewSerialNo = document.getElementById('view-serial-no');
    const viewBarrierNo = document.getElementById('view-barrier-no');

    if (viewBrand) viewBrand.textContent = data.brand || DEFAULT_RECORD.brand;
    if (viewVehicleType) viewVehicleType.textContent = data.vehicleType || DEFAULT_RECORD.vehicleType;
    if (viewModelYear) viewModelYear.textContent = data.modelYear || DEFAULT_RECORD.modelYear;
    if (viewVin) viewVin.textContent = data.vin || DEFAULT_RECORD.vin;
    if (viewMadeOn) viewMadeOn.textContent = data.madeOn || '2026-10-14';
    if (viewSerialNo) viewSerialNo.textContent = data.serialNumber || '5144';
    if (viewBarrierNo) viewBarrierNo.textContent = data.barrierNo || DEFAULT_RECORD.barrierNo;

    // Picture rows
    renderPictureRows(data);
}

function renderPictureRows(data) {
    const sideNameEl = document.getElementById('view-side-picture-name');
    const rearNameEl = document.getElementById('view-rear-picture-name');
    const frontNameEl = document.getElementById('view-front-picture-name');
    const frontGroup = document.getElementById('view-front-picture-group');

    const sideFileName = data.pictureName || DEFAULT_RECORD.pictureName;
    const rearFileName = data.picture3Name || DEFAULT_RECORD.picture3Name;
    const frontFileName = data.picture2Name || '';

    if (sideNameEl) sideNameEl.textContent = sideFileName;
    if (rearNameEl) rearNameEl.textContent = rearFileName;

    if (frontGroup && frontNameEl) {
        if (frontFileName || data.picture2Url) {
            frontGroup.style.display = 'flex';
            frontNameEl.textContent = frontFileName || 'front_barrier.jpg';
        } else {
            frontGroup.style.display = 'none';
        }
    }

    // Attach click handlers to open picture modal
    const sideBtn = document.getElementById('view-side-picture-btn');
    if (sideBtn) {
        sideBtn.onclick = () => openPictureModal(
            'Side Barrier Picture',
            data.pictureUrl || 'assets/barrier-sample.jpg',
            sideFileName
        );
    }

    const rearBtn = document.getElementById('view-rear-picture-btn');
    if (rearBtn) {
        rearBtn.onclick = () => openPictureModal(
            'Rear Barrier Picture',
            data.picture3Url || 'assets/barrier-sample.jpg',
            rearFileName
        );
    }

    const frontBtn = document.getElementById('view-front-picture-btn');
    if (frontBtn) {
        frontBtn.onclick = () => openPictureModal(
            'Front Barrier Picture',
            data.picture2Url || 'assets/barrier-sample.jpg',
            frontFileName || 'front_barrier.jpg'
        );
    }
}

function openPictureModal(title, url, filename) {
    const modal = document.getElementById('saso-picture-modal');
    const modalTitle = document.getElementById('saso-modal-title');
    const modalImg = document.getElementById('saso-modal-img');
    if (!modal) return;

    if (modalTitle) modalTitle.textContent = `${title} (${filename})`;
    if (modalImg) {
        modalImg.src = url || 'assets/barrier-sample.jpg';
        modalImg.alt = title;
    }
    modal.hidden = false;
    modal.classList.add('active');
}

function closePictureModal() {
    const modal = document.getElementById('saso-picture-modal');
    if (modal) {
        modal.hidden = true;
        modal.classList.remove('active');
    }
}

// Modal closing setup
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('saso-modal-close-btn')?.addEventListener('click', closePictureModal);
    document.querySelector('.saso-modal-backdrop')?.addEventListener('click', closePictureModal);
    document.getElementById('saso-btn-back')?.addEventListener('click', () => {
        if (document.body.classList.contains('shared-record-mode')) {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            switchTab('tab-create');
        }
    });
});

/**
 * Encode current record data into URL Hash or Search Param
 */
function encodeRecordToUrl(record = currentRecordState) {
    const compactRecord = [
        record.workshop || '',
        record.makerCode || '',
        record.barrierNo || '',
        record.vehicleType || '',
        record.vin || '',
        record.brand || '',
        record.model || '',
        record.modelYear || '',
        record.madeOn || '',
        record.cardIssued || '',
        record.recordId || '',
        record.pictureUrl || '',
        record.pictureName || '',
        record.picture2Url || '',
        record.picture2Name || '',
        record.picture3Url || '',
        record.picture3Name || '',
        record.serialNumber || '',
        record.applicantType || '',
        record.address || '',
        record.status || ''
    ];

    const bytes = new TextEncoder().encode(JSON.stringify(compactRecord));
    const b64 = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
                const [
                    workshop = DEFAULT_RECORD.workshop,
                    makerCode = DEFAULT_RECORD.makerCode,
                    barrierNo = DEFAULT_RECORD.barrierNo,
                    vehicleType = DEFAULT_RECORD.vehicleType,
                    vin = DEFAULT_RECORD.vin,
                    brand = DEFAULT_RECORD.brand,
                    model = DEFAULT_RECORD.model,
                    modelYear = DEFAULT_RECORD.modelYear,
                    madeOn = DEFAULT_RECORD.madeOn,
                    cardIssued = DEFAULT_RECORD.cardIssued,
                    recordId = DEFAULT_RECORD.recordId,
                    pictureUrl = DEFAULT_RECORD.pictureUrl,
                    pictureName = DEFAULT_RECORD.pictureName,
                    picture2Url = '',
                    picture2Name = '',
                    picture3Url = DEFAULT_RECORD.picture3Url,
                    picture3Name = DEFAULT_RECORD.picture3Name,
                    serialNumber = DEFAULT_RECORD.serialNumber,
                    applicantType = DEFAULT_RECORD.applicantType,
                    address = DEFAULT_RECORD.address,
                    status = DEFAULT_RECORD.status
                ] = parsed;

                return {
                    workshop, makerCode, barrierNo, vehicleType, vin, brand, model,
                    modelYear, madeOn, cardIssued, recordId, pictureUrl, pictureName,
                    picture2Url, picture2Name, picture3Url, picture3Name,
                    serialNumber, applicantType, address, status
                };
            }
            return parsed;
        }
    } catch (e) {
        try {
            const legacyParam = new URLSearchParams(window.location.search).get('rec');
            return JSON.parse(decodeURIComponent(atob(legacyParam)));
        } catch (_) {
            console.warn('Could not parse record from URL:', e);
        }
    }
    return null;
}
