/* ================================================
   ⚙️  CONFIGURACIÓN — Edita esto primero
   ================================================ */
const CONFIG = {
    startDate:   '2025-06-26',         // 📅 Fecha inicio (YYYY-MM-DD)
    startTime:   '00:00:00',           // ⏰ Hora inicio local (HH:mm:ss)
    startUtcOffset: '-05:00',          // 🌎 Offset de Quito (GMT-5)
    startTimeZone: 'America/Guayaquil',// 🕒 Zona horaria fija para cálculo
    yourName:    'Elian C.',           // 👤 Tu nombre
    partnerName: 'Diana',              // 👤 Su nombre
    letterText:  `Diana, mi amorcito

Hay un silencio distinto cuando llegas,
una quietud que ordena los espacios.
La urgencia de los días retrocede,
y el tiempo transcurre más despacio.

Conozco de memoria tu mirada,
la franqueza que dejas al hablar.
No necesito descifrar enigmas,
me basta con saberte en mi lugar.

Aprecio la costumbre de escucharte
y la forma en que entiendes mis silencios.
Me quedo con la paz que me devuelves,
lejos del ruido y de los desencuentros.

Te quiero con la fuerza del presente,
de una manera intacta y decidida.
Sin más promesa que quedarme siempre,
acompañando el paso de tu vida.

Con todo mi amor,`,
    letterSign:  '— Elian C. ♥',
};

// La versión vive en <meta name="app-release"> de index.html: increméntala en cada
// despliegue (junto con los ?v= de los <link>/<script>) para forzar el refresco.
const APP_RELEASE = document.querySelector('meta[name="app-release"]')?.content || 'dev';

const STORAGE_KEYS = Object.freeze({
    photos: 'photos',
    memories: 'memories',
    phrases: 'phrases',
    seedVersion: 'seedVersion',
    appRelease: 'appRelease',
    theme: 'theme',
    playerMin: 'playerMin',
    songIndex: 'songIndex',
});

const DRIVE_THUMB_SIZE = 'w1000';
const UPLOAD_MAX_SIDE = 1280;
const UPLOAD_QUALITY = 0.8;

function extractDriveFileId(url = '') {
    const txt = String(url || '').trim();
    if (!txt) return '';
    const byPath = txt.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (byPath && byPath[1]) return byPath[1];
    const byQuery = txt.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (byQuery && byQuery[1]) return byQuery[1];
    return '';
}

function toDriveThumbnailUrl(url = '', size = DRIVE_THUMB_SIZE) {
    const txt = String(url || '').trim();
    if (!txt) return '';
    if (txt.startsWith('data:')) return txt;
    if (txt.includes('drive.google.com/thumbnail?id=')) return txt;
    if (!/drive\.google\.com|docs\.google\.com/.test(txt)) return txt;
    const fileId = extractDriveFileId(txt);
    if (!fileId) return txt;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}

function normalizePhotosForDrive(list = []) {
    return (Array.isArray(list) ? list : []).map(photo => ({
        ...photo,
        src: toDriveThumbnailUrl(photo.src || ''),
    }));
}

/* ================================================
   CANCIONES (.flac) - Coloca tus archivos en /music
   ================================================ */
const MUSIC_DIR = 'music/';
const MUSIC_MANIFEST = 'music/library.json';
const SONGS_FALLBACK = [
    { src: 'music/Impacto.flac', title: 'Impacto', artist: 'Enjambre, Denise Gutiérrez', cover: 'assets/covers/impacto.jpg' },
    { src: 'music/Locos.flac', title: 'Locos', artist: 'León Larregui', cover: 'assets/covers/locos.jpg' },
    { src: 'music/Soñé (En Vivo).flac', title: 'Soñé (En Vivo)', artist: 'Zoé', cover: 'assets/covers/sone.jpg' },
];
let SONGS = [];
const mpDecoder = new TextDecoder('utf-8');

const INIT_PHOTOS = [
    { src: 'https://drive.google.com/thumbnail?id=1NN0n-4fjjSrxoZ1ksKg7PafV3naS32g_&sz=w1000', caption: 'Tan guapos en una de nuestras primeras salidas' },
    { src: 'https://drive.google.com/thumbnail?id=1tXpyp33WNTVQQjrYnqyozKoQVXsI2lRR&sz=w1000', caption: 'Estaba muy nervioso aqui todavía por nuestra foto' },
    { src: 'https://drive.google.com/thumbnail?id=1fVoD_HBAI86v8iUl-79iXbvryqcV_3en&sz=w1000', caption: 'Nos veíamos diferentes jajaja' },
    { src: 'https://drive.google.com/file/d/1hmEV6rTjgy3Z2Y1s87GFEUuDdEpukIGg/view?usp=sharing', caption: 'Con la bella Rozío' },
];

const INIT_MEMORIES = [
    {
        date: 'Tu próxima fecha especial',
        emoji: '✨',
        title: 'Escribe aquí su recuerdo favorito',
        text: 'Elian o tú pueden guardar aquí ese momento bonito que quieran recordar siempre: cuándo pasó, qué sintieron y por qué fue especial.',
    },
];

const INIT_PHRASES = [
    {
        text: 'Aquí pueden escribir una frase de ustedes dos. Elian o tú pueden editarla cuando quieran para que esta sección siempre se sienta suya.',
        author: 'Diana o Elian',
    },
];

const LEGACY_MEMORY_MARKERS = [
    'el primer encuentro',
    'primera aventura',
    'navidad especial',
    'un año juntos',
    'nos conocimos',
];

const LEGACY_PHRASE_MARKERS = [
    'eres la razón por la que creo en los finales felices',
    'contigo el tiempo vuela, y aun así, nunca es suficiente',
    'te elegiría en cada vida, en cada universo, sin dudarlo',
    'mi lugar favorito en el mundo es a tu lado',
];

const MEMORY_EMOJIS = ['💫', '✨', '🐱', '💌', '🌙', '🎉', '🍓', '🌷', '☕', '🎬', '✈️', '🏠'];

/* ================================================
   🗄️  STATE
   ================================================ */
function readStorageArray(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function readPref(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writePref(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Preferencia opcional: si no se puede guardar, seguimos igual.
    }
}

function persistArray(key, value, { silent = false } = {}) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        if (!silent) showToast('No hay espacio para guardar más en este navegador. Prueba con un enlace de Drive en lugar de subir la foto.', { kind: 'warn' });
        return false;
    }
}

function sanitizeImageUrl(url = '') {
    const raw = String(url || '').trim();
    if (!raw) return '';
    const driveUrl = toDriveThumbnailUrl(raw);
    const isDataImage = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(driveUrl);
    if (isDataImage) return driveUrl;
    try {
        const parsed = new URL(driveUrl, window.location.href);
        if (parsed.protocol === 'blob:' || parsed.protocol === 'https:') return parsed.href;
        const isLocalDevHost = /^localhost$|^127\.0\.0\.1$|^\[::1\]$/.test(window.location.hostname);
        if (parsed.protocol === 'http:' && isLocalDevHost) {
            return parsed.href;
        }
        return '';
    } catch {
        return '';
    }
}

function sanitizePhotoRecord(photo = {}) {
    return {
        src: sanitizeImageUrl(photo.src || ''),
        caption: String(photo.caption || '').trim().slice(0, 180),
    };
}

function sanitizeMemoryRecord(memory = {}) {
    return {
        date: String(memory.date || '').trim().slice(0, 60),
        emoji: String(memory.emoji || '💫').trim().slice(0, 4) || '💫',
        title: String(memory.title || '').trim().slice(0, 120),
        text: String(memory.text || '').trim().slice(0, 500),
    };
}

function sanitizePhraseRecord(phrase = {}) {
    return {
        text: String(phrase.text || '').trim().slice(0, 320),
        author: String(phrase.author || '').trim().slice(0, 80),
    };
}

