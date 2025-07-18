// Simple Express server for the strawfi API
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');             
const personaRoutes  = require('./api/persona');
const secParserRoutes = require('./api/parse_filing');
const researchRoutes  = require('./api/research');
const corporateRoutes = require('./api/corporate');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { createServer } = require('http');
const WebSocket = require('ws');

// Environment validation
const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these environment variables in your deployment platform.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

const app  = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// ---------- CORS ----------
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin}`);
    
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL,
          'https://strawfi-testing.vercel.app',
          'https://strawfi-testing-01.vercel.app',
          'https://fintech-multiverse.vercel.app'
        ].filter(Boolean) // Remove undefined values
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    console.log(`🔍 Allowed origins:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log('🔍 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false // Let cors handle the response
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handler for all routes to ensure preflight works
app.options('*', (req, res) => {
  console.log(`🔧 OPTIONS request for: ${req.path} from origin: ${req.get('Origin')}`);
  console.log(`📝 Request headers: ${JSON.stringify(req.headers)}`);
  res.sendStatus(200);
});

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📞 ${req.method} ${req.path} from ${req.get('Origin') || 'unknown'}`);
  if (req.method === 'OPTIONS') {
    console.log(`🔧 Preflight headers: ${JSON.stringify(req.headers)}`);
  }
  next();
});

const upload   = multer({ storage: multer.memoryStorage() });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

//jwt helper
const authenticateToken = (req, _res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return _res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return _res.sendStatus(403);
    req.user = user;
    next();
  });
};


const editingLocks = new Map();

// acquire lock
app.post('/api/research/:id/lock', authenticateToken, (req, res) => {
  const id      = req.params.id;
  const current = editingLocks.get(id);
  if (current && current.userId !== req.user.id) {
    return res.status(409).json({ editing: true, by: current.userName });
  }
  editingLocks.set(id, {
    userId: req.user.id,
    userName: req.user.name,
    startedAt: Date.now()
  });
  res.json({ editing: true, by: req.user.name });
});

app.delete('/api/research/:id/lock', authenticateToken, (req, res) => {
  const id      = req.params.id;
  const current = editingLocks.get(id);
  if (current && current.userId === req.user.id) editingLocks.delete(id);
  res.json({ released: true });
});

// check lock (public)
app.get('/api/research/:id/lock', (req, res) => {
  const lock = editingLocks.get(req.params.id);
  if (!lock) return res.json({ editing: false });
  res.json({ editing: true, by: lock.userName });
});

// Health check endpoint (should be near the top, before other routes)
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested from:', req.get('Origin') || 'unknown');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors_enabled: true
  });
});

// Test CORS with a simple endpoint
app.get('/api/cors-test', (req, res) => {
  console.log('🧪 CORS test requested from:', req.get('Origin') || 'unknown');
  res.json({ 
    message: 'CORS test successful',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

/* ---------- existing routes ---------- */

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

/* ---------- Corporate Events API Routes ---------- */

// Test endpoint
app.get('/api/corporate/test', corporateRoutes.handleTest);

// Enhanced sentiment analysis test
app.get('/api/corporate/test-enhanced', (req, res) => {
  res.json({
    message: 'Enhanced sentiment analysis test endpoint',
    instructions: 'Use POST /api/analyze with action=test_enhanced_features to test enhancements'
  });
});

// Historical Analysis
app.get('/api/historical', corporateRoutes.handleHistoricalAnalysis);

// Audio Transcription
app.post('/api/transcribe', corporateRoutes.upload.single('audio'), corporateRoutes.handleAudioTranscription);

// Audio Debug
app.post('/api/audio-debug', corporateRoutes.upload.single('audio'), corporateRoutes.handleAudioDebug);

// Text Analysis
app.post('/api/analyze', corporateRoutes.handleTextAnalysis);

// Bulk Analysis
app.post('/api/bulk', corporateRoutes.handleBulkAnalysis);

// Manual cleanup endpoint (for testing)
app.post('/api/corporate/cleanup', (req, res) => {
  try {
    corporateRoutes.cleanupTempFiles();
    res.json({ 
      success: true, 
      message: 'Temp files cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Cleanup failed', 
      details: error.message 
    });
  }
});

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

// Endpoint to issue JWT for a user
app.post('/api/get-jwt', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    
    console.log('JWT requested for user:', userId);
    
    // Verify userId exists in Supabase auth.users table
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('User verification error:', error);
      return res.status(401).json({ error: 'Invalid user ID' });
    }
    
    if (!user) {
      console.error('User not found:', userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('User verified, issuing JWT for:', user.user.email);
    
    // Issue JWT with verified user info
    const token = jwt.sign(
      { 
        id: userId, 
        email: user.user.email,
        iat: Math.floor(Date.now() / 1000)
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('JWT generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Global error handler
app.use((err, _req, res, _next) => {
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

// Store active editors with full names
const activeEditors = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('Client connected');

  // Check if this is a corporate events WebSocket connection
  const url = new URL(req.url, `http://${req.headers.host}`);
  const isCorporateEvents = url.pathname === '/ws/corporate';

  if (isCorporateEvents) {
    // Handle corporate events live recording
    corporateRoutes.handleLiveRecording(ws, req);
    return;
  }

  // Handle existing research editing WebSocket
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start_edit') {
        const { researchId, username } = data;
        // Get user's full name from profiles table
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', username)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        const displayName = userData?.full_name || username;
        
        if (!activeEditors.has(researchId)) {
          activeEditors.set(researchId, new Set());
        }
        activeEditors.get(researchId).add(displayName);
        
        // Broadcast to all clients
        broadcastEditors();
      } 
      else if (data.type === 'stop_edit') {
        const { researchId, username } = data;
        // Get user's full name from profiles table
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', username)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        const displayName = userData?.full_name || username;
        
        if (activeEditors.has(researchId)) {
          activeEditors.get(researchId).delete(displayName);
          if (activeEditors.get(researchId).size === 0) {
            activeEditors.delete(researchId);
          }
        }
        
        // Broadcast to all clients
        broadcastEditors();
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Function to broadcast editors to all connected clients
function broadcastEditors() {
  const editorsData = {};
  activeEditors.forEach((editors, researchId) => {
    editorsData[researchId] = Array.from(editors);
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'editors_update',
        editors: editorsData
      }));
    }
  });
}

