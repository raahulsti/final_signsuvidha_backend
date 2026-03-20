const db = require('../config/db');

const getAll = ({ productTypeId, elementTypeId, isActive, offset, limit }) => {
  const conds  = [];
  const values = [];

  if (productTypeId  !== undefined) { conds.push('e.product_type_id = ?');  values.push(productTypeId); }
  if (elementTypeId  !== undefined) { conds.push('e.element_type_id = ?');  values.push(elementTypeId); }
  if (isActive       !== undefined) { conds.push('e.is_active = ?');        values.push(isActive); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sql   = `
    SELECT e.*, et.name AS element_type_name, pt.name AS product_type_name
    FROM elements e
    LEFT JOIN element_types et ON et.id = e.element_type_id
    LEFT JOIN product_types pt ON pt.id = e.product_type_id
    ${where}
    ORDER BY e.sort_order ASC
    LIMIT ? OFFSET ?
  `;
  return db.paginate(sql, `SELECT COUNT(*) AS total FROM elements e ${where}`,
    [...values, limit, offset], values);
};

const getById = (id) =>
  db.findOne(
    `SELECT e.*, et.name AS element_type_name FROM elements e
     LEFT JOIN element_types et ON et.id = e.element_type_id WHERE e.id = ?`, [id]
  );

const create = ({ product_type_id, element_type_id, name, description, file_url, thumbnail_url, admin_price_extra, sort_order }) =>
  db.execute(
    `INSERT INTO elements (product_type_id, element_type_id, name, description, file_url, thumbnail_url, admin_price_extra, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [product_type_id, element_type_id, name, description || null, file_url, thumbnail_url || null, admin_price_extra || 0, sort_order || 0]
  );

const update = (id, fields) => {
  const allowed = ['name','description','file_url','thumbnail_url','admin_price_extra','sort_order','is_active'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE elements SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM elements WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
