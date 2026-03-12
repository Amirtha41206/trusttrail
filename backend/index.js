require('dotenv').config();
// ============================================================
//  trusttrail — Backend Entry Point
//  Amirtha's backend server
// ============================================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ── Socket.io for real-time location tracking ──
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Attach io to every request so controllers can emit events ──
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Routes ──
const authRoutes            = require('./routes/auth');
const sosRoutes             = require('./routes/sos');
const locationRoutes        = require('./routes/location');
const heatmapRoutes         = require('./routes/heatmap');
const trustedTravellerRoutes = require('./routes/trustedTraveller');
const reportRoutes          = require('./routes/report');
const complaintRoutes       = require('./routes/complaint');
const evidenceRoutes        = require('./routes/evidence');

app.use('/api/auth',             authRoutes);
app.use('/api/sos',              sosRoutes);
app.use('/api/location',         locationRoutes);
app.use('/api/heatmap',          heatmapRoutes);
app.use('/api/trusted-traveller', trustedTravellerRoutes);
app.use('/api/report',           reportRoutes);
app.use('/api/complaint',        complaintRoutes);
app.use('/api/evidence',         evidenceRoutes);

// ── Health check ──
app.get('/', (_req, res) => res.json({ status: 'trusttrail backend is running ' }));

// ── Real-time: Live Location via Socket.io ──
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User starts sharing their live location
  socket.on('share-location', ({ userId, lat, lng }) => {
    console.log(` Location update from ${userId}: ${lat}, ${lng}`);
    // Broadcast to all family members watching this userId's room
    socket.to(`family-${userId}`).emit('location-update', { userId, lat, lng, timestamp: Date.now() });
  });

  // Family member joins a user's tracking room
  socket.on('watch-user', ({ userId }) => {
    socket.join(`family-${userId}`);
    console.log(` Family member watching: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(` Client disconnected: ${socket.id}`);
  });
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\ntrusttrail backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for real-time tracking\n`);
});
