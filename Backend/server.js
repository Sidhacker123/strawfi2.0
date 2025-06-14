// Simple Express server for the strawfi API

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const personaRoutes  = require('./api/persona');
const secParserRoutes = require('./api/parse_filing');
const researchRoutes  = require('./api/research');          
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'https://fintech-multiverse.vercel.app']
      : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};

//  Middleware  
app.use(cors(corsOptions));
app.use(express.json());

const upload   = multer({ storage: multer.memoryStorage() });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Routes

// Persona
app.post('/api/persona',      personaRoutes.handlePersonaSelection);
app.get ('/api/personas',     personaRoutes.getPersonas);
app.get ('/api/persona/:id',  personaRoutes.getPersonaById);

// SEC Parser
app.post('/api/sec-filing', secParserRoutes.parseFiling);

// Research (base)
app.post('/api/research/create',  researchRoutes.createResearch);
app.get ('/api/research',         researchRoutes.getAllResearch);
app.get ('/api/research/:id',     researchRoutes.getResearchById);
app.get ('/api/research/:id/versions', researchRoutes.getResearchVersions);

// NEW: Create Version
app.post('/api/research/:id/version', researchRoutes.createResearchVersion);

// File upload for PDFs
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: 'No file uploaded' });
  if (req.file.mimetype !== 'application/pdf')
    return res.status(400).json({ error: 'Only PDF files are allowed' });

  try {
    const fileExt  = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: upErr } = await supabase.storage
      .from('research-files')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (upErr) return res.status(500).json({ error: upErr.message });

    const { publicUrl } = supabase.storage
      .from('research-files')
      .getPublicUrl(fileName).data;

    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred'
  });
});

// Start Server
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('  - POST /api/persona');
      console.log('  - GET  /api/personas');
      console.log('  - GET  /api/persona/:id');
      console.log('  - POST /api/sec-filing');
      console.log('  - POST /api/research/create');
      console.log('  - GET  /api/research');
      console.log('  - GET  /api/research/:id');
      console.log('  - GET  /api/research/:id/versions');
      console.log('  - POST /api/research/:id/version');   //new
      console.log('  - POST /api/upload');
      console.log('  - GET  /health');
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      console.error('Kill the process using the port or set PORT env to a different value.');
      process.exit(1);
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
};

startServer();
