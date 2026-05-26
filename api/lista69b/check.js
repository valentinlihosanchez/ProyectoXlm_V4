import sql from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { rfc } = req.query;
  if (!rfc) return res.status(400).json({ error: 'rfc es requerido' });

  const [row] = await sql`
    SELECT rfc, tipo, situacion FROM lista_69b WHERE rfc = ${rfc.toUpperCase()}
  `;

  const [last] = await sql`
    SELECT synced_at FROM lista_69b_sync ORDER BY synced_at DESC LIMIT 1
  `;

  res.json({
    found: !!row,
    data: row || null,
    lastSync: last?.synced_at || null,
  });
}
