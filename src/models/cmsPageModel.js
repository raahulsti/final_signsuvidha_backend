const db = require('../config/db');

const getAll = () =>
  db.execute(
    'SELECT id, slug, title, content, is_active, created_at, updated_at FROM cms_pages ORDER BY slug ASC'
  );

const getBySlug = (slug, { activeOnly = false } = {}) => {
  const cond = activeOnly ? ' AND is_active = 1' : '';
  return db.findOne(
    `SELECT id, slug, title, content, is_active, created_at, updated_at
     FROM cms_pages WHERE slug = ?${cond}`,
    [slug]
  );
};

const updateBySlug = (slug, fields) => {
  const allowed = ['title', 'content', 'is_active'];
  const sets = [];
  const values = [];
  allowed.forEach((k) => {
    if (fields[k] !== undefined) {
      sets.push(`${k} = ?`);
      values.push(k === 'is_active' ? (fields[k] ? 1 : 0) : fields[k]);
    }
  });
  if (!sets.length) return Promise.resolve(null);
  values.push(slug);
  return db.execute(`UPDATE cms_pages SET ${sets.join(', ')}, updated_at = NOW() WHERE slug = ?`, values);
};

module.exports = { getAll, getBySlug, updateBySlug };