// Start Server
const startServer = () => {
  try {
    server.listen(PORT, () => {
      console.log('🚀 Server starting...');
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}`);
      console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
      
      // CORS Configuration Info
      console.log('\n🛡️  CORS Configuration:');
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL,
            'https://strawfi-testing-01.vercel.app',
            'https://fintech-multiverse.vercel.app'
          ].filter(Boolean)
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];
      console.log('   Allowed Origins:', allowedOrigins);
      console.log('   Allowed Methods: GET, POST, DELETE, PUT, OPTIONS');
      console.log('   Allowed Headers: Content-Type, Authorization, X-Requested-With');
      
      console.log('\n📋 Available endpoints:');
      console.log('  🏥 GET  /health                      (Health check)');
      console.log('  🧪 GET  /api/cors-test               (CORS test)');
      console.log('  👤 POST /api/persona');
      console.log('  👥 GET  /api/personas');
      console.log('  👤 GET  /api/persona/:id');
      console.log('  📄 POST /api/sec-filing');
      console.log('  📝 POST /api/research/create');
      console.log('  📚 GET  /api/research');
      console.log('  📖 GET  /api/research/:id');
      console.log('  📋 GET  /api/research/:id/versions');
      console.log('  ➕ POST /api/research/:id/version');
      console.log('  🔒 GET  /api/research/:id/lock');
      console.log('  🔒 POST /api/research/:id/lock');
      console.log('  🔓 DELETE /api/research/:id/lock');
      console.log('  📤 POST /api/upload');
      console.log('  🧪 GET  /api/corporate/test          (Corporate Events Test)');
      console.log('  📊 GET  /api/historical              (Corporate Events - No Auth)');
      console.log('  🎤 POST /api/transcribe              (Corporate Events - No Auth)');
      console.log('  📈 POST /api/analyze                 (Corporate Events - No Auth)');
      console.log('  📊 POST /api/bulk                    (Corporate Events - No Auth)');
      console.log('  🗑️  POST /api/corporate/cleanup      (Manual cleanup)');
      console.log('  🔑 POST /api/get-jwt                 (JWT generation)');
      
      console.log('\n🔌 WebSocket endpoints:');
      console.log('  📡 /ws/corporate (for live recording)');
      console.log('  📝 /ws (for research editing)');
      
      // Initial cleanup of old temp files
      console.log('\n🧹 Performing initial temp file cleanup...');
      corporateRoutes.cleanupTempFiles();
      
      // Set up periodic cleanup every 6 hours
      setInterval(() => {
        console.log('🧹 Performing periodic temp file cleanup...');
        corporateRoutes.cleanupTempFiles();
      }, 6 * 60 * 60 * 1000); // 6 hours
      
      console.log('\n✅ Server ready to handle requests!');
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error('💡 Kill the process using the port or set PORT env to a different value.');
      process.exit(1);
    } else {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
};

startServer();
