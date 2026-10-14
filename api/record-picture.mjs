import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// This endpoint uses Vercel's Node.js API handler (IncomingMessage/ServerResponse).
// Keep the image body raw so it can be streamed and size-checked before upload.
export const config = {
    api: { bodyParser: false }
};

function getHeader(request, name) {
    const value = request.headers?.[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

function sendJson(response, status, payload) {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(payload));
}

async function readImageBody(request) {
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of request) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += bytes.length;
        if (totalBytes > MAX_UPLOAD_BYTES) {
            const error = new Error('Optimized image must be 4 MB or smaller.');
            error.statusCode = 413;
            throw error;
        }
        chunks.push(bytes);
    }
    return Buffer.concat(chunks, totalBytes);
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Only POST is supported.' });
    }

    try {
        const origin = getHeader(request, 'origin');
        const requestHost = getHeader(request, 'host');
        if (origin && requestHost) {
            try {
                if (new URL(origin).host !== requestHost) {
                    return sendJson(response, 403, { error: 'Cross-origin uploads are not allowed.' });
                }
            } catch {
                return sendJson(response, 403, { error: 'Invalid request origin.' });
            }
        }

        const contentType = getHeader(request, 'content-type')?.split(';')[0].trim().toLowerCase();
        if (contentType !== 'image/jpeg') {
            return sendJson(response, 415, { error: 'Upload a JPEG image.' });
        }

        const declaredLength = Number(getHeader(request, 'content-length') || 0);
        if (declaredLength > MAX_UPLOAD_BYTES) {
            return sendJson(response, 413, { error: 'Optimized image must be 4 MB or smaller.' });
        }

        const imageBytes = await readImageBody(request);
        if (imageBytes.length === 0) {
            return sendJson(response, 400, { error: 'The uploaded image is empty.' });
        }

        // Confirm JPEG magic bytes instead of trusting the client-provided content type.
        if (imageBytes[0] !== 0xff || imageBytes[1] !== 0xd8 || imageBytes[2] !== 0xff) {
            return sendJson(response, 415, { error: 'The uploaded file is not a valid JPEG image.' });
        }

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return sendJson(response, 503, { error: 'Vercel Blob is not connected to this deployment yet.' });
        }

        const blob = await put(`record-pictures/${randomUUID()}.jpg`, imageBytes, {
            access: 'public',
            contentType: 'image/jpeg',
            addRandomSuffix: false
        });
        return sendJson(response, 201, { url: blob.url, pathname: blob.pathname });
    } catch (error) {
        console.error('Record picture upload failed:', error?.stack || error?.message || error);
        const status = error?.statusCode === 413 ? 413 : 500;
        const message = status === 413
            ? error.message
            : 'Upload function failed unexpectedly. Check the Vercel function logs.';
        return sendJson(response, status, { error: message });
    }
}
