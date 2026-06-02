const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const compression   = require('compression');
const morgan        = require('morgan');
const routes        = require('../routes');
const errorHandler  = require('../middleware/errorHandler');
const notFound      = require('../middleware/notFound');
const requestLogger = require('../middleware/requestLogger');

const app = express();

// Disable ETag so API GETs are never answered with 304 Not Modified
// (a 304 can yield an empty body in fetch/RTK Query and break data loading).
app.set('etag', false);

// ── Security ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// ── Performance ───────────────────────────────────
app.use(compression());

// ── Body Parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(requestLogger);

// ── API Routes ────────────────────────────────────
// Prevent browser caching of API responses (avoids stale 304 with empty body).
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api', routes);

// ── Health Check ──────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date(), env: process.env.NODE_ENV })
);

// ── Error Handling ────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