function mpSafeDecode(value = '') {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function mpNormalizeMediaPath(path = '') {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^[a-zA-Z]+:\/\//.test(raw)) return raw;
    return mpSafeDecode(raw).replace(/\\/g, '/');
}

function mpFileNameFromPath(path = '') {
    const clean = mpNormalizeMediaPath(String(path || '').split(/[?#]/)[0]);
    const filename = mpSafeDecode(clean.split('/').pop() || '').trim();
    return filename.replace(/\.[^.]+$/, '') || 'Pista';
}

function mpResolveUrl(base, value) {
    try {
        return new URL(value, new URL(base, window.location.href)).href;
    } catch {
        return value;
    }
}

function mpResolveAssetPath(path = '', base = MUSIC_MANIFEST) {
    const raw = mpNormalizeMediaPath(path);
    if (!raw) return '';
    if (/^[a-zA-Z]+:\/\//.test(raw)) return raw;
    if (raw.startsWith('/')) return mpResolveUrl(window.location.href, raw);
    // Rutas desde la raíz del sitio (music/..., assets/...).
    if (/^(music|assets)\//.test(raw)) return mpResolveUrl(window.location.href, raw);
    return mpResolveUrl(base, raw);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const mergedOptions = {
            ...options,
            signal: controller.signal,
        };
        return await fetch(url, mergedOptions);
    } finally {
        clearTimeout(timeout);
    }
}

async function mpLoadManifestSongs() {
    try {
        const res = await fetchWithTimeout(MUSIC_MANIFEST, { cache: 'no-store' }, 10000);
        if (!res.ok) return [];
        const data = await res.json();
        const entries = Array.isArray(data) ? data : (Array.isArray(data?.songs) ? data.songs : []);
        if (!entries.length) return [];
        return entries
            .map(item => ({
                src: mpResolveAssetPath(item.src || '', MUSIC_MANIFEST),
                title: item.title || mpFileNameFromPath(item.src || ''),
                artist: item.artist || 'Artista desconocido',
                album: item.album || '',
                cover: item.cover ? mpResolveAssetPath(item.cover, MUSIC_MANIFEST) : '',
            }))
            .filter(item => item.src);
    } catch {
        return [];
    }
}

async function mpDiscoverFlacFilesFromDir() {
    try {
        const res = await fetchWithTimeout(MUSIC_DIR, { cache: 'no-store' }, 10000);
        if (!res.ok) return [];
        const html = await res.text();
        const hrefs = html.match(/href="([^"]+)"/gi) || [];
        const files = new Set();
        hrefs.forEach(raw => {
            const href = mpNormalizeMediaPath(raw.replace(/^href="/i, '').replace(/"$/i, ''));
            if (!/\.flac($|[?#])/i.test(href)) return;
            const fullUrl = mpResolveAssetPath(href, MUSIC_DIR);
            if (!/\/music\/.+\.flac($|[?#])/i.test(fullUrl)) return;
            files.add(fullUrl);
        });
        return Array.from(files).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    } catch {
        return [];
    }
}

function mpReadVorbisComments(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const out = {};
    let offset = 0;
    if (offset + 4 > view.byteLength) return out;
    const vendorLen = view.getUint32(offset, true);
    offset += 4 + vendorLen;
    if (offset + 4 > view.byteLength) return out;
    const count = view.getUint32(offset, true);
    offset += 4;
    for (let i = 0; i < count; i++) {
        if (offset + 4 > view.byteLength) break;
        const len = view.getUint32(offset, true);
        offset += 4;
        if (offset + len > view.byteLength) break;
        const text = mpDecoder.decode(bytes.subarray(offset, offset + len));
        offset += len;
        const eq = text.indexOf('=');
        if (eq <= 0) continue;
        out[text.slice(0, eq).toUpperCase()] = text.slice(eq + 1).trim();
    }
    return out;
}

function mpGuessImageMime(imageBytes) {
    if (imageBytes.length < 4) return 'image/jpeg';
    if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4e && imageBytes[3] === 0x47) return 'image/png';
    if (imageBytes[0] === 0xff && imageBytes[1] === 0xd8) return 'image/jpeg';
    if (imageBytes[0] === 0x47 && imageBytes[1] === 0x49 && imageBytes[2] === 0x46) return 'image/gif';
    if (imageBytes[0] === 0x52 && imageBytes[1] === 0x49 && imageBytes[2] === 0x46 && imageBytes[3] === 0x46) return 'image/webp';
    return 'image/jpeg';
}

function mpReadPictureMetadata(bytes, objectUrls) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    if (offset + 4 > view.byteLength) return '';
    offset += 4; // picture type
    if (offset + 4 > view.byteLength) return '';
    const mimeLen = view.getUint32(offset, false);
    offset += 4;
    if (offset + mimeLen > view.byteLength) return '';
    const mime = mpDecoder.decode(bytes.subarray(offset, offset + mimeLen));
    offset += mimeLen;
    if (offset + 4 > view.byteLength) return '';
    const descLen = view.getUint32(offset, false);
    offset += 4 + descLen;
    offset += 16; // width, height, depth, indexed colors
    if (offset + 4 > view.byteLength) return '';
    const dataLen = view.getUint32(offset, false);
    offset += 4;
    if (offset + dataLen > view.byteLength) return '';
    const imageBytes = bytes.subarray(offset, offset + dataLen);
    const finalMime = mime && mime !== '-->' ? mime : mpGuessImageMime(imageBytes);
    const url = URL.createObjectURL(new Blob([imageBytes], { type: finalMime }));
    objectUrls.push(url);
    return url;
}

function mpParseFlacMetadata(buffer, objectUrls) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4 || bytes[0] !== 0x66 || bytes[1] !== 0x4c || bytes[2] !== 0x61 || bytes[3] !== 0x43) {
        throw new Error('INVALID_FLAC');
    }

    let offset = 4;
    let last = false;
    let comments = {};
    let cover = '';

    while (!last) {
        if (offset + 4 > bytes.length) throw new Error('INCOMPLETE_METADATA');
        const header = bytes[offset];
        last = (header & 0x80) !== 0;
        const type = header & 0x7f;
        const len = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += 4;
        if (offset + len > bytes.length) throw new Error('INCOMPLETE_METADATA');
        const block = bytes.subarray(offset, offset + len);

        if (type === 4) comments = { ...comments, ...mpReadVorbisComments(block) };
        if (type === 6 && !cover) cover = mpReadPictureMetadata(block, objectUrls);
        offset += len;
    }

    return {
        title: comments.TITLE || '',
        artist: comments.ARTIST || comments.ALBUMARTIST || comments.ARTISTSORT || '',
        cover,
    };
}

async function mpReadFlacMetadata(url, objectUrls) {
    const getBuffer = async (useRange) => {
        const headers = useRange ? { Range: 'bytes=0-5242879' } : {};
        const res = await fetchWithTimeout(url, { headers, cache: 'no-store' }, useRange ? 12000 : 18000);
        if (!res.ok) throw new Error('FETCH_FAIL');
        return res.arrayBuffer();
    };

    try {
        const partial = await getBuffer(true);
        return mpParseFlacMetadata(partial, objectUrls);
    } catch (err) {
        if (err.message !== 'INCOMPLETE_METADATA') return { title: '', artist: '', cover: '' };
    }

    try {
        const full = await getBuffer(false);
        return mpParseFlacMetadata(full, objectUrls);
    } catch {
        return { title: '', artist: '', cover: '' };
    }
}

async function mpAutoDiscoverSongs(objectUrls) {
    const fromManifest = await mpLoadManifestSongs();
    if (fromManifest.length) return fromManifest;

    const files = await mpDiscoverFlacFilesFromDir();
    if (!files.length) {
        // Sin manifiesto ni listado: usamos la lista conocida sin descargar audio extra.
        return SONGS_FALLBACK.map(song => ({
            src: mpResolveAssetPath(song.src, window.location.href),
            title: song.title || mpFileNameFromPath(song.src),
            artist: song.artist || 'Artista desconocido',
            cover: song.cover ? mpResolveAssetPath(song.cover, window.location.href) : '',
        }));
    }

    const songs = await Promise.all(files.map(async src => {
        const meta = await mpReadFlacMetadata(src, objectUrls);
        return {
            src,
            title: meta.title || mpFileNameFromPath(src),
            artist: meta.artist || 'Artista desconocido',
            cover: meta.cover || '',
        };
    }));
    return songs;
}

function ensureReleaseFreshness() {
    try {
        const url = new URL(window.location.href);
        const currentParam = url.searchParams.get('v');
        const storedRelease = localStorage.getItem(STORAGE_KEYS.appRelease);

        if (storedRelease !== APP_RELEASE) {
            localStorage.setItem(STORAGE_KEYS.appRelease, APP_RELEASE);
            localStorage.removeItem(STORAGE_KEYS.seedVersion);
        }

        if (currentParam !== APP_RELEASE) {
            url.searchParams.set('v', APP_RELEASE);
            window.location.replace(url.toString());
            return false;
        }
    } catch {
        // Si algo falla, seguimos con la carga normal.
    }
    return true;
}

const RELEASE_READY = ensureReleaseFreshness();

let photos   = normalizePhotosForDrive(readStorageArray(STORAGE_KEYS.photos, INIT_PHOTOS)).map(sanitizePhotoRecord);
let memories = readStorageArray(STORAGE_KEYS.memories, INIT_MEMORIES).map(sanitizeMemoryRecord);
let phrases  = readStorageArray(STORAGE_KEYS.phrases, INIT_PHRASES).map(sanitizePhraseRecord);

function applySeedMigrationIfNeeded() {
    try {
        if (localStorage.getItem(STORAGE_KEYS.seedVersion) === 'v3') return;

        const memoryHasTemplate = memories.length === 1 && String(memories[0]?.title || '').includes('Escribe aquí su recuerdo favorito');
        const phraseHasTemplate = phrases.length === 1 && String(phrases[0]?.text || '').includes('Aquí pueden escribir una frase de ustedes dos');

        const memoriesAreLegacy = memories.length > 1 && memories.every(item => {
            const title = String(item?.title || '').trim().toLowerCase();
            return LEGACY_MEMORY_MARKERS.some(marker => title.includes(marker));
        });

        const phrasesAreLegacy = phrases.length > 1 && phrases.every(item => {
            const text = String(item?.text || '').trim().toLowerCase();
            return LEGACY_PHRASE_MARKERS.some(marker => text.includes(marker));
        });

        if (!memoryHasTemplate && memoriesAreLegacy) {
            memories = INIT_MEMORIES.map(sanitizeMemoryRecord);
        }
        if (!phraseHasTemplate && phrasesAreLegacy) {
            phrases = INIT_PHRASES.map(sanitizePhraseRecord);
        }

        localStorage.setItem(STORAGE_KEYS.seedVersion, 'v3');
    } catch {
        // Si localStorage falla, continuamos con el estado en memoria.
    }
}

if (RELEASE_READY) {
    applySeedMigrationIfNeeded();
    persistArray(STORAGE_KEYS.photos, photos, { silent: true });
    persistArray(STORAGE_KEYS.memories, memories, { silent: true });
    persistArray(STORAGE_KEYS.phrases, phrases, { silent: true });
}

const $ = id => document.getElementById(id);

function svgIcon(name, className = 'icon') {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.appendChild(use);
    return svg;
}

function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

/* ================================================
   🌗  TEMA
   ================================================ */
function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const toggle = $('themeToggle');
    if (toggle) toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche');
    const meta = $('metaTheme');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#170F22' : '#F7EEF1');
}

function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    $('themeToggle')?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        writePref(STORAGE_KEYS.theme, next);
    });
}

/* ================================================
   ⏱️  CONTADOR
   ================================================ */
function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const TZ_FORMATTER_CACHE = new Map();
function getTimeZoneFormatter(timeZone) {
    if (TZ_FORMATTER_CACHE.has(timeZone)) return TZ_FORMATTER_CACHE.get(timeZone);
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    TZ_FORMATTER_CACHE.set(timeZone, formatter);
    return formatter;
}

function getTimeZoneParts(date, timeZone) {
    const parts = getTimeZoneFormatter(timeZone).formatToParts(date);

    const map = {};
    for (const part of parts) {
        if (part.type !== 'literal') map[part.type] = part.value;
    }
    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour) % 24,
        minute: Number(map.minute),
        second: Number(map.second),
    };
}

