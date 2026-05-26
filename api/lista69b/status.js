import sql from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const [last] = await sql`
    SELECT synced_at, records_count FROM lista_69b_sync
    ORDER BY synced_at DESC LIMIT 1
  `;

  res.json({
    lastSync: last?.synced_at || null,
    recordsCount: last?.records_count || 0,
  });
}
