#!/usr/bin/env node
/**
 * Usage: node scripts/run-sql-file.js scripts/<file>.sql
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-sql-file.js <path-to.sql>');
  process.exit(1);
}

const run = async () => {
  const sqlPath = path.resolve(file);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  await conn.query(sql);
  console.log(`OK — executed ${path.basename(sqlPath)}`);
  await conn.end();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
