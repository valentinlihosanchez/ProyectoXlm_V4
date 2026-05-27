const https = require('https');
const http = require('http');
const XLSX = require('xlsx');

// URLs publicadas en:
// https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html
// IMPORTANTE: El SAT actualiza estas URLs periódicamente. Si fallan, actualizar aquí.
const LISTAS_69B = [
  {
    tipo: 'EFO',
    url: process.env.SAT_URL_EFO ||
      'https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461173671557&ssbinary=true',
  },
  {
    tipo: 'EDOS',
    url: process.env.SAT_URL_EDOS ||
      'https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461173671558&ssbinary=true',
  },
];

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

/**
 * Descarga un archivo Excel desde una URL, siguiendo redirects.
 */
function downloadExcel(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Demasiados redirects'));

    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 30000 }, (res) => {
      // Seguir redirect
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return downloadExcel(res.headers.location, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} al descargar lista SAT`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout al descargar lista SAT')));
  });
}

/**
 * Detecta el índice de columna del RFC buscando la primera fila que tenga un RFC válido.
 * Retorna el índice de columna o -1 si no se encuentra.
 */
function detectRfcColumn(data) {
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row) continue;
    for (let j = 0; j < Math.min(row.length, 8); j++) {
      if (RFC_REGEX.test(String(row[j]).trim().toUpperCase())) return j;
    }
  }
  return -1;
}

/**
 * Parsea un buffer Excel del SAT y extrae registros { rfc, tipo, situacion }.
 */
function parseExcelBuffer(buffer, tipo) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  if (!data.length) return [];

  const rfcCol = detectRfcColumn(data);
  if (rfcCol === -1) {
    console.warn(`[parse-sat] ${tipo}: no se detectó columna de RFC`);
    return [];
  }

  // Columna de situación: la siguiente a RFC, si existe
  const sitCol = rfcCol + 1;
  const records = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const rfc = String(row[rfcCol] ?? '').trim().toUpperCase();
    if (!RFC_REGEX.test(rfc)) continue;

    const situacion = sitCol < row.length ? String(row[sitCol] ?? '').trim() : null;

    records.push({ rfc, tipo, situacion: situacion || null });
  }

  return records;
}

/**
 * Descarga y parsea todas las listas 69B del SAT.
 * Retorna array combinado de { rfc, tipo, situacion }.
 */
async function downloadAndParseLista69B() {
  const allRecords = [];

  for (const { tipo, url } of LISTAS_69B) {
    try {
      console.log(`[parse-sat] Descargando ${tipo}...`);
      const buffer = await downloadExcel(url);
      const records = parseExcelBuffer(buffer, tipo);
      console.log(`[parse-sat] ${tipo}: ${records.length} registros`);
      allRecords.push(...records);
    } catch (err) {
      console.error(`[parse-sat] Error en ${tipo}: ${err.message}`);
    }
  }

  return allRecords;
}

module.exports = { downloadAndParseLista69B };