const RELATION_START = Object.freeze((() => {
    const [y, m, d] = String(CONFIG.startDate || '1970-01-01').split('-').map(Number);
    const [hh = 0, mm = 0, ss = 0] = String(CONFIG.startTime || '00:00:00').split(':').map(Number);
    const iso = `${String(CONFIG.startDate)}T${String(CONFIG.startTime || '00:00:00')}${String(CONFIG.startUtcOffset || '-05:00')}`;
    const utcMs = Date.parse(iso);
    return {
        year: y || 1970,
        month: m || 1,
        day: d || 1,
        hour: hh || 0,
        minute: mm || 0,
        second: ss || 0,
        utcMs: Number.isFinite(utcMs) ? utcMs : Date.UTC((y || 1970), (m || 1) - 1, d || 1, (hh || 0) + 5, mm || 0, ss || 0),
        timeZone: CONFIG.startTimeZone || 'America/Guayaquil',
    };
})());

const MONTH_LONG = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const MONTH_SHORT = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function plural(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
}

function joinSpanish(list) {
    if (list.length <= 1) return list.join('');
    return `${list.slice(0, -1).join(', ')} y ${list[list.length - 1]}`;
}

function computeElapsed(now) {
    const start = RELATION_START;
    let years = now.year - start.year;
    let months = now.month - start.month;
    let days = now.day - start.day;
    let hours = now.hour - start.hour;
    let minutes = now.minute - start.minute;
    let seconds = now.second - start.second;

    if (seconds < 0) {
        seconds += 60;
        minutes -= 1;
    }
    if (minutes < 0) {
        minutes += 60;
        hours -= 1;
    }
    if (hours < 0) {
        hours += 24;
        days -= 1;
    }
    if (days < 0) {
        months -= 1;
        let borrowYear = now.year;
        let borrowMonth = now.month - 1;
        if (borrowMonth < 1) {
            borrowMonth = 12;
            borrowYear -= 1;
        }
        days += daysInMonth(borrowYear, borrowMonth);
    }
    if (months < 0) {
        months += 12;
        years -= 1;
    }
    if (years < 0) return { years: 0, months: 0, days: 0, hours: 0 };
    return { years, months, days, hours };
}

function describeMilestone(totalMonths) {
    if (totalMonths % 12 === 0) return plural(totalMonths / 12, 'año', 'años');
    return plural(totalMonths, 'mes', 'meses');
}

function nextMonthiversary(now) {
    const start = RELATION_START;
    let y = now.year;
    let m = now.month;
    let day = Math.min(start.day, daysInMonth(y, m));
    if (now.day > day) {
        m += 1;
        if (m > 12) { m = 1; y += 1; }
        day = Math.min(start.day, daysInMonth(y, m));
    }
    const totalMonths = (y - start.year) * 12 + (m - start.month);
    const daysLeft = Math.round((Date.UTC(y, m - 1, day) - Date.UTC(now.year, now.month - 1, now.day)) / 86400000);
    return { y, m, day, totalMonths, daysLeft };
}

function updateCounter() {
    const nowUtcMs = Date.now();
    const startLabel = MONTH_LONG.format(new Date(Date.UTC(RELATION_START.year, RELATION_START.month - 1, RELATION_START.day)));

    if (nowUtcMs < RELATION_START.utcMs) {
        $('togetherText').textContent = 'casi nada';
        $('togetherSub').textContent = `Empezamos el ${startLabel}.`;
        return;
    }

    const now = getTimeZoneParts(new Date(nowUtcMs), RELATION_START.timeZone);
    const { years, months, days, hours } = computeElapsed(now);
    const parts = [];
    if (years) parts.push(plural(years, 'año', 'años'));
    if (months) parts.push(plural(months, 'mes', 'meses'));
    if (days) parts.push(plural(days, 'día', 'días'));
    if (hours || !parts.length) parts.push(plural(hours, 'hora', 'horas'));

    const strong = el('strong', '', joinSpanish(parts));
    $('togetherText').replaceChildren(strong);

    const totalDays = Math.floor((nowUtcMs - RELATION_START.utcMs) / 86400000);
    $('togetherSub').textContent = `Son ${totalDays.toLocaleString('es')} ${totalDays === 1 ? 'día' : 'días'} desde el ${startLabel}.`;

    const next = nextMonthiversary(now);
    const milestone = describeMilestone(next.totalMonths);
    if (next.daysLeft === 0 && next.totalMonths > 0) {
        $('nextDateDay').textContent = 'Hoy';
        $('nextDateText').textContent = `¡Cumplimos ${milestone}!`;
    } else {
        $('nextDateDay').textContent = MONTH_SHORT.format(new Date(Date.UTC(next.y, next.m - 1, next.day))).replace('.', '');
        const left = next.daysLeft === 1 ? 'mañana' : `en ${next.daysLeft} días`;
        $('nextDateText').textContent = `Cumplimos ${milestone} ${left}`;
    }
}

