import { randomBytes } from 'node:crypto';
import { get, put } from '@vercel/blob';

const MAX_RECORD_BYTES = 24 * 1024;
const RECORD_ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const FIELD_LIMITS = {
    workshop: 300,
    makerCode: 100,
    barrierNo: 160,
    vehicleType: 120,
    vin: 100,
    brand: 120,
    model: 180,
    modelYear: 20,
    madeOn: 30,
    cardIssued: 30,
    recordId: 100,
    pictureUrl: 600,
    pictureName: 120,
    picture2Url: 600,
    picture2Name: 120,
    picture3Url: 600,
    picture3Name: 120
};

function getHeader(request, name) {
    const value = request.headers?.[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
}

function sendJson(response, status, payload, cacheControl = 'no-store') {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', cacheControl);
    response.end(JSON.stringify(payload));
}

function hasBlobCredentials() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN
        || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));
}

function validateRequestOrigin(request) {
    const origin = getHeader(request, 'origin');
    const host = getHeader(request, 'host');
    if (!origin || !host) return false;
    try {
        return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
    } catch {
        return false;
    }
}

async function readJsonBody(request) {
    const declaredLength = Number(getHeader(request, 'content-length') || 0);
    if (declaredLength > MAX_RECORD_BYTES) {
        const error = new Error('Record data is too large.');
        error.statusCode = 413;
        throw error;
    }

    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of request) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += bytes.length;
        if (totalBytes > MAX_RECORD_BYTES) {
            const error = new Error('Record data is too large.');
            error.statusCode = 413;
            throw error;
        }
        chunks.push(bytes);
    }

    try {
        return JSON.parse(Buffer.concat(chunks, totalBytes).toString('utf8'));
    } catch {
        const error = new Error('Request body must be valid JSON.');
        error.statusCode = 400;
        throw error;
    }
}

function validateRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = {};
    for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
        const field = value[key] ?? '';
        if (typeof field !== 'string' || field.length > limit) return null;
        record[key] = field;
    }
    for (const key of ['pictureUrl', 'picture2Url', 'picture3Url']) {
        if (!record[key]) continue;
        try {
            const pictureUrl = new URL(record[key]);
            if (pictureUrl.protocol !== 'https:' || !pictureUrl.hostname.endsWith('.public.blob.vercel-storage.com')) return null;
        } catch {
            return null;
        }
    }
    return record;
}

async function createRecord(record) {
    const id = randomBytes(12).toString('base64url');
    await put(`records/${id}.json`, JSON.stringify(record), {
        access: 'public',
        contentType: 'application/json; charset=utf-8',
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 60
    });
    return id;
}

export const config = {
    api: { bodyParser: false }
};

export default async function handler(request, response) {
    if (!['GET', 'POST'].includes(request.method)) {
        response.setHeader('Allow', 'GET, POST');
        return sendJson(response, 405, { error: 'Only GET and POST are supported.' });
    }
    if (!hasBlobCredentials()) {
        return sendJson(response, 503, { error: 'Vercel Blob is not connected to this deployment yet.' });
    }

    try {
        if (request.method === 'POST') {
            if (!validateRequestOrigin(request)) return sendJson(response, 403, { error: 'Cross-origin record creation is not allowed.' });
            const contentType = getHeader(request, 'content-type')?.split(';')[0].trim().toLowerCase();
            if (contentType !== 'application/json') return sendJson(response, 415, { error: 'Send record data as JSON.' });

            const input = await readJsonBody(request);
            const record = validateRecord(input);
            if (!record) return sendJson(response, 400, { error: 'Record fields are missing, invalid, or too long.' });

            const id = await createRecord(record);
            return sendJson(response, 201, { id });
        }

        const host = getHeader(request, 'host') || 'localhost';
        const requestUrl = new URL(request.url || '/', `https://${host}`);
        const id = requestUrl.searchParams.get('id') || '';
        if (!RECORD_ID_PATTERN.test(id)) return sendJson(response, 400, { error: 'A valid record ID is required.' });

        const stored = await get(`records/${id}.json`, { access: 'public' });
        if (!stored || stored.statusCode !== 200 || !stored.stream) {
            return sendJson(response, 404, { error: 'This shared record was not found.' });
        }
        const record = await new Response(stored.stream).json();
        return sendJson(response, 200, { id, record }, 'public, max-age=300, s-maxage=86400, immutable');
    } catch (error) {
        console.error('Record API failed:', error?.stack || error?.message || error);
        const status = error?.statusCode === 413 ? 413 : error?.statusCode === 400 ? 400 : 500;
        const message = status === 413 || status === 400
            ? error.message
            : 'Record service failed. Check the Vercel function logs and Blob store connection.';
        return sendJson(response, status, { error: message });
    }
}
