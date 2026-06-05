require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Catch uncaught exceptions to establish process-level safety boundaries
process.on('uncaughtException', (err) => {
  console.error(`[Process] Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[Process] Unhandled Rejection at:`, promise, `reason:`, reason);
});

// Initialize Express
const app = express();

// Establish Database Connection
connectDB();

// Core Middleware
app.use(cors({
  origin: '*', // Allow connections from Vite dev server and external clients
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token']
}));
app.use(express.json());

// Expose Static Uploads Folder (For storing diagnostic photos)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount REST Router Routes
app.use('/api/auth', require('./routes/api.auth'));
app.use('/api/farm', require('./routes/api.farm'));
app.use('/api/market', require('./routes/api.market'));
app.use('/api/analytics', require('./routes/api.analytics'));

// System Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    db_state: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Global Fallback Error Interceptor
app.use((err, req, res, next) => {
  console.error(`[Express Error Handler]: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error.',
    message: err.message || 'An unexpected pipeline error occurred on the primary server.'
  });
});

// Launch Listener
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[Express API] Server running in production-ready mode on port ${PORT}`);
});
