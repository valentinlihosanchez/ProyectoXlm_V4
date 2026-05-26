const pool = require('../../lib/db');

// Stub — implementación completa pendiente (lib/parse-sat.js)
module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();
  res.json({ message: 'Sync pendiente de implementar' });
};
