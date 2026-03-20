const { v4: uuidv4 } = require('uuid');

// ── Order number generator ────────────────────────
const generateOrderNumber = () => {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD-${ts}-${random}`;
};

// ── OTP generator ─────────────────────────────────
const generateOTP = (length = 6) =>
  Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString();

// ── Pagination helpers ────────────────────────────
const getPagination = (page = 1, limit = 10) => ({
  offset: (parseInt(page) - 1) * parseInt(limit),
  limit:  parseInt(limit),
});

const getPaginationMeta = (total, page, limit) => ({
  total,
  page:        parseInt(page),
  limit:       parseInt(limit),
  totalPages:  Math.ceil(total / parseInt(limit)),
  hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
  hasPrevPage: parseInt(page) > 1,
});

// ── Safe filename for S3 ──────────────────────────
const sanitizeFilename = (originalName) => {
  const ext  = originalName.split('.').pop().toLowerCase();
  const name = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase();
  return `${Date.now()}-${uuidv4().slice(0, 8)}-${name}.${ext}`;
};

// ── Build WHERE clause dynamically ───────────────
// Usage: buildWhere({ is_active: true, product_type_id: 2 })
// Returns: { clause: 'WHERE is_active = ? AND product_type_id = ?', values: [true, 2] }
const buildWhere = (filters = {}) => {
  const conditions = [];
  const values     = [];

  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      conditions.push(`${key} = ?`);
      values.push(val);
    }
  });

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

module.exports = {
  generateOrderNumber,
  generateOTP,
  getPagination,
  getPaginationMeta,
  sanitizeFilename,
  buildWhere,
};
