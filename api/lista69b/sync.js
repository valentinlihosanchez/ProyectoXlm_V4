import sql from '../../lib/db.js';

// Stub — implementación completa en siguiente paso (lib/parse-sat.js)
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  res.json({ message: 'Sync pendiente de implementar — próxima sesión' });
}
