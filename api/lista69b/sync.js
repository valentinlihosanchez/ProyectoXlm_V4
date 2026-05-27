const pool = require('../../lib/db');
const { downloadAndParseLista69B } = require('../../lib/parse-sat');
const { requireAuth } = require('../../lib/auth');

async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  try {
    // Solo admins o cron automático (Vercel cron no envía auth, lo permitimos)
    const user = requireAuth(req);
    const isManualSync = !!user;

    console.log(`[sync] Iniciando sincronización${isManualSync ? ' manual' : ' automática (cron)'}...`);

    // Descargar y parsear listas del SAT
    const records = await downloadAndParseLista69B();
    if (records.length === 0) {
      return res.status(400).json({ error: 'No se extrajeron registros de las listas SAT' });
    }

    // Upsert en batches de 1000 para evitar el límite de 65535 parámetros de PostgreSQL
    const BATCH_SIZE = 1000;
    for (let offset = 0; offset < records.length; offset += BATCH_SIZE) {
      const batch = records.slice(offset, offset + BATCH_SIZE);
      const placeholders = batch
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(',');
      const flatValues = batch.flatMap((r) => [r.rfc, r.tipo, r.situacion || null]);

      await pool.query(
        `INSERT INTO lista_69b (rfc, tipo, situacion) VALUES ${placeholders}
         ON CONFLICT (rfc) DO UPDATE SET tipo = EXCLUDED.tipo, situacion = EXCLUDED.situacion`,
        flatValues
      );
    }
    console.log(`[sync] ${records.length} registros insertados/actualizados`);

    // Registrar el sync
    const syncResult = await pool.query(
      `INSERT INTO lista_69b_sync (records_count, synced_by)
       VALUES ($1, $2)
       RETURNING id, synced_at, records_count`,
      [records.length, user?.id || null]
    );

    const syncRecord = syncResult.rows[0];

    res.json({
      success: true,
      message: `Sincronización completada: ${records.length} registros`,
      sync: {
        id: syncRecord.id,
        synced_at: syncRecord.synced_at,
        records_count: syncRecord.records_count,
        synced_by: user?.id || 'sistema',
      },
    });
  } catch (error) {
    console.error('[sync] Error durante sincronización:', error);
    res.status(500).json({
      error: 'Error durante sincronización',
      details: error.message,
    });
  }
}

handler.config = { maxDuration: 300 };
module.exports = handler;
