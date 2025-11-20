const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from public using path.join
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Explicit root route for convenience
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SPA fallback: send index.html for any non-API route (so client-side routing works)
app.get('*', (req, res) => {
  // Avoid intercepting API routes
  if (req.path.startsWith('/api/')) {
    res.status(404).send({ error: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server and handle graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Tower Defense server running on port ${PORT}`);
});

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Closing server...`);
  server.close(() => {
    console.log('Server closed gracefully.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forcing shutdown due to timeout.');
    process.exit(1);
  }, 3000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));