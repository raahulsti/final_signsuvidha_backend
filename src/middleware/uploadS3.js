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

/** Map multipart files → uploaded_image_url / preview_image_url (any field name). */
const applyCartUploadedFiles = (req, _res, next) => {
  const list = (Array.isArray(req.files) ? req.files : []).filter((f) => f?.location);
  const unmapped = [];

  for (const f of list) {
    const name = f.fieldname;
    if (PREVIEW_FIELD_NAMES.has(name)) {
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

  // Single design image (common on lollipop / sign products): use for both cart display fields
  if (list.length === 1 && list[0].location) {
    const url = list[0].location;
    if (!req.body.uploaded_image_url) req.body.uploaded_image_url = url;
    if (!req.body.preview_image_url) req.body.preview_image_url = url;
  }

  next();
};

module.exports = {
  createUploader,
  createCartUploader,
  applyCartUploadedFiles,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FONT_TYPES,
};
