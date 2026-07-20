const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimit');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/logger');

dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/api.auth');
const farmRoutes = require('./routes/api.farm');
const marketRoutes = require('./routes/api.market');
const analyticsRoutes = require('./routes/api.analytics');
const logisticsRoutes = require('./routes/api.logistics');
const financialRoutes = require('./routes/api.financial');
const inventoryRoutes = require('./routes/api.inventory');
const equipmentRoutes = require('./routes/api.equipment');
const taskRoutes = require('./routes/api.task');
const scrapeRoutes = require('./routes/api.scrape');
const weatherRoutes = require('./routes/api.weather');
const geospatialRoutes = require('./routes/api.geospatial');
const fpoAdminRoutes = require('./routes/api.fpoAdmin');
const ndviRoutes = require('./routes/api.ndvi');
const knowledgeBaseRoutes = require('./routes/api.knowledgeBase');
const reputationRoutes = require('./routes/api.reputation');
const messageRoutes = require('./routes/api.messages');
const { scrapeAGMARKNET } = require('./services/agmarknetScraper');

let cronJob = null;
if (process.env.ENABLE_AGMARKNET_CRON === "true") {
  try {
    const cron = require('node-cron');
    cronJob = cron.schedule('0 * * * *', async () => {
      console.log('[Cron] Starting hourly AGMARKNET scrape...');
      await scrapeAGMARKNET();
      console.log('[Cron] AGMARKNET scrape completed.');
    }, { scheduled: true });
    console.log('[Cron] AGMARKNET hourly scraper scheduled.');
  } catch (err) {
    console.warn('[Cron] node-cron not installed or cron initialization failed:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.warn('[Server] JWT_SECRET is not set. AUTH WILL FAIL. Ensure .env is present in server/.');
}

// Request logging
app.use(requestLogger);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API-only server
  crossOriginEmbedderPolicy: false,
}));

// CORS - allow client dev server and production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : allowedOrigins;
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Health check (before rate limit for monitoring)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'online', service: 'AgriOS Express Core' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/geospatial', geospatialRoutes);
app.use('/api/fpo', fpoAdminRoutes);
app.use('/api/ndvi', ndviRoutes);
app.use('/api/knowledge', knowledgeBaseRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrios')
  .then(() => {
    console.log('Connected to MongoDB successfully');
    app.listen(PORT, () => {
      console.log(`AgriOS Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('Make sure MongoDB is running on mongodb://localhost:27017/agrios');
    process.exit(1);
  });

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
