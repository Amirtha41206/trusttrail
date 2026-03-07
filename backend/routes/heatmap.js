// ============================================================
//  trusttrail — Safety Heatmap Routes
//  GET  /api/heatmap           → Get all heatmap data points
//  GET  /api/heatmap/risk      → Get risk level for a specific location
//  GET  /api/heatmap/alerts    → Get recent area alerts
// ============================================================

const express = require('express');
const router = express.Router();
const { safetyReports } = require('../config/db');

// ── Helper: Calculate risk level based on report count ──
function getRiskLevel(count) {
  if (count >= 4) return { level: 'high',     color: 'red',    label: '🔴 High Risk' };
  if (count >= 2) return { level: 'moderate', color: 'yellow', label: '🟡 Moderate Risk' };
  return             { level: 'safe',     color: 'green',  label: '🟢 Safe' };
}

// ── Helper: Calculate distance between two GPS coordinates (km) ──
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GET /api/heatmap ──
// Returns all safety report clusters for the heatmap
// Varsha uses this to paint the colored zones on the map
router.get('/', (_req, res) => {
  const heatmapPoints = safetyReports.map(report => ({
    id: report.id,
    lat: report.lat,
    lng: report.lng,
    area: report.area,
    incidentCount: report.count,
    risk: getRiskLevel(report.count),
    latestReport: report.timestamp
  }));

  res.json({
    success: true,
    count: heatmapPoints.length,
    heatmap: heatmapPoints
  });
});

// ── GET /api/heatmap/risk?lat=xx&lng=xx ──
// Returns risk level for the user's current location
// Called when user opens the map so app can show warning
router.get('/risk', (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng query params are required. Example: /api/heatmap/risk?lat=13.08&lng=80.27'
    });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  // Find reports within 1km of user's location
  const nearbyReports = safetyReports.filter(report => {
    const distance = getDistanceKm(userLat, userLng, report.lat, report.lng);
    return distance <= 1.0; // Within 1 km
  });

  const totalNearbyCount = nearbyReports.reduce((sum, r) => sum + r.count, 0);
  const risk = getRiskLevel(totalNearbyCount);

  const response = {
    success: true,
    location: { lat: userLat, lng: userLng },
    risk,
    nearbyIncidents: nearbyReports.length,
    message: totalNearbyCount === 0
      ? ' Your current area looks safe based on community reports.'
      : ` ${totalNearbyCount} incident(s) reported near you. Stay alert!`
  };

  // Add specific warnings if high risk
  if (risk.level === 'high') {
    response.warning = '🔴 HIGH RISK AREA — Multiple incidents reported nearby. Please stay in a well-lit public place and let someone know your location.';
  }

  res.json(response);
});

// ── GET /api/heatmap/alerts ──
// Returns recent alerts for display in the app notification bar
router.get('/alerts', (_req, res) => {
  // Get reports from the last 24 hours (all for demo since we use seed data)
  const recentReports = safetyReports
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const alerts = recentReports.map(r => ({
    area: r.area,
    type: r.type.replace(/_/g, ' '),
    risk: getRiskLevel(r.count),
    message: `${getRiskLevel(r.count).label} in ${r.area} — ${r.count} incident(s) reported`
  }));

  res.json({
    success: true,
    alerts
  });
});

module.exports = router;
