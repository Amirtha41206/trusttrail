// ============================================================
//  trusttrail — SOS Routes
//  POST /api/sos/trigger  → Trigger SOS alert
//  GET  /api/sos/active   → Get all active SOS alerts
//  POST /api/sos/resolve  → Mark SOS as resolved
// ============================================================

const express = require('express');
const router = express.Router();
const { sosAlerts, users, generateId } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ── POST /api/sos/trigger ──
// Header: x-user-id
// Body: { lat, lng, message (optional) }
router.post('/trigger', authMiddleware, (req, res) => {
  const { lat, lng, message } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng (GPS coordinates) are required to trigger SOS'
    });
  }

  const user = req.user;

  // Build the SOS alert object
  const sosAlert = {
    id: generateId('sos'),
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    message: message || ` EMERGENCY ALERT from ${user.name}`,
    status: 'active',
    emergencyContacts: user.emergencyContacts,
    triggeredAt: new Date(),
    resolvedAt: null
  };

  sosAlerts.push(sosAlert);

  // ── Emit real-time SOS event to all connected clients ──
  req.io.emit('sos-triggered', {
    alertId: sosAlert.id,
    userName: user.name,
    lat: sosAlert.lat,
    lng: sosAlert.lng,
    timestamp: sosAlert.triggeredAt
  });

  // ── Simulate sending SMS to emergency contacts ──
  // In production: integrate Twilio or MSG91 here
  const notificationsSent = user.emergencyContacts.map(contact => ({
    name: contact.name,
    phone: contact.phone,
    message: `trusttrail ALERT: ${user.name} needs help! Track live location: http://trusttrail.app/track/${user.id}`,
    status: 'sent (simulated)'
  }));

  console.log(` SOS TRIGGERED by ${user.name} at ${lat}, ${lng}`);
  console.log(`📱 Notified ${notificationsSent.length} emergency contacts`);

  res.status(201).json({
    success: true,
    message: ' SOS Alert sent! Your emergency contacts have been notified.',
    alertId: sosAlert.id,
    location: { lat: sosAlert.lat, lng: sosAlert.lng },
    notificationsSent,
    trackingLink: `http://trusttrail.app/track/${user.id}`
  });
});

// ── GET /api/sos/active ──
// Returns all currently active SOS alerts (for dashboard/admin view)
router.get('/active', (req, res) => {
  const activeAlerts = sosAlerts.filter(a => a.status === 'active');

  res.json({
    success: true,
    count: activeAlerts.length,
    alerts: activeAlerts.map(a => ({
      id: a.id,
      userName: a.userName,
      lat: a.lat,
      lng: a.lng,
      triggeredAt: a.triggeredAt,
      message: a.message
    }))
  });
});

// ── POST /api/sos/resolve ──
// Header: x-user-id
// Body: { alertId }
router.post('/resolve', authMiddleware, (req, res) => {
  const { alertId } = req.body;

  const alert = sosAlerts.find(a => a.id === alertId && a.userId === req.user.id);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'SOS alert not found'
    });
  }

  alert.status = 'resolved';
  alert.resolvedAt = new Date();

  // Notify connected clients that SOS is resolved
  req.io.emit('sos-resolved', { alertId });

  res.json({
    success: true,
    message: 'SOS alert resolved. Stay safe! ',
    resolvedAt: alert.resolvedAt
  });
});

module.exports = router;
