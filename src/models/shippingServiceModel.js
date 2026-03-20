const db = require('../config/db');
const getAll   = () => db.execute('SELECT * FROM shipping_services ORDER BY id ASC');
const getById  = (id) => db.findOne('SELECT * FROM shipping_services WHERE id = ?', [id]);
const create   = ({ name, base_price, is_active }) => db.execute('INSERT INTO shipping_services (name, base_price, is_active) VALUES (?, ?, ?)', [name, base_price, is_active ?? 1]);
const update   = (id, { name, base_price, logo_url, is_active }) => db.execute('UPDATE shipping_services SET name = COALESCE(?,name), base_price = COALESCE(?,base_price), logo_url = COALESCE(?,logo_url), is_active = COALESCE(?,is_active) WHERE id = ?', [name??null, base_price??null, logo_url??null, is_active??null, id]);
const remove   = (id) => db.execute('DELETE FROM shipping_services WHERE id = ?', [id]);
module.exports = { getAll, getById, create, update, remove };
