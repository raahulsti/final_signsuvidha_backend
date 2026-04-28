const db = require('../config/db');

const getAll = () => db.execute('SELECT * FROM letter_styles WHERE is_active = 1 ORDER BY id ASC');

const getById = (id) => db.findOne('SELECT * FROM letter_styles WHERE id = ?', [id]);

const create = ({ name, preview_image_url }) =>
  db.execute(
    'INSERT INTO letter_styles (name, preview_image_url) VALUES (?, ?)',
    [name, preview_image_url || null]
  );

const update = (id, fields) => {
  const allowed = ['name', 'preview_image_url', 'is_active'];
  const sets = []; const values = [];
  allowed.forEach((k) => { if (fields[k] !== undefined) { sets.push(`${k} = ?`); values.push(fields[k]); } });
  if (!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE letter_styles SET ${sets.join(', ')} WHERE id = ?`, values);
};

const remove = (id) => db.execute('DELETE FROM letter_styles WHERE id = ?', [id]);

module.exports = { getAll, getById, create, update, remove };