let counterTimer = null;
function startCounterTicker() {
    updateCounter();
    if (counterTimer) clearInterval(counterTimer);
    const now = Date.now();
    const msToNextMinute = 60000 - (now % 60000);
    setTimeout(() => {
        updateCounter();
        counterTimer = setInterval(updateCounter, 60000);
    }, msToNextMinute);
}

/* ================================================
   MUSIC PLAYER
   ================================================ */
let mpIdx = 0;
let mpPlaying = false;
let mpSeeking = false;
let mpAudio = null;
const mpObjectUrls = [];
const mpEls = {};

function mpFmt(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function mpPaintRange(input) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 1;
    const pct = ((Number(input.value) - min) / (max - min)) * 100;
    input.style.setProperty('--fill', `${Math.max(0, Math.min(100, pct))}%`);
}

function mpPaintProgress() {
    const dur = mpAudio.duration;
    const cur = mpAudio.currentTime;
    if (!mpSeeking) {
        mpEls.seek.value = Number.isFinite(dur) && dur > 0 ? Math.round((cur / dur) * 1000) : 0;
    }
    mpPaintRange(mpEls.seek);
    mpEls.current.textContent = mpFmt(cur);
    mpEls.duration.textContent = mpFmt(dur);
    mpEls.seek.setAttribute('aria-valuetext', `${mpFmt(cur)} de ${mpFmt(dur)}`);
}

function mpSetPlaying(state) {
    mpPlaying = !!state;
    const label = mpPlaying ? 'Pausar' : 'Reproducir';
    mpEls.play.setAttribute('aria-label', label);
    mpEls.play.querySelector('use').setAttribute('href', mpPlaying ? '#i-pause' : '#i-play');
    mpEls.player.classList.toggle('is-playing', mpPlaying);
    mpEls.heroLabel.textContent = mpPlaying ? 'Pausar la música' : 'Poner nuestra música';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = mpPlaying ? 'playing' : 'paused';
}

function mpSetCover(song) {
    if (song.cover) {
        mpEls.cover.src = song.cover;
        mpEls.cover.hidden = false;
        return;
    }
    mpEls.cover.removeAttribute('src');
    mpEls.cover.hidden = true;
}

function mpUpdateMediaSession(song) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title || 'Sin título',
            artist: song.artist || '',
            album: song.album || 'Diana y Elian',
            artwork: song.cover ? [{ src: song.cover, sizes: '320x320', type: 'image/jpeg' }] : [],
        });
    } catch {
        // Algunos navegadores no aceptan ciertas portadas; no es crítico.
    }
}

function mpRenderPlaylist() {
    const list = mpEls.listItems;
    list.replaceChildren();
    SONGS.forEach((song, i) => {
        const li = document.createElement('li');
        const btn = el('button', 'playlist-item');
        btn.type = 'button';
        if (i === mpIdx) btn.setAttribute('aria-current', 'true');
        if (song.cover) {
            const img = document.createElement('img');
            img.src = song.cover;
            img.alt = '';
            img.loading = 'lazy';
            btn.appendChild(img);
        } else {
            btn.appendChild(el('span', 'pl-ph'));
        }
        const meta = el('span');
        meta.appendChild(el('strong', '', song.title || 'Sin título'));
        meta.appendChild(el('small', '', song.artist || ''));
        btn.appendChild(meta);
        btn.addEventListener('click', () => {
            mpLoad(i, true);
            mpToggleList(false);
            mpEls.play.focus();
        });
        li.appendChild(btn);
        list.appendChild(li);
    });
}

function mpToggleList(force) {
    const open = typeof force === 'boolean' ? force : mpEls.list.hidden;
    mpEls.list.hidden = !open;
    mpEls.listToggle.setAttribute('aria-expanded', String(open));
    if (open) mpEls.list.querySelector('[aria-current="true"]')?.focus();
}

function mpSetMinimized(min, { focus = false } = {}) {
    mpEls.player.classList.toggle('is-min', min);
    document.body.classList.toggle('player-min', min);
    mpEls.expand.tabIndex = min ? 0 : -1;
    mpEls.expand.setAttribute('aria-label', min ? 'Mostrar el reproductor' : (SONGS[mpIdx]?.title || 'Portada'));
    if (min) mpToggleList(false);
    writePref(STORAGE_KEYS.playerMin, min ? '1' : '0');
    if (focus) (min ? mpEls.expand : mpEls.play).focus();
}

function mpPlay() {
    mpAudio.muted = false;
    return mpAudio.play()
        .then(() => mpSetPlaying(true))
        .catch(() => {
            mpSetPlaying(false);
            showToast('No se pudo reproducir la canción. Revisa tu conexión e inténtalo de nuevo.', { kind: 'warn' });
        });
}

function mpToggle() {
    if (!SONGS.length) return;
    if (mpPlaying) {
        mpAudio.pause();
        return;
    }
    mpPlay();
}

function mpLoad(index, autoplay = false) {
    if (!SONGS.length) return;
    mpIdx = (index + SONGS.length) % SONGS.length;
    const song = SONGS[mpIdx];

    mpAudio.src = song.src;
    mpEls.title.textContent = song.title || 'Sin título';
    mpEls.artist.textContent = song.artist || 'Artista desconocido';
    mpEls.title.title = song.title || '';
    mpSetCover(song);
    mpEls.seek.value = 0;
    mpPaintProgress();
    mpAudio.load();
    mpUpdateMediaSession(song);
    writePref(STORAGE_KEYS.songIndex, String(mpIdx));
    mpEls.listItems.querySelectorAll('.playlist-item').forEach((btn, i) => {
        if (i === mpIdx) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
    });

    if (!autoplay) {
        mpSetPlaying(false);
        return;
    }
    mpPlay();
}

