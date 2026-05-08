const db = require('../config/db');

const getActive = () =>
  db.findOne(
    `SELECT id, gst_percent
     FROM tax_config
     WHERE is_active = 1
     ORDER BY id DESC
     LIMIT 1`
  );

module.exports = { getActive };
