/**
 * QR Code Generator Module
 * Renders high-quality QR codes with an optional branded centre label
 */

let qrCodeInstance = null;

function renderCustomQRCode(options = {}) {
    const container = document.getElementById('qr-canvas-container');
    const frameWrapper = document.getElementById('qr-frame-wrapper');
    if (!container) return;

    // Options extraction
    const content = options.content || window.location.href;
    const darkColor = options.darkColor || '#000000';
    const lightColor = options.lightColor || '#ffffff';
    const enableFrame = options.enableFrame === true;
    const enableBadge = options.enableBadge !== false;
    const badgeText = options.badgeText || 'RECORD LINK';
    const badgeIcon = options.badgeIcon || 'fa-globe';

    // Clear previous elements
    container.innerHTML = '';

    // Apply or remove outer frame styling (Image 2 style)
    if (frameWrapper) {
        if (enableFrame) {
            frameWrapper.classList.add('framed');
            frameWrapper.classList.remove('simple');
        } else {
            frameWrapper.classList.remove('framed');
            frameWrapper.classList.add('simple');
        }
    }

    // Create temporary inner div for QRCode library
    const qrDiv = document.createElement('div');
    container.appendChild(qrDiv);

    // Instantiate QRCode.js
    qrCodeInstance = new QRCode(qrDiv, {
        text: content,
        width: 250,
        height: 250,
        colorDark: darkColor,
        colorLight: lightColor,
        correctLevel: QRCode.CorrectLevel.Q // Canonical QR used in both generator and PDF card
    });

    // Wait for canvas to draw then attach overlay badge pill if enabled
    setTimeout(() => {
        // Look for generated canvas or img
        const canvas = qrDiv.querySelector('canvas');
        if (canvas) {
            // Preserve the classic sharp, black-and-white QR appearance.
            canvas.style.borderRadius = '0';

            if (enableBadge) {
                // Attach link label
                const badgeOverlay = document.createElement('div');
                badgeOverlay.className = 'qr-badge-pill-overlay';
                badgeOverlay.id = 'qr-center-badge';

                let iconHtml = '🌐';
                if (badgeIcon === 'fa-shield-halved') iconHtml = '🛡️';
                if (badgeIcon === 'fa-truck') iconHtml = '🚚';
                if (badgeIcon === 'fa-check-double') iconHtml = '✅';

                badgeOverlay.innerHTML = `
                    <div class="globe-icon">${iconHtml}</div>
                    <span>${escapeHtml(badgeText)}</span>
                `;

                container.appendChild(badgeOverlay);
            }
        }
    }, 50);
}

/**
 * Utility HTML escaper
 */
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Export current QR canvas view as PNG download
 */
function downloadQRPNG(filename = 'cognetify-qr-code.png') {
    const frameWrapper = document.getElementById('qr-frame-wrapper');
    const container = document.getElementById('qr-canvas-container');
    const canvas = container ? container.querySelector('canvas') : null;

    if (!canvas) {
        showToast('No QR Code to download! Please generate one first.');
        return;
    }

    // Create composite canvas to capture frame and badge overlay into clean image
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    const badgeEl = document.getElementById('qr-center-badge');
    
    const isFramed = frameWrapper && frameWrapper.classList.contains('framed');
    const isSimple = frameWrapper && frameWrapper.classList.contains('simple');
    const padding = isFramed ? 40 : (isSimple ? 16 : 0);
    
    tempCanvas.width = canvas.width + (padding * 2);
    tempCanvas.height = canvas.height + (padding * 2);

    // Background
    if (isFramed || isSimple) {
        // Keep a clean white quiet zone around the downloadable QR.
        ctx.fillStyle = '#ffffff';
        if (isFramed) roundRect(ctx, 0, 0, tempCanvas.width, tempCanvas.height, 36);
        else ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.fill();
    }

    // Draw main QR canvas
    ctx.drawImage(canvas, padding, padding);

    // Draw the centred link label if present
    if (badgeEl) {
        const badgeWidth = 190;
        const badgeHeight = 38;
        const badgeX = (tempCanvas.width - badgeWidth) / 2;
        const badgeY = (tempCanvas.height - badgeHeight) / 2;

        // Draw pill background
        ctx.fillStyle = '#113e38';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 19);
        ctx.fill();
        ctx.stroke();

        // Draw globe icon white circle
        const circleX = badgeX + 18;
        const circleY = badgeY + 19;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(circleX, circleY, 11, 0, 2 * Math.PI);
        ctx.fill();

        // Draw text
        const badgeText = document.getElementById('input-badge-text')?.value || 'RECORD LINK';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText.substring(0, 16), badgeX + 36, badgeY + 19);
    }

    // Trigger download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    showToast('Downloaded QR Code Image (PNG)');
}

/**
 * Helper to draw rounded rectangle on canvas
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