async function mpInit() {
    mpAudio = $('mpAudio');
    mpEls.player = $('player');
    mpEls.expand = $('mpExpand');
    mpEls.cover = $('mpCover');
    mpEls.title = $('mpTitle');
    mpEls.artist = $('mpArtist');
    mpEls.play = $('mpPlay');
    mpEls.prev = $('mpPrev');
    mpEls.next = $('mpNext');
    mpEls.seek = $('mpSeek');
    mpEls.current = $('mpCurrent');
    mpEls.duration = $('mpDuration');
    mpEls.vol = $('mpVol');
    mpEls.mute = $('mpMute');
    mpEls.list = $('mpList');
    mpEls.listItems = $('mpListItems');
    mpEls.listToggle = $('mpListToggle');
    mpEls.minimize = $('mpMinimize');
    mpEls.hero = $('heroPlay');
    mpEls.heroLabel = mpEls.hero.querySelector('span');

    mpEls.minimize.addEventListener('click', () => mpSetMinimized(true, { focus: true }));
    mpEls.expand.addEventListener('click', () => {
        if (mpEls.player.classList.contains('is-min')) mpSetMinimized(false, { focus: true });
    });
    if (readPref(STORAGE_KEYS.playerMin) === '1') mpSetMinimized(true);

    SONGS = await mpAutoDiscoverSongs(mpObjectUrls);

    if (!SONGS.length) {
        mpEls.title.textContent = 'No hay canciones';
        mpEls.artist.textContent = 'Agrega archivos .flac a la carpeta music';
        return;
    }

    [mpEls.play, mpEls.prev, mpEls.next, mpEls.seek, mpEls.vol, mpEls.mute, mpEls.listToggle, mpEls.hero]
        .forEach(control => { control.disabled = false; });
    if (SONGS.length < 2) {
        mpEls.prev.disabled = true;
        mpEls.next.disabled = true;
    }

    mpEls.play.addEventListener('click', mpToggle);
    mpEls.hero.addEventListener('click', () => {
        if (!mpPlaying && mpEls.player.classList.contains('is-min')) mpSetMinimized(false);
        mpToggle();
    });
    mpEls.prev.addEventListener('click', () => {
        // Como en cualquier reproductor: si ya avanzó, vuelve al inicio de la canción.
        if (mpAudio.currentTime > 4) {
            mpAudio.currentTime = 0;
            return;
        }
        mpLoad(mpIdx - 1, mpPlaying);
    });
    mpEls.next.addEventListener('click', () => mpLoad(mpIdx + 1, mpPlaying));
    mpEls.listToggle.addEventListener('click', () => mpToggleList());

    mpAudio.addEventListener('play', () => mpSetPlaying(true));
    mpAudio.addEventListener('pause', () => mpSetPlaying(false));
    mpAudio.addEventListener('loadedmetadata', mpPaintProgress);
    mpAudio.addEventListener('timeupdate', mpPaintProgress);
    mpAudio.addEventListener('ended', () => mpLoad(mpIdx + 1, true));
    mpAudio.addEventListener('error', () => {
        if (!mpAudio.getAttribute('src')) return;
        mpSetPlaying(false);
        mpEls.artist.textContent = 'No se pudo cargar esta canción';
    });

    mpEls.seek.addEventListener('input', () => {
        mpSeeking = true;
        const dur = mpAudio.duration;
        mpPaintRange(mpEls.seek);
        if (Number.isFinite(dur)) mpEls.current.textContent = mpFmt((mpEls.seek.value / 1000) * dur);
    });
    mpEls.seek.addEventListener('change', () => {
        const dur = mpAudio.duration;
        if (Number.isFinite(dur) && dur > 0) mpAudio.currentTime = (mpEls.seek.value / 1000) * dur;
        mpSeeking = false;
        mpPaintProgress();
    });

    mpAudio.volume = Number(mpEls.vol.value || 0.7);
    mpPaintRange(mpEls.vol);
    mpEls.vol.addEventListener('input', () => {
        mpAudio.volume = Number(mpEls.vol.value);
        mpAudio.muted = Number(mpEls.vol.value) === 0;
        mpPaintRange(mpEls.vol);
    });
    mpEls.mute.addEventListener('click', () => {
        mpAudio.muted = !mpAudio.muted;
    });
    mpAudio.addEventListener('volumechange', () => {
        const muted = mpAudio.muted || mpAudio.volume === 0;
        mpEls.mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
        mpEls.mute.querySelector('use').setAttribute('href', muted ? '#i-mute' : '#i-volume');
    });

    document.addEventListener('click', e => {
        if (mpEls.list.hidden) return;
        if (!mpEls.list.contains(e.target) && !mpEls.listToggle.contains(e.target)) mpToggleList(false);
    });
    mpEls.list.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            mpToggleList(false);
            mpEls.listToggle.focus();
        }
    });

    if ('mediaSession' in navigator) {
        const handlers = {
            play: () => mpPlay(),
            pause: () => mpAudio.pause(),
            previoustrack: () => mpLoad(mpIdx - 1, true),
            nexttrack: () => mpLoad(mpIdx + 1, true),
        };
        Object.entries(handlers).forEach(([action, fn]) => {
            try { navigator.mediaSession.setActionHandler(action, fn); } catch { /* acción no soportada */ }
        });
    }

    window.addEventListener('beforeunload', () => {
        mpObjectUrls.forEach(url => URL.revokeObjectURL(url));
    });

    mpRenderPlaylist();
    const savedIdx = Number(readPref(STORAGE_KEYS.songIndex));
    mpLoad(Number.isInteger(savedIdx) && savedIdx >= 0 ? savedIdx : 0, false);
}

/* ================================================
   ✏️  ACCIONES DE CADA ELEMENTO
   ================================================ */
const COLLECTIONS = {
    photo:  { key: STORAGE_KEYS.photos,   get: () => photos,   set: v => { photos = v; },   render: () => renderGallery(),  deleted: 'Foto eliminada',     restored: 'Foto restaurada' },
    memory: { key: STORAGE_KEYS.memories, get: () => memories, set: v => { memories = v; }, render: () => renderTimeline(), deleted: 'Recuerdo eliminado', restored: 'Recuerdo restaurado' },
    phrase: { key: STORAGE_KEYS.phrases,  get: () => phrases,  set: v => { phrases = v; },  render: () => renderPhrases(),  deleted: 'Frase eliminada',    restored: 'Frase restaurada' },
};

function itemTools(type, index, label) {
    const tools = el('div', 'item-tools');
    const edit = el('button', 'icon-btn');
    edit.type = 'button';
    edit.dataset.action = 'edit';
    edit.setAttribute('aria-label', `Editar: ${label}`);
    edit.title = 'Editar';
    edit.appendChild(svgIcon('edit'));
    edit.addEventListener('click', () => openEditor(type, index));

    const del = el('button', 'icon-btn');
    del.type = 'button';
    del.dataset.action = 'delete';
    del.setAttribute('aria-label', `Eliminar: ${label}`);
    del.title = 'Eliminar';
    del.appendChild(svgIcon('trash'));
    del.addEventListener('click', () => deleteItem(type, index));

    tools.append(edit, del);
    return tools;
}

function deleteItem(type, index) {
    const col = COLLECTIONS[type];
    const list = col.get().slice();
    const [removed] = list.splice(index, 1);
    if (!removed) return;
    col.set(list);
    persistArray(col.key, list);
    col.render();
    showToast(`${col.deleted}.`, {
        actionLabel: 'Deshacer',
        onAction: () => {
            const restored = col.get().slice();
            restored.splice(Math.min(index, restored.length), 0, removed);
            col.set(restored);
            persistArray(col.key, restored);
            col.render();
            showToast(`${col.restored}.`);
        },
    });
}

function emptyState(message, type, buttonLabel) {
    const box = el('div', 'empty');
    box.appendChild(el('p', '', message));
    const btn = el('button', 'btn btn-primary btn-sm');
    btn.type = 'button';
    btn.append(svgIcon('plus'), el('span', '', buttonLabel));
    btn.addEventListener('click', () => openEditor(type));
    box.appendChild(btn);
    return box;
}

/* ================================================
   GALERIA
   ================================================ */
function createGalleryPlaceholder(message = 'No se pudo cargar esta foto') {
    const wrapper = el('div', 'photo-missing');
    wrapper.appendChild(svgIcon('close'));
    wrapper.appendChild(el('span', '', message));
    return wrapper;
}

function renderGallery({ animate = false } = {}) {
    const grid = $('galleryGrid');
    grid.replaceChildren();
    if (!photos.length) {
        const li = document.createElement('li');
        li.style.gridColumn = '1 / -1';
        li.appendChild(emptyState('Todavía no hay fotos. Sube la primera desde tu teléfono o pega un enlace de Drive.', 'photo', 'Agregar foto'));
        grid.appendChild(li);
        return;
    }
    photos.forEach((ph, idx) => {
        const safeCaption = String(ph.caption || '').trim();
        const safeSrc = sanitizeImageUrl(ph.src || '');
        const label = safeCaption || `Foto ${idx + 1}`;
        const li = el('li', `photo${animate ? ' reveal' : ''}`);
        if (animate) li.style.setProperty('--delay', `${Math.min(idx * 70, 350)}ms`);

        const figure = document.createElement('figure');
        if (safeSrc) {
            const btn = el('button', 'photo-open');
            btn.type = 'button';
            btn.setAttribute('aria-label', `Ver en grande: ${label}`);
            const img = document.createElement('img');
            img.src = safeSrc;
            img.alt = safeCaption;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('error', () => {
                const holder = el('div', 'photo-open');
                holder.appendChild(createGalleryPlaceholder('No se pudo cargar. Revisa que el enlace sea público.'));
                btn.replaceWith(holder);
            }, { once: true });
            btn.appendChild(img);
            btn.addEventListener('click', () => openLightbox(idx, btn));
            figure.appendChild(btn);
        } else {
            const holder = el('div', 'photo-open');
            holder.appendChild(createGalleryPlaceholder('Esta foto no tiene imagen. Edítala para agregarla.'));
            figure.appendChild(holder);
        }

        const caption = el('figcaption', 'photo-caption');
        caption.appendChild(el('p', '', safeCaption));
        caption.appendChild(itemTools('photo', idx, label));
        figure.appendChild(caption);
        li.appendChild(figure);
        grid.appendChild(li);
    });
    if (animate) observeReveal();
}

/* ================================================
   🗓️  TIMELINE
   ================================================ */
