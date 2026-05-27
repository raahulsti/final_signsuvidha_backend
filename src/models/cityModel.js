const db = require('../config/db');

const getAll = ({ stateId, activeOnly = false } = {}) => {
  const clauses = [];
  const params = [];
  if (stateId) {
    clauses.push('c.state_id = ?');
    params.push(stateId);
  }
  if (activeOnly) clauses.push('c.is_active = 1');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.execute(
    `SELECT c.id, c.state_id, c.name, c.sort_order, c.is_active, s.name AS state_name, s.code AS state_code
     FROM cities c
     INNER JOIN states s ON s.id = c.state_id
     ${where}
     ORDER BY c.sort_order ASC, c.name ASC`,
    params
  );
};

const getById = (id) =>
  db.findOne(
    `SELECT c.id, c.state_id, c.name, c.sort_order, c.is_active, s.name AS state_name, s.code AS state_code
     FROM cities c
     INNER JOIN states s ON s.id = c.state_id
     WHERE c.id = ?`,
    [id]
  );

const getActiveById = (id) =>
  db.findOne(
    `SELECT c.id, c.state_id, c.name, c.sort_order, c.is_active, s.name AS state_name, s.code AS state_code
     FROM cities c
     INNER JOIN states s ON s.id = c.state_id
     WHERE c.id = ? AND c.is_active = 1 AND s.is_active = 1`,
    [id]
  );

const create = ({ state_id, name, sort_order, is_active }) =>
  db.execute(
    'INSERT INTO cities (state_id, name, sort_order, is_active) VALUES (?, ?, ?, ?)',
    [state_id, name, sort_order ?? 0, is_active ?? 1]
  );

const update = (id, { state_id, name, sort_order, is_active }) =>
  db.execute(
    `UPDATE cities SET
       state_id = COALESCE(?, state_id),
       name = COALESCE(?, name),
       sort_order = COALESCE(?, sort_order),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [state_id ?? null, name ?? null, sort_order ?? null, is_active ?? null, id]
  );

const remove = (id) => db.execute('DELETE FROM cities WHERE id = ?', [id]);

module.exports = { getAll, getById, getActiveById, create, update, remove };
