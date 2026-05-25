const multer   = require('multer');
const multerS3 = require('multer-s3');
const { s3Client, BUCKET } = require('../config/aws');
const { sanitizeFilename }  = require('../utils/helpers');

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'application/octet-stream',
];
const ALLOWED_FONT_TYPES  = ['font/ttf', 'font/woff', 'font/woff2', 'application/octet-stream'];

/**
 * createUploader(folder, allowedTypes, maxSizeMB)
 * Returns multer instance configured for AWS S3
 * Compatible with multer v2 + multer-s3 v3
 */
const createUploader = (folder, allowedTypes = ALLOWED_IMAGE_TYPES, maxSizeMB = 5) =>
  multer({
    storage: multerS3({
      s3:          s3Client,
      bucket:      BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        cb(null, `${folder}/${sanitizeFilename(file.originalname)}`);
      },
    }),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) return cb(null, true);
      const ext = (file.originalname || '').split('.').pop()?.toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'heic', 'heif'];
      if (ext && imageExts.includes(ext)) return cb(null, true);
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    },
  });

/** Cart: accept any file field name from mobile clients (avoids Multer "Unexpected field"). */
const createCartUploader = (folder, allowedTypes = ALLOWED_IMAGE_TYPES, maxSizeMB = 20) =>
  createUploader(folder, allowedTypes, maxSizeMB).any();

const PREVIEW_FIELD_NAMES = new Set(['preview_image', 'preview', 'design_preview']);
const UPLOAD_FIELD_NAMES = new Set([
  'image', 'file', 'photo', 'uploaded_image',
  'lollipop_image', 'design_image', 'sign_image', 'custom_image',
]);

const isPylonTilesImageField = (fieldname) => {
  const name = String(fieldname || '');
  return name === 'pylon_tiles_images'
    || name === 'pylon_tile_image'
    || name === 'pylon_tiles_image'
    || name.startsWith('pylon_tiles_images[')
    || name.startsWith('pylon_tiles_images');
};

const parseUrlArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim());
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
        : [];
    } catch (_) {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
};

/** Map multipart files → uploaded_image_url / preview_image_url / pylon_tiles_images. */
const applyCartUploadedFiles = (req, _res, next) => {
  const list = (Array.isArray(req.files) ? req.files : []).filter((f) => f?.location);
  const unmapped = [];
  const pylonTileUploads = [];

  for (const f of list) {
    const name = f.fieldname;
    if (isPylonTilesImageField(name)) {
      pylonTileUploads.push(f.location);
    } else if (PREVIEW_FIELD_NAMES.has(name)) {
      if (!req.body.preview_image_url) req.body.preview_image_url = f.location;
    } else if (UPLOAD_FIELD_NAMES.has(name)) {
      if (!req.body.uploaded_image_url) req.body.uploaded_image_url = f.location;
    } else {
      unmapped.push(f);
    }
  }

  for (const f of unmapped) {
    if (!req.body.uploaded_image_url) {
      req.body.uploaded_image_url = f.location;
    } else if (!req.body.preview_image_url) {
      req.body.preview_image_url = f.location;
    }
  }

  if (pylonTileUploads.length) {
    const fromBody = parseUrlArrayField(req.body.pylon_tiles_images);
    req.body.pylon_tiles_images = [...fromBody, ...pylonTileUploads];
  } else if (req.body.pylon_tiles_images !== undefined) {
    req.body.pylon_tiles_images = parseUrlArrayField(req.body.pylon_tiles_images);
  }

  // Single design image (not pylon tiles): use for both cart display fields
  if (list.length === 1 && list[0].location && !pylonTileUploads.length) {
    const url = list[0].location;
    if (!req.body.uploaded_image_url) req.body.uploaded_image_url = url;
    if (!req.body.preview_image_url) req.body.preview_image_url = url;
  }

  next();
};

/** Profile photo: accept common mobile field names */
const PROFILE_IMAGE_FIELDS = [
  { name: 'profile_image', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
];

const createProfileImageUploader = (folder, allowedTypes = ALLOWED_IMAGE_TYPES, maxSizeMB = 5) =>
  createUploader(folder, allowedTypes, maxSizeMB).fields(PROFILE_IMAGE_FIELDS);

const pickUploadedProfileFile = (req) => {
  if (req.file?.location) return req.file;
  if (!req.files) return null;
  if (Array.isArray(req.files)) {
    return req.files.find((f) => f?.location) || null;
  }
  for (const key of ['profile_image', 'image', 'photo']) {
    const f = req.files[key]?.[0];
    if (f?.location) return f;
  }
  return null;
};

/** Map uploaded profile file → profile_image_url (run after Joi validate so stripUnknown does not remove it) */
const applyProfileImageUpload = (req, _res, next) => {
  const file = pickUploadedProfileFile(req);
  if (file?.location) req.body.profile_image_url = file.location;
  next();
};

module.exports = {
  createUploader,
  createCartUploader,
  createProfileImageUploader,
  applyCartUploadedFiles,
  isPylonTilesImageField,
  parseUrlArrayField,
  applyProfileImageUpload,
  pickUploadedProfileFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FONT_TYPES,
};