function renderTimeline({ animate = false } = {}) {
    const tl = $('timeline');
    tl.replaceChildren();
    if (!memories.length) {
        const li = document.createElement('li');
        li.appendChild(emptyState('Aún no hay recuerdos guardados. ¿Cuál fue el primero?', 'memory', 'Agregar recuerdo'));
        tl.appendChild(li);
        return;
    }
    memories.forEach((m, i) => {
        const li = el('li', `moment${animate ? ' reveal' : ''}`);
        if (animate) li.style.setProperty('--delay', `${Math.min(i * 80, 400)}ms`);
        li.appendChild(el('p', 'moment-date', m.date || 'Sin fecha'));
        const icon = el('span', 'moment-icon', m.emoji || '✨');
        icon.setAttribute('aria-hidden', 'true');
        li.appendChild(icon);

        const body = el('div', 'moment-body');
        body.appendChild(el('h3', 'moment-title', m.title || ''));
        if (m.text) body.appendChild(el('p', 'moment-text', m.text));
        const foot = el('div', 'moment-foot');
        foot.appendChild(itemTools('memory', i, m.title || `Recuerdo ${i + 1}`));
        body.appendChild(foot);
        li.appendChild(body);
        tl.appendChild(li);
    });
    if (animate) observeReveal();
}

/* ================================================
   💬  FRASES
   ================================================ */
function renderPhrases({ animate = false } = {}) {
    const grid = $('phrasesGrid');
    grid.replaceChildren();
    if (!phrases.length) {
        const li = document.createElement('li');
        li.appendChild(emptyState('Aún no hay frases. Escribe algo que se digan seguido.', 'phrase', 'Agregar frase'));
        grid.appendChild(li);
        return;
    }
    phrases.forEach((ph, i) => {
        const li = el('li', `phrase${animate ? ' reveal' : ''}`);
        if (animate) li.style.setProperty('--delay', `${Math.min(i * 80, 400)}ms`);
        const quote = el('blockquote');
        const mark = el('span', 'phrase-quote', '“');
        mark.setAttribute('aria-hidden', 'true');
        quote.appendChild(mark);
        quote.appendChild(el('p', 'phrase-text', ph.text || ''));
        li.appendChild(quote);

        const foot = el('div', 'phrase-foot');
        foot.appendChild(el('p', 'phrase-author', ph.author ? `— ${ph.author}` : ''));
        const preview = (ph.text || '').slice(0, 40) + ((ph.text || '').length > 40 ? '…' : '');
        foot.appendChild(itemTools('phrase', i, `frase “${preview}”`));
        li.appendChild(foot);
        grid.appendChild(li);
    });
    if (animate) observeReveal();
}

/* ================================================
   💌  CARTA
   ================================================ */
function renderLetter() {
    $('letterText').textContent = CONFIG.letterText;
    $('letterSign').textContent = CONFIG.letterSign;

    const letter = $('letter');
    const openBtn = $('letterOpen');
    const sheet = $('letterSheet');
    const setOpen = open => {
        letter.dataset.open = String(open);
        sheet.hidden = !open;
        openBtn.setAttribute('aria-expanded', String(open));
        if (open) {
            sheet.setAttribute('tabindex', '-1');
            sheet.focus({ preventScroll: true });
            sheet.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        } else {
            openBtn.focus();
        }
    };
    openBtn.addEventListener('click', () => setOpen(true));
    $('letterClose').addEventListener('click', () => setOpen(false));
}

/* ================================================
   🪟  EDITOR (agregar / editar)
   ================================================ */
let editorState = { type: '', index: -1, pendingUpload: '' };

function field({ id, label, optional = false, help = '', counter = 0, control }) {
    const wrap = el('div', 'field');
    wrap.dataset.field = id;
    const row = el('div', 'field-row');
    const lab = el('label', 'field-label', label);
    lab.htmlFor = id;
    if (optional) lab.appendChild(el('span', 'opt', ' (opcional)'));
    row.appendChild(lab);
    const count = counter ? el('span', 'field-count') : null;
    if (count) {
        count.setAttribute('aria-hidden', 'true');
        row.appendChild(count);
    }
    wrap.appendChild(row);
    wrap.appendChild(control);
    const describedBy = [];
    if (help) {
        const h = el('p', 'field-help', help);
        h.id = `${id}-help`;
        describedBy.push(h.id);
        wrap.appendChild(h);
    }
    const err = el('p', 'field-error');
    err.id = `${id}-error`;
    describedBy.push(err.id);
    wrap.appendChild(err);
    control.setAttribute('aria-describedby', describedBy.join(' '));
    if (count) {
        const update = () => { count.textContent = `${control.value.length}/${counter}`; };
        control.maxLength = counter;
        control.addEventListener('input', update);
        update();
    }
    control.addEventListener('input', () => setFieldError(id, ''));
    return wrap;
}

function input(id, { type = 'text', value = '', placeholder = '', multiline = false, required = false, list = '' } = {}) {
    const node = document.createElement(multiline ? 'textarea' : 'input');
    node.className = 'input';
    node.id = id;
    node.name = id;
    if (!multiline) node.type = type;
    if (placeholder) node.placeholder = placeholder;
    if (required) node.setAttribute('aria-required', 'true');
    if (list) node.setAttribute('list', list);
    node.value = value;
    return node;
}

function setFieldError(id, message) {
    const wrap = document.querySelector(`[data-field="${id}"]`);
    const control = $(id);
    if (!wrap) return;
    wrap.classList.toggle('has-error', !!message);
    const err = $(`${id}-error`);
    if (err) err.textContent = message;
    if (control) {
        if (message) control.setAttribute('aria-invalid', 'true');
        else control.removeAttribute('aria-invalid');
    }
}

function todayLabel() {
    const now = getTimeZoneParts(new Date(), RELATION_START.timeZone);
    return MONTH_LONG.format(new Date(Date.UTC(now.year, now.month - 1, now.day)));
}

