const model = require('../../models/letterStyleModel');
const { success, created, notFound } = require('../../utils/response');
exports.getAll = async (req, res, next) => { try { return success(res, await model.getAll()); } catch (err) { next(err); } };
exports.getOne = async (req, res, next) => { try { const i = await model.getById(req.params.id); if (!i) return notFound(res, 'LetterStyle not found'); return success(res, i); } catch (err) { next(err); } };
exports.create = async (req, res, next) => { try { const r = await model.create(req.body); return created(res, { id: r.insertId }, 'LetterStyle created'); } catch (err) { next(err); } };
exports.update = async (req, res, next) => { try { if (!await model.getById(req.params.id)) return notFound(res, 'LetterStyle not found'); await model.update(req.params.id, req.body); return success(res, {}, 'Updated'); } catch (err) { next(err); } };
exports.delete = async (req, res, next) => { try { if (!await model.getById(req.params.id)) return notFound(res, 'LetterStyle not found'); await model.remove(req.params.id); return success(res, {}, 'Deleted'); } catch (err) { next(err); } };
