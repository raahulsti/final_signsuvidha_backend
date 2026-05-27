const db = require('../config/db');

const getAll = ({ activeOnly = false } = {}) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  return db.execute(`SELECT id, name, code, sort_order, is_active FROM states ${where} ORDER BY sort_order ASC, name ASC`);
};

const getById = (id) =>
  db.findOne('SELECT id, name, code, sort_order, is_active FROM states WHERE id = ?', [id]);

const getActiveById = (id) =>
  db.findOne('SELECT id, name, code, sort_order, is_active FROM states WHERE id = ? AND is_active = 1', [id]);

const create = ({ name, code, sort_order, is_active }) =>
  db.execute(
    'INSERT INTO states (name, code, sort_order, is_active) VALUES (?, ?, ?, ?)',
    [name, code.toUpperCase(), sort_order ?? 0, is_active ?? 1]
  );

const update = (id, { name, code, sort_order, is_active }) =>
  db.execute(
    `UPDATE states SET
       name = COALESCE(?, name),
       code = COALESCE(?, code),
       sort_order = COALESCE(?, sort_order),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [
      name ?? null,
      code ? code.toUpperCase() : null,
      sort_order ?? null,
      is_active ?? null,
      id,
    ]
  );

const remove = (id) => db.execute('DELETE FROM states WHERE id = ?', [id]);

module.exports = { getAll, getById, getActiveById, create, update, remove };
