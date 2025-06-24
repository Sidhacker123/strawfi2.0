// Simple Express server for the strawfi API
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');             
const personaRoutes  = require('./api/persona');
const secParserRoutes = require('./api/parse_filing');
const researchRoutes  = require('./api/research');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { createServer } = require('http');
const WebSocket = require('ws');

const app  = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'https://www.strawfi.com',
  'https://fintech-multiverse.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } 
    else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

const upload   = multer({ storage: multer.memoryStorage() });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ---------- JWT helper ---------- */
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

/* ---------- in-memory editing locks ---------- */
//  Map<researchId, { userId, userName, startedAt }>
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

// release lock
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
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  // Optionally, verify userId with Supabase or your DB here
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Health check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
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
wss.on('connection', (ws) => {
  console.log('Client connected');

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
      console.log('  - POST /api/research/:id/version');
      console.log('  - GET  /api/research/:id/lock');      // ← NEW
      console.log('  - POST /api/research/:id/lock');     // ← NEW
      console.log('  - DELETE /api/research/:id/lock');   // ← NEW
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
