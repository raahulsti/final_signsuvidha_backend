const mysql  = require('mysql2/promise');
const logger = require('../utils/logger');

// ── Create connection pool ────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_POOL_MAX)     || 10,
  queueLimit:         0,
  idleTimeout:        parseInt(process.env.DB_POOL_IDLE)    || 10000,
  connectTimeout:     parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
  timezone:           '+05:30',               // IST
  decimalNumbers:     true,                   // DECIMAL → JS number
  dateStrings:        false,
});

// ── Test connection on startup ────────────────────────────────
const testConnection = async () => {
  const conn = await pool.getConnection();
  logger.info('✅ MySQL connected successfully');
  conn.release();
};

// ── Helper: execute query with logging ───────────────────────
const execute = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    logger.error(`DB Error: ${err.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`);
    throw err;
  }
};

// ── Helper: run query (for IN clauses, dynamic queries) ──────
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    logger.error(`DB Error: ${err.message}\nSQL: ${sql}`);
    throw err;
  }
};

// ── Helper: get single row ───────────────────────────────────
const findOne = async (sql, params = []) => {
  const rows = await execute(sql, params);
  return rows[0] || null;
};

// ── Helper: get paginated results with total count ───────────
const paginate = async (sql, countSql, params = [], countParams = []) => {
  const [rows, countResult] = await Promise.all([
    execute(sql, params),
    execute(countSql, countParams),
  ]);
  return { rows, total: countResult[0]?.total || 0 };
};

// ── Helper: transaction wrapper ──────────────────────────────
const withTransaction = async (callback) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { pool, execute, query, findOne, paginate, withTransaction, testConnection };
