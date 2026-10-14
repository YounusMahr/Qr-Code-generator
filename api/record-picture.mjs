import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export default async function handler(request) {
    if (request.method !== 'POST') {
        return Response.json({ error: 'Only POST is supported.' }, {
            status: 405,
            headers: { Allow: 'POST' }
        });
    }

    const origin = request.headers.get('origin');
    const requestHost = request.headers.get('host');
    if (origin && requestHost) {
        try {
            if (new URL(origin).host !== requestHost) {
                return Response.json({ error: 'Cross-origin uploads are not allowed.' }, { status: 403 });
            }
        } catch {
            return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
        }
    }

    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'image/jpeg') {
        return Response.json({ error: 'Upload a JPEG image.' }, { status: 415 });
    }

    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_UPLOAD_BYTES) {
        return Response.json({ error: 'Optimized image must be 4 MB or smaller.' }, { status: 413 });
    }

    let imageBytes;
    try {
        imageBytes = new Uint8Array(await request.arrayBuffer());
    } catch {
        return Response.json({ error: 'Could not read the uploaded image.' }, { status: 400 });
    }

    if (imageBytes.byteLength === 0 || imageBytes.byteLength > MAX_UPLOAD_BYTES) {
        return Response.json({ error: 'Optimized image must be between 1 byte and 4 MB.' }, { status: 413 });
    }

    // Confirm JPEG magic bytes instead of trusting the client-provided content type.
    if (imageBytes[0] !== 0xff || imageBytes[1] !== 0xd8 || imageBytes[2] !== 0xff) {
        return Response.json({ error: 'The uploaded file is not a valid JPEG image.' }, { status: 415 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return Response.json({ error: 'Vercel Blob is not connected to this deployment yet.' }, { status: 503 });
    }

    try {
        const blob = await put(`record-pictures/${randomUUID()}.jpg`, imageBytes, {
            access: 'public',
            contentType: 'image/jpeg',
            addRandomSuffix: false
        });
        return Response.json({ url: blob.url, pathname: blob.pathname }, { status: 201 });
    } catch (error) {
        console.error('Vercel Blob upload failed:', error?.message || 'Unknown upload error');
        return Response.json({ error: 'Picture upload failed. Check the Vercel Blob connection and try again.' }, { status: 502 });
    }
}
