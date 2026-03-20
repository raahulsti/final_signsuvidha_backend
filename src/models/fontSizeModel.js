const db = require('../config/db');

const getAll  = () => db.execute('SELECT * FROM font_sizes WHERE is_active = 1 ORDER BY size_value ASC');
const getById = (id) => db.findOne('SELECT * FROM font_sizes WHERE id = ?', [id]);
const create  = ({ size_value, label }) =>
  db.execute('INSERT INTO font_sizes (size_value, label) VALUES (?, ?)', [size_value, label || null]);
const update  = (id, { size_value, label, is_active }) =>
  db.execute('UPDATE font_sizes SET size_value = COALESCE(?, size_value), label = COALESCE(?, label), is_active = COALESCE(?, is_active) WHERE id = ?',
    [size_value ?? null, label ?? null, is_active ?? null, id]);
const remove  = (id) => db.execute('DELETE FROM font_sizes WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
