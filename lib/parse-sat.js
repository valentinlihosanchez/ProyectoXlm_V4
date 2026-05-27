const https = require('https');
const XLSX = require('xlsx');

// URLs oficiales de listas 69B del SAT
const LISTA_69B_URLS = [
  // EFOs (Empresas Facturadoras de Operaciones Simuladas)
  'https://www.sat.gob.mx/sitio_internet/cgi-bin/plsql/xml/publico/pub_xml.xsql?id_publico=240',
  // EDOs (Empresas que Deducen Operaciones Simuladas)
  'https://www.sat.gob.mx/sitio_internet/cgi-bin/plsql/xml/publico/pub_xml.xsql?id_publico=239',
];

/**
 * Descarga un archivo Excel desde una URL
 */
async function downloadExcel(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parsea un buffer Excel y extrae RFC, tipo, situacion
 * Retorna array de { rfc, tipo, situacion }
 */
function parseExcelBuffer(buffer, tipoLista) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Usar la primera hoja disponible
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Normalizar tipos
  const tipo = tipoLista === 'EFO' ? 'EFO' : 'EDOS';

  // Detectar columna de RFC (usualmente es la primera o segunda)
  // Las listas SAT varían en estructura, así que buscamos patrones
  const records = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    let rfc = null;

    // Buscar RFC: debe tener 12 o 13 caracteres, sin espacios extras
    for (let j = 0; j < Math.min(row.length, 5); j++) {
      const cell = String(row[j]).trim().toUpperCase();
      if (/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(cell)) {
        rfc = cell;
        break;
      }
    }

    if (!rfc) continue;

    // Extraer situación (si existe, suele estar en segunda columna)
    const situacion = row.length > 1 ? String(row[1]).trim() : '';

    records.push({
      rfc,
      tipo,
      situacion: situacion || null,
    });
  }

  return records;
}

/**
 * Descarga y parsea todas las listas 69B disponibles
 * Retorna array combinado de { rfc, tipo, situacion }
 */
async function downloadAndParseLista69B() {
  const allRecords = [];

  const tiposLista = ['EFO', 'EDOS'];

  for (let i = 0; i < LISTA_69B_URLS.length; i++) {
    const url = LISTA_69B_URLS[i];
    const tipo = tiposLista[i];

    try {
      console.log(`[parse-sat] Descargando ${tipo} desde ${url.slice(0, 50)}...`);
      const buffer = await downloadExcel(url);

      const records = parseExcelBuffer(buffer, tipo);
      console.log(`[parse-sat] ${tipo}: ${records.length} registros extraídos`);

      allRecords.push(...records);
    } catch (error) {
      console.error(`[parse-sat] Error descargando ${tipo}:`, error.message);
      // Continuar con la siguiente lista si falla una
    }
  }

  return allRecords;
}

module.exports = { downloadAndParseLista69B };
