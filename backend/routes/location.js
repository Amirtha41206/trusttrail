// ============================================================
//  trusttrail — Location Tracking Routes
//  POST /api/location/update   → User sends their current GPS
//  GET  /api/location/:userId  → Family member gets latest location
//  POST /api/location/stop     → User stops sharing location
// ============================================================

const express = require('express');
const router = express.Router();
const { liveLocations } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ── POST /api/location/update ──
// Header: x-user-id
// Body: { lat, lng, accuracy (optional) }
// Called repeatedly by the app every few seconds when SOS is active
router.post('/update', authMiddleware, (req, res) => {
  const { lat, lng, accuracy } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng are required'
    });
  }

  const locationData = {
    userId: req.user.id,
    userName: req.user.name,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    accuracy: accuracy || null,
    updatedAt: new Date()
  };

  // Store latest location for this user (overwrites previous)
  liveLocations[req.user.id] = locationData;

  // Broadcast to family members watching this user's room
  req.io.to(`family-${req.user.id}`).emit('location-update', locationData);

  res.json({
    success: true,
    message: 'Location updated',
    location: locationData
  });
});

// ── GET /api/location/:userId ──
// Family member polls this to get latest location
// No auth required — family gets the link from the SOS alert
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const location = liveLocations[userId];

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'No active location found for this user. They may have stopped sharing.'
    });
  }

  // Check if location is stale (older than 2 minutes)
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const isStale = new Date(location.updatedAt) < twoMinutesAgo;

  res.json({
    success: true,
    location: {
      ...location,
      isLive: !isStale,
      warning: isStale ? 'Location may be outdated. Last update was more than 2 minutes ago.' : null
    }
  });
});

// ── POST /api/location/stop ──
// Header: x-user-id
// User manually stops sharing their live location
router.post('/stop', authMiddleware, (req, res) => {
  delete liveLocations[req.user.id];

  // Notify family members that tracking has stopped
  req.io.to(`family-${req.user.id}`).emit('tracking-stopped', {
    userId: req.user.id,
    message: `${req.user.name} has stopped sharing their location.`
  });

  res.json({
    success: true,
    message: 'Location sharing stopped'
  });
});

module.exports = router;
