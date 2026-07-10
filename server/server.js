const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'online', service: 'AgriOS Express Core' });
});

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
