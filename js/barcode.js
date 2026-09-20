/**
 * Barcode Generator Module
 * Wrapper around JsBarcode library
 */

function renderCustomBarcode(options = {}) {
    const svgContainer = document.getElementById('barcode-svg-container');
    if (!svgContainer) return;

    const content = options.content || 'FH3VnKa9';
    const format = options.format || 'CODE128';
    const lineColor = options.lineColor || '#111827';
    const background = options.background || '#ffffff';

    try {
        JsBarcode(svgContainer, content, {
            format: format,
            lineColor: lineColor,
            background: background,
            width: 2,
            height: 100,
            displayValue: true,
            font: 'JetBrains Mono',
            fontSize: 16,
            textMargin: 6
        });
    } catch (err) {
        console.warn('Barcode rendering error:', err);
        showToast('Invalid barcode content for ' + format);
    }
}
