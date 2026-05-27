const https = require('https');
const http = require('http');

// Fuente oficial: https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html
// Un único CSV con todos los contribuyentes 69-B y su situación
const CSV_URL =
  process.env.SAT_URL_69B ||
  'https://wu1agsprosta001.blob.core.windows.net/agsc-publicaciones/Datos_abiertos/Documents_AGAFF/Listado_completo_69-B.csv';

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

/**
 * Descarga un archivo de texto desde una URL, siguiendo redirects.
 * Retorna Buffer con el contenido.
 */
function downloadFile(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Demasiados redirects'));

    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 60000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return downloadFile(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} al descargar lista SAT`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout al descargar lista SAT'));
    });
  });
}

/**
 * Parsea una línea CSV respetando campos entre comillas.
 * Maneja comas dentro de campos con comillas dobles.
 */
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parsea el CSV del SAT y retorna array de { rfc, tipo, situacion }.
 * Columnas esperadas: No, RFC, Nombre del Contribuyente, Situación del contribuyente, ...
 */
function parseCsvBuffer(buffer) {
  // El SAT usa Windows-1252 / latin-1. Intentamos UTF-8 y si hay problemas, latin-1.
  const text = buffer.toString('latin1');
  const lines = text.split(/\r?\n/);

  if (lines.length < 2) return [];

  // Detectar índices de columna desde el encabezado
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rfcIdx = headers.findIndex((h) => h === 'rfc');
  const sitIdx = headers.findIndex((h) => h.includes('situaci'));

  if (rfcIdx === -1) {
    console.warn('[parse-sat] No se encontró columna RFC en el CSV');
    return [];
  }

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCsvLine(line);
    const rfc = (fields[rfcIdx] || '').trim().toUpperCase();

    if (!RFC_REGEX.test(rfc)) continue;

    const situacion = sitIdx !== -1 ? (fields[sitIdx] || '').trim() : null;

    records.push({
      rfc,
      tipo: 'EFO',
      situacion: situacion || null,
    });
  }

  return records;
}

/**
 * Descarga y parsea la lista 69-B completa del SAT.
 * Retorna array de { rfc, tipo, situacion }.
 */
async function downloadAndParseLista69B() {
  console.log('[parse-sat] Descargando lista 69-B del SAT...');

  const buffer = await downloadFile(CSV_URL);
  console.log(`[parse-sat] Descargado: ${(buffer.length / 1024).toFixed(0)} KB`);

  const records = parseCsvBuffer(buffer);
  console.log(`[parse-sat] Registros extraídos: ${records.length}`);

  if (records.length === 0) {
    throw new Error('CSV descargado pero no se extrajeron registros — verificar formato o URL');
  }

  return records;
}

module.exports = { downloadAndParseLista69B };
