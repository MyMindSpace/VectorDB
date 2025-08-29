const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware and routes
const errorHandler = require('./middleware/errorHandler');
const vectorRoutes = require('./routes/vectors');
const astraDB = require('./config/astradb');

const app = express();

// Trust proxy (for Cloud Run)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key authentication middleware (DISABLED for easier testing)
// const authenticateApiKey = (req, res, next) => {
//   const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
//   
//   if (!apiKey) {
//     return res.status(401).json({
//       success: false,
//       error: 'API key required'
//     });
//   }

//   if (apiKey !== process.env.API_KEY) {
//     return res.status(401).json({
//       success: false,
//       error: 'Invalid API key'
//     });
//   }

//   next();
// };

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await astraDB.healthCheck();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'VectorDB CRUD Service',
      version: '1.0.0',
      database: dbHealth,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'VectorDB CRUD Service',
      version: '1.0.0',
      error: error.message
    });
  }
});

// API routes (no authentication required)
app.use('/api/vectors', vectorRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'MyMindSpace VectorDB CRUD Service',
    version: '1.0.0',
    description: 'Vector database operations using AstraDB for AI/ML services',
    endpoints: {
      health: 'GET /health',
      vectors: 'GET|POST|PUT|DELETE /api/vectors',
      similarity: 'POST /api/vectors/similarity',
      batch: 'POST /api/vectors/batch',
      stats: 'GET /api/vectors/stats'
    },
    documentation: 'https://github.com/yourusername/mymindspace-vectordb'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requested_path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    await astraDB.disconnect();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  
  try {
    await astraDB.disconnect();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
  }
  
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    console.log('🚀 Starting VectorDB CRUD Service...');
    await astraDB.connect();
    console.log('✅ Database connected successfully');
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API base URL: http://localhost:${PORT}/api/vectors`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
