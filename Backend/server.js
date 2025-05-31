// Simple Express server for the Fintech Multiverse API
// This is just for demonstration purposes in the prototype

const express = require('express');
const cors = require('cors');
const personaRoutes = require('./api/persona');
const secParserRoutes = require('./api/parse_filing');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://fintech-multiverse.vercel.app'] 
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.post('/api/persona', personaRoutes.handlePersonaSelection);
app.get('/api/personas', personaRoutes.getPersonas);
app.get('/api/persona/:id', personaRoutes.getPersonaById);

// SEC Parser endpoint
app.post('/api/sec-filing', secParserRoutes.parseFiling);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start the server with port conflict handling
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('  - POST /api/persona');
      console.log('  - GET /api/personas');
      console.log('  - GET /api/persona/:id');
      console.log('  - POST /api/sec-filing');
      console.log('  - GET /health');
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please try the following:`);
      console.error('1. Kill the process using the port:');
      console.error(`   - Windows: netstat -ano | findstr :${PORT}`);
      console.error(`   - Linux/Mac: lsof -i :${PORT}`);
      console.error('2. Or use a different port by setting the PORT environment variable');
      process.exit(1);
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
};

startServer(); 