function buildPhotoForm(body, data) {
    const isUpload = !!data.src && data.src.startsWith('data:');
    const switcher = el('div', 'source-switch');
    switcher.setAttribute('role', 'radiogroup');
    switcher.setAttribute('aria-label', 'De dónde viene la foto');
    [['upload', 'Subir desde el dispositivo'], ['link', 'Pegar un enlace']].forEach(([value, text]) => {
        const lab = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'photoSource';
        radio.value = value;
        radio.checked = value === (data.src && !isUpload ? 'link' : 'upload');
        lab.append(radio, document.createTextNode(text));
        switcher.appendChild(lab);
    });
    body.appendChild(switcher);

    // Subida
    const drop = el('label', 'file-drop');
    drop.htmlFor = 'inp-file';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'inp-file';
    fileInput.accept = 'image/*';
    fileInput.setAttribute('aria-describedby', 'inp-file-error');
    drop.append(fileInput, el('strong', '', 'Elegir una foto'), el('span', '', 'JPG, PNG o WEBP. La reducimos para que ocupe poco espacio.'));
    const uploadWrap = el('div', 'field');
    uploadWrap.dataset.field = 'inp-file';
    const fileErr = el('p', 'field-error');
    fileErr.id = 'inp-file-error';
    uploadWrap.append(drop, fileErr);

    // Enlace
    const linkField = field({
        id: 'inp-src',
        label: 'Enlace de la imagen',
        help: 'Funciona con Google Drive: en “Compartir”, elige “Cualquier persona con el enlace” y copia el enlace.',
        control: input('inp-src', { type: 'url', value: isUpload ? '' : (data.src || ''), placeholder: 'https://drive.google.com/…' }),
    });

    const preview = el('div', 'preview');
    preview.setAttribute('aria-live', 'polite');

    const syncSource = () => {
        const mode = body.querySelector('input[name="photoSource"]:checked')?.value || 'upload';
        uploadWrap.hidden = mode !== 'upload';
        linkField.hidden = mode !== 'link';
        updatePreview();
    };

    const showPreview = (src, emptyText) => {
        preview.replaceChildren();
        if (!src) {
            preview.appendChild(el('p', '', emptyText));
            return;
        }
        const img = document.createElement('img');
        img.alt = 'Vista previa';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', () => {
            preview.replaceChildren(el('p', '', 'No pudimos ver esa imagen. Revisa que el enlace sea público y apunte a una foto.'));
        }, { once: true });
        img.src = src;
        preview.appendChild(img);
    };

    const updatePreview = () => {
        const mode = body.querySelector('input[name="photoSource"]:checked')?.value || 'upload';
        if (mode === 'upload') {
            showPreview(editorState.pendingUpload, 'Aquí verás la foto que elijas.');
        } else {
            const raw = $('inp-src').value.trim();
            showPreview(raw ? sanitizeImageUrl(raw) : '', raw ? 'Ese enlace no parece válido. Debe empezar con https://' : 'Pega un enlace para ver la vista previa.');
        }
    };

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        setFieldError('inp-file', '');
        preview.replaceChildren(el('p', '', 'Preparando la foto…'));
        try {
            editorState.pendingUpload = await compressImage(file);
            updatePreview();
        } catch {
            editorState.pendingUpload = '';
            setFieldError('inp-file', 'No pudimos leer ese archivo. Prueba con otra foto en JPG o PNG.');
            updatePreview();
        }
    });
    ['dragenter', 'dragover'].forEach(evt => drop.addEventListener(evt, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(evt => drop.addEventListener(evt, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer?.files?.length) {
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });

    let previewTimer = null;
    linkField.querySelector('input').addEventListener('input', () => {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(updatePreview, 350);
    });
    switcher.addEventListener('change', syncSource);

    if (isUpload) editorState.pendingUpload = data.src;
    body.append(uploadWrap, linkField, preview);
    body.appendChild(field({
        id: 'inp-caption',
        label: 'Descripción',
        counter: 180,
        control: input('inp-caption', { value: data.caption || '', placeholder: 'Ej.: Nuestra primera salida al cine', required: true }),
    }));
    syncSource();
}

function buildMemoryForm(body, data) {
    const dateField = field({
        id: 'inp-date',
        label: 'Fecha',
        optional: true,
        counter: 60,
        control: input('inp-date', { value: data.date || '', placeholder: 'Ej.: 14 de febrero de 2026' }),
    });
    const today = el('button', 'inline-link', 'Usar la fecha de hoy');
    today.type = 'button';
    today.addEventListener('click', () => {
        $('inp-date').value = todayLabel();
        $('inp-date').dispatchEvent(new Event('input'));
    });
    dateField.insertBefore(today, dateField.querySelector('.field-error'));
    body.appendChild(dateField);

    const current = data.emoji || MEMORY_EMOJIS[0];
    const options = MEMORY_EMOJIS.includes(current) ? MEMORY_EMOJIS : [current, ...MEMORY_EMOJIS];
    const set = el('fieldset', 'emoji-pick');
    set.appendChild(el('legend', '', 'Ícono'));
    options.forEach(emoji => {
        const lab = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'memoryEmoji';
        radio.value = emoji;
        radio.checked = emoji === current;
        radio.setAttribute('aria-label', emoji);
        lab.append(radio, el('span', '', emoji));
        set.appendChild(lab);
    });
    body.appendChild(set);

    body.appendChild(field({
        id: 'inp-title',
        label: 'Título',
        counter: 120,
        control: input('inp-title', { value: data.title || '', placeholder: 'Ej.: El día que nos conocimos', required: true }),
    }));
    body.appendChild(field({
        id: 'inp-text',
        label: '¿Qué pasó?',
        optional: true,
        counter: 500,
        control: input('inp-text', { value: data.text || '', placeholder: 'Cuéntalo como lo recuerdas…', multiline: true }),
    }));
}

function buildPhraseForm(body, data) {
    body.appendChild(field({
        id: 'inp-phrase',
        label: 'Frase',
        counter: 320,
        control: input('inp-phrase', { value: data.text || '', placeholder: 'Algo que se digan seguido…', multiline: true, required: true }),
    }));
    const authors = document.createElement('datalist');
    authors.id = 'authorOptions';
    [CONFIG.partnerName, CONFIG.yourName, `${CONFIG.partnerName} y Elian`].forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        authors.appendChild(opt);
    });
    body.appendChild(authors);
    body.appendChild(field({
        id: 'inp-phraseAuthor',
        label: '¿Quién la dijo?',
        optional: true,
        counter: 80,
        control: input('inp-phraseAuthor', { value: data.author ?? CONFIG.yourName ?? '', list: 'authorOptions' }),
    }));
}

const EDITOR_TITLES = {
    photo:  ['Agregar foto', 'Editar foto'],
    memory: ['Agregar recuerdo', 'Editar recuerdo'],
    phrase: ['Agregar frase', 'Editar frase'],
};

let editorOpener = null;
function openEditor(type, index = -1) {
    const dialog = $('editor');
    const body = $('editorBody');
    const col = COLLECTIONS[type];
    if (!col || !dialog) return;
    const isEdit = index >= 0;
    const data = isEdit ? { ...col.get()[index] } : {};
    editorState = { type, index, pendingUpload: '' };
    editorOpener = document.activeElement;

    $('editorTitle').textContent = EDITOR_TITLES[type][isEdit ? 1 : 0];
    $('editorSave').textContent = isEdit ? 'Guardar cambios' : 'Guardar';
    body.replaceChildren();
    if (type === 'photo') buildPhotoForm(body, data);
    if (type === 'memory') buildMemoryForm(body, data);
    if (type === 'phrase') buildPhraseForm(body, data);

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const first = body.querySelector('input:not([type="radio"]):not([type="file"]):not([hidden]), textarea');
    if (type !== 'photo' && first) first.focus();
}

function closeEditor() {
    const dialog = $('editor');
    if (dialog.open) dialog.close();
}

function validateAndCollect() {
    const { type } = editorState;
    let firstInvalid = null;
    const fail = (id, message) => {
        setFieldError(id, message);
        if (!firstInvalid) firstInvalid = $(id);
    };

    if (type === 'photo') {
        const mode = document.querySelector('input[name="photoSource"]:checked')?.value || 'upload';
        let src = '';
        if (mode === 'upload') {
            src = editorState.pendingUpload;
            if (!src) fail('inp-file', 'Elige una foto para continuar.');
        } else {
            const raw = $('inp-src').value.trim();
            src = sanitizeImageUrl(raw);
            if (!raw) fail('inp-src', 'Pega el enlace de la foto.');
            else if (!src) fail('inp-src', 'El enlace debe empezar con https://');
        }
        const caption = $('inp-caption').value.trim();
        if (!caption) fail('inp-caption', 'Escribe una descripción corta.');
        return firstInvalid ? { firstInvalid } : { record: sanitizePhotoRecord({ src, caption }) };
    }

    if (type === 'memory') {
        const title = $('inp-title').value.trim();
        if (!title) fail('inp-title', 'Ponle un título al recuerdo.');
        const emoji = document.querySelector('input[name="memoryEmoji"]:checked')?.value || '💫';
        return firstInvalid ? { firstInvalid } : {
            record: sanitizeMemoryRecord({ date: $('inp-date').value, emoji, title, text: $('inp-text').value }),
        };
    }

    const text = $('inp-phrase').value.trim();
    if (!text) fail('inp-phrase', 'Escribe la frase que quieres guardar.');
    return firstInvalid ? { firstInvalid } : {
        record: sanitizePhraseRecord({ text, author: $('inp-phraseAuthor').value }),
    };
}

function saveEditor(e) {
    e.preventDefault();
    const { type, index } = editorState;
    const col = COLLECTIONS[type];
    if (!col) return;
    const result = validateAndCollect();
    if (result.firstInvalid) {
        result.firstInvalid.focus();
        return;
    }

    const previous = col.get();
    const next = previous.slice();
    if (index >= 0) next[index] = result.record;
    else next.push(result.record);

    if (!persistArray(col.key, next)) return;
    col.set(next);
    col.render();
    closeEditor();

    const isEdit = index >= 0;
    const msg = {
        photo:  isEdit ? 'Foto actualizada.' : 'Foto agregada.',
        memory: isEdit ? 'Recuerdo actualizado.' : 'Recuerdo guardado.',
        phrase: isEdit ? 'Frase actualizada.' : 'Frase guardada.',
    }[type];
    showToast(msg, isEdit ? {
        actionLabel: 'Deshacer',
        onAction: () => {
            col.set(previous);
            persistArray(col.key, previous);
            col.render();
            showToast('Cambios deshechos.');
        },
    } : {});

    if (!isEdit) {
        const listId = { photo: 'galleryGrid', memory: 'timeline', phrase: 'phrasesGrid' }[type];
        const last = $(listId)?.lastElementChild;
        if (last) last.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('NOT_IMAGE'));
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, UPLOAD_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
            const w = Math.max(1, Math.round(img.naturalWidth * scale));
            const h = Math.max(1, Math.round(img.naturalHeight * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', UPLOAD_QUALITY));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('DECODE_FAIL'));
        };
        img.src = url;
    });
}

/* ================================================
   🔍  LIGHTBOX
   ================================================ */
