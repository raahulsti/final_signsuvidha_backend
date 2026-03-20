const db = require('../../config/db');
const { success, created, notFound } = require('../../utils/response');
exports.getAll = async (req, res, next) => { try { return success(res, await db.execute('SELECT * FROM dimension_units')); } catch (err) { next(err); } };
exports.getOne = async (req, res, next) => { try { const i = await db.findOne('SELECT * FROM dimension_units WHERE id = ?', [req.params.id]); if (!i) return notFound(res, 'Not found'); return success(res, i); } catch (err) { next(err); } };
exports.create = async (req, res, next) => { try { const r = await db.execute('INSERT INTO dimension_units (unit_name, conversion_to_sqft) VALUES (?,?)', [req.body.unit_name, req.body.conversion_to_sqft]); return created(res, { id: r.insertId }, 'Created'); } catch (err) { next(err); } };
exports.update = async (req, res, next) => { try { await db.execute('UPDATE dimension_units SET unit_name=COALESCE(?,unit_name), conversion_to_sqft=COALESCE(?,conversion_to_sqft) WHERE id=?', [req.body.unit_name??null, req.body.conversion_to_sqft??null, req.params.id]); return success(res, {}, 'Updated'); } catch (err) { next(err); } };
exports.delete = async (req, res, next) => { try { await db.execute('DELETE FROM dimension_units WHERE id = ?', [req.params.id]); return success(res, {}, 'Deleted'); } catch (err) { next(err); } };
