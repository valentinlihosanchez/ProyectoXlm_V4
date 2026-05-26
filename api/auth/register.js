const bcrypt = require('bcryptjs');
const pool = require('../../lib/db');
const { signToken } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, nombre } = req.body;
  if (!email || !password || !nombre)
    return res.status(400).json({ error: 'email, password y nombre son requeridos' });

  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE email = $1', [email.toLowerCase()]
  );
  if (existing.length > 0)
    return res.status(409).json({ error: 'Este correo ya está registrado' });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, nombre) VALUES ($1, $2, $3) RETURNING id, email, nombre',
    [email.toLowerCase(), hash, nombre]
  );

  const token = signToken({ id: rows[0].id, email: rows[0].email });
  res.status(201).json({ token, user: rows[0] });
};