let lbIndex = 0;
let lbOpener = null;
let lbSwiped = false;

function lbPhotos() {
    return photos.map((p, i) => ({ ...p, i, safe: sanitizeImageUrl(p.src) })).filter(p => p.safe);
}

function lbShow(position) {
    const list = lbPhotos();
    if (!list.length) return;
    lbIndex = (position + list.length) % list.length;
    const item = list[lbIndex];
    const img = $('lbImg');
    img.src = item.safe;
    img.alt = item.caption || '';
    $('lbCaption').textContent = item.caption || '';
    $('lbCount').textContent = `${lbIndex + 1} de ${list.length}`;
    const single = list.length < 2;
    $('lbPrev').hidden = single;
    $('lbNext').hidden = single;
}

function openLightbox(photoIndex, opener) {
    const list = lbPhotos();
    const pos = list.findIndex(p => p.i === photoIndex);
    if (pos < 0) return;
    lbOpener = opener || document.activeElement;
    lbShow(pos);
    const dialog = $('lightbox');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    $('lbClose').focus();
}

function closeLightbox() {
    const dialog = $('lightbox');
    if (dialog.open) dialog.close();
}

function bindLightbox() {
    const dialog = $('lightbox');
    $('lbClose').addEventListener('click', closeLightbox);
    $('lbPrev').addEventListener('click', () => lbShow(lbIndex - 1));
    $('lbNext').addEventListener('click', () => lbShow(lbIndex + 1));
    dialog.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); lbShow(lbIndex - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lbIndex + 1); }
    });
    dialog.addEventListener('click', e => {
        if (lbSwiped) {
            lbSwiped = false;
            return;
        }
        if (e.target === dialog || e.target === $('lbFigure')) closeLightbox();
    });
    dialog.addEventListener('close', () => {
        if (lbOpener && document.contains(lbOpener)) lbOpener.focus();
    });

    // Deslizar para cambiar de foto en pantallas táctiles.
    let startX = 0;
    let startY = 0;
    const figure = $('lbFigure');
    figure.addEventListener('pointerdown', e => { startX = e.clientX; startY = e.clientY; });
    figure.addEventListener('pointerup', e => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            lbSwiped = true;
            lbShow(lbIndex + (dx < 0 ? 1 : -1));
        }
    });
}

/* ================================================
   🔔  AVISOS
   ================================================ */
let toastTimer = null;
function showToast(message, { kind = 'info', actionLabel = '', onAction = null } = {}) {
    const toast = $('toast');
    if (!toast) return;
    const action = $('toastAction');
    $('toastMsg').textContent = message;
    toast.classList.toggle('is-warn', kind === 'warn');
    if (actionLabel && onAction) {
        action.textContent = actionLabel;
        action.hidden = false;
        action.onclick = () => {
            hideToast();
            onAction();
        };
    } else {
        action.hidden = true;
        action.onclick = null;
    }
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, actionLabel ? 7000 : (kind === 'warn' ? 6000 : 3500));
}

function hideToast() {
    $('toast')?.classList.remove('is-visible');
}

let globalErrorsBound = false;
function bindGlobalErrorHandlers() {
    if (globalErrorsBound) return;
    globalErrorsBound = true;
    window.addEventListener('error', event => {
        if (event?.message) {
            showToast('Algo falló al cargar la página. Recárgala para intentarlo de nuevo.', { kind: 'warn' });
        }
    });
    window.addEventListener('unhandledrejection', () => {
        showToast('No se pudo completar la acción. Inténtalo de nuevo.', { kind: 'warn' });
    });
}

/* ================================================
   💾  RESPALDO
   ================================================ */
function exportBackupData() {
    const payload = {
        version: 1,
        exported_at: new Date().toISOString(),
        data: {
            photos,
            memories,
            phrases,
        },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amorcito-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Respaldo descargado. Guárdalo en un lugar seguro.');
}

async function importBackupData(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const incoming = parsed?.data || {};
        if (!Array.isArray(incoming.photos) && !Array.isArray(incoming.memories) && !Array.isArray(incoming.phrases)) {
            throw new Error('EMPTY_BACKUP');
        }
        const before = { photos, memories, phrases };
        const nextPhotos = Array.isArray(incoming.photos) ? normalizePhotosForDrive(incoming.photos).map(sanitizePhotoRecord) : photos;
        const nextMemories = Array.isArray(incoming.memories) ? incoming.memories.map(sanitizeMemoryRecord) : memories;
        const nextPhrases = Array.isArray(incoming.phrases) ? incoming.phrases.map(sanitizePhraseRecord) : phrases;

        const apply = state => {
            photos = state.photos;
            memories = state.memories;
            phrases = state.phrases;
            persistArray(STORAGE_KEYS.photos, photos);
            persistArray(STORAGE_KEYS.memories, memories);
            persistArray(STORAGE_KEYS.phrases, phrases);
            renderGallery();
            renderTimeline();
            renderPhrases();
        };
        apply({ photos: nextPhotos, memories: nextMemories, phrases: nextPhrases });
        showToast(`Respaldo cargado: ${nextPhotos.length} fotos, ${nextMemories.length} recuerdos y ${nextPhrases.length} frases.`, {
            actionLabel: 'Deshacer',
            onAction: () => {
                apply(before);
                showToast('Se restauró lo que tenías antes.');
            },
        });
    } catch {
        showToast('Ese archivo no es un respaldo de esta página. Elige el .json que descargaste con “Descargar respaldo”.', { kind: 'warn' });
    } finally {
        if (event?.target) event.target.value = '';
    }
}

/* ================================================
   👁️  SCROLL REVEAL
   ================================================ */
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let revealObserver = null;
function observeReveal() {
    const pending = document.querySelectorAll('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
        pending.forEach(node => node.classList.add('is-in'));
        return;
    }
    if (!revealObserver) {
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    pending.forEach(node => revealObserver.observe(node));
}

/* ================================================
   📐  NAV
   ================================================ */
function setMenu(open) {
    $('navLinks').classList.toggle('is-open', open);
    $('menuToggle').setAttribute('aria-expanded', String(open));
}

function bindNavigation() {
    const navLinks = $('navLinks');
    const toggle = $('menuToggle');
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => {
        if (toggle.getAttribute('aria-expanded') !== 'true') return;
        if (!navLinks.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setMenu(false);
            toggle.focus();
        }
    });

    // Marca en el menú la sección que se está viendo.
    if (!('IntersectionObserver' in window)) return;
    const links = new Map(Array.from(navLinks.querySelectorAll('a')).map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(a => a.removeAttribute('aria-current'));
            links.get(entry.target.id)?.setAttribute('aria-current', 'true');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'fotos', 'historia', 'frases', 'carta'].forEach(id => { const s = $(id); if (s) spy.observe(s); });
}

function bindUiActions() {
    document.querySelectorAll('[data-add]').forEach(btn => {
        btn.addEventListener('click', () => openEditor(btn.dataset.add));
    });

    const editor = $('editor');
    $('editorForm').addEventListener('submit', saveEditor);
    editor.querySelectorAll('[data-close-editor]').forEach(btn => btn.addEventListener('click', closeEditor));
    editor.addEventListener('click', e => { if (e.target === editor) closeEditor(); });
    editor.addEventListener('close', () => {
        editorState.pendingUpload = '';
        if (editorOpener && document.contains(editorOpener)) editorOpener.focus();
    });

    $('btnExportBackup').addEventListener('click', exportBackupData);
    const importInput = $('importBackupInput');
    $('btnImportBackup').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', importBackupData);

    bindLightbox();
}

let scrollFxTicking = false;
function applyScrollEffects() {
    $('topbar').classList.toggle('is-scrolled', window.scrollY > 8);
}
window.addEventListener('scroll', () => {
    if (scrollFxTicking) return;
    scrollFxTicking = true;
    requestAnimationFrame(() => {
        applyScrollEffects();
        scrollFxTicking = false;
    });
}, { passive: true });

/* ================================================
   🚀  INIT
   ================================================ */
function start() {
    if (!RELEASE_READY) return;
    bindGlobalErrorHandlers();
    initTheme();
    bindNavigation();
    bindUiActions();
    startCounterTicker();
    renderGallery({ animate: true });
    renderTimeline({ animate: true });
    renderPhrases({ animate: true });
    renderLetter();
    applyScrollEffects();
    mpInit();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
