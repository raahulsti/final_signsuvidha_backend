const db = require('../config/db');
const getAll  = () => db.execute('SELECT * FROM listed_products ORDER BY sort_order ASC');
const getById = (id) => db.findOne('SELECT * FROM listed_products WHERE id = ?', [id]);
const create  = ({ product_type_id, name, description, admin_price, is_best_seller, sort_order }) =>
  db.execute('INSERT INTO listed_products (product_type_id, name, description, admin_price, is_best_seller, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [product_type_id, name, description||null, admin_price, is_best_seller?1:0, sort_order||0]);
const update  = (id, fields) => {
  const allowed = ['name','description','admin_price','is_best_seller','sort_order','is_active','thumbnail_url'];
  const sets=[]; const values=[];
  allowed.forEach((k) => { if(fields[k]!==undefined){sets.push(`${k}=?`);values.push(fields[k]);}});
  if(!sets.length) return Promise.resolve(null);
  values.push(id);
  return db.execute(`UPDATE listed_products SET ${sets.join(',')} WHERE id=?`, values);
};
const remove  = (id) => db.execute('DELETE FROM listed_products WHERE id = ?', [id]);
module.exports = { getAll, getById, create, update, remove };
