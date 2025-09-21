// server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const AppError = require('./utils/appError');

const User = require('./models/User'); // used to create default admin

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

/* ---------- Basic Middleware ---------- */

// Helmet: configure Cross-Origin-Resource-Policy to allow cross-origin embedding of images during dev
// This avoids ERR_BLOCKED_BY_RESPONSE.NotSameOrigin when the frontend is served from another origin (eg Vite).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// dev logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// CORS - allow your frontend origin(s)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Rate limiter (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Ensure static/public and uploads directories exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// serve built frontend (if present)
app.use(express.static(publicDir));

// serve uploaded files (images) — MUST be before API routes and 404 handler
app.use('/uploads', express.static(uploadsDir));

/* ---------- Mount Routes ---------- */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/tickets', ticketRoutes);

/* ---------- 404 handler ---------- */
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

/* ---------- Global Error Handler ---------- */
app.use(globalErrorHandler);

/* ---------- Startup ---------- */

const PORT = process.env.PORT || 5000;

/**
 * Ensure default admin user exists (development helper).
 * Credentials controlled by env vars DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD.
 */
async function ensureAdminUser() {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@gmail.com';
    const adminPlainPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123';

    const existing = await User.findOne({ email: adminEmail }).lean();
    if (existing) {
      console.log(`✔ Admin user already exists: ${adminEmail}`);
      return;
    }

    await User.create({
      name: 'Administrator',
      email: adminEmail,
      password: adminPlainPassword,
      role: 'admin',
    });

    console.log('=======================================================');
    console.log('Created default ADMIN user (development only) — credentials:');
    console.log(`  email   : ${adminEmail}`);
    console.log(`  password: ${adminPlainPassword}`);
    console.log('Change password after first login.');
    console.log('=======================================================');
  } catch (err) {
    console.error('Error ensuring admin user:', err);
  }
}

const start = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    await ensureAdminUser();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();

module.exports = app;
