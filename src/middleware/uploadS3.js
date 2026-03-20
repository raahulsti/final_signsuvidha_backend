const multer   = require('multer');
const multerS3 = require('multer-s3');
const { s3Client, BUCKET } = require('../config/aws');
const { sanitizeFilename }  = require('../utils/helpers');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
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
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    },
  });

module.exports = { createUploader, ALLOWED_IMAGE_TYPES, ALLOWED_FONT_TYPES };
