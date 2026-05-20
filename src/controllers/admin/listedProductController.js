const model = require('../../models/listedProductModel');
const { success, created, notFound } = require('../../utils/response');
const { deleteFromS3 } = require('../../config/aws');
const { LISTED_PRODUCT_SIZES } = require('../../utils/constants');

const parseVariantsFromBody = (body) =>
  LISTED_PRODUCT_SIZES.map((size) => ({
    size,
    admin_price: body[`price_${size}`] !== undefined && body[`price_${size}`] !== ''
      ? parseFloat(body[`price_${size}`])
      : undefined,
  })).filter((v) => v.admin_price !== undefined);

const parseRemoveImageIds = (body) => {
  const raw = body.remove_image_ids;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch (_) {
    return String(raw).split(',').map((x) => Number(x.trim())).filter(Boolean);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    return success(res, await model.getAll());
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await model.getById(req.params.id);
    if (!row) return notFound(res, 'Listed product not found');
    return success(res, await model.toPublic(row));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const variants = parseVariantsFromBody(req.body);
    if (!variants.length) {
      const err = new Error('Add at least one size price (regular, medium, or large)');
      err.statusCode = 400;
      throw err;
    }
    const productId = await model.create({
      product_type_id: req.body.product_type_id,
      name: req.body.name,
      description: req.body.description,
      is_best_seller: req.body.is_best_seller,
      sort_order: req.body.sort_order,
      is_active: req.body.is_active,
      variants,
    });
    const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
    if (files.length) {
      await model.addImages(productId, files.map((f) => f.location));
    }
    return created(res, { id: productId }, 'Listed product created');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await model.getById(req.params.id);
    if (!existing) return notFound(res, 'Listed product not found');

    const removeIds = parseRemoveImageIds(req.body);
    if (removeIds.length) {
      const imgs = await model.getImages(req.params.id);
      for (const img of imgs.filter((i) => removeIds.includes(i.id))) {
        if (img.file_url) await deleteFromS3(img.file_url);
      }
      await model.removeImages(removeIds);
    }

    for (const size of LISTED_PRODUCT_SIZES) {
      if (req.body[`price_${size}`] === '') await model.removeVariant(req.params.id, size);
    }
    const variants = parseVariantsFromBody(req.body);
    const remaining = await model.getVariants(req.params.id, { activeOnly: false });
    if (!variants.length && !remaining.length) {
      const err = new Error('At least one size price must remain on this product');
      err.statusCode = 400;
      throw err;
    }
    await model.update(req.params.id, {
      product_type_id: req.body.product_type_id,
      name: req.body.name,
      description: req.body.description,
      is_best_seller: req.body.is_best_seller,
      sort_order: req.body.sort_order,
      is_active: req.body.is_active,
      variants: variants.length ? variants : undefined,
    });

    const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
    if (files.length) {
      await model.addImages(req.params.id, files.map((f) => f.location));
    }
    return success(res, await model.toPublic(await model.getById(req.params.id)), 'Listed product updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const existing = await model.getById(req.params.id);
    if (!existing) return notFound(res, 'Listed product not found');
    const imgs = await model.getImages(req.params.id);
    for (const img of imgs) {
      if (img.file_url) await deleteFromS3(img.file_url);
    }
    if (existing.thumbnail_url) await deleteFromS3(existing.thumbnail_url);
    await model.remove(req.params.id);
    return success(res, {}, 'Listed product deleted');
  } catch (err) { next(err); }
};
