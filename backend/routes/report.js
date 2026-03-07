// ============================================================
//  trusttrail — Anonymous Safety Reporting Routes
//  POST /api/report        → Submit an anonymous incident report
//  GET  /api/report        → Get all reports (for map)
//  GET  /api/report/nearby → Get reports near a location
// ============================================================

const express = require('express');
const router = express.Router();
const { safetyReports, generateId } = require('../config/db');

const VALID_INCIDENT_TYPES = [
  'being_followed',
  'harassment',
  'unsafe_driver',
  'suspicious_activity',
  'poor_lighting',
  'other'
];

// ── POST /api/report ──
// Body: { type, lat, lng, area, description (optional) }
// No auth required — reports are fully anonymous
router.post('/', (req, res) => {
  const { type, lat, lng, area, description } = req.body;

  if (!type || !lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'type, lat, and lng are required for reporting'
    });
  }

  if (!VALID_INCIDENT_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `type must be one of: ${VALID_INCIDENT_TYPES.join(', ')}`
    });
  }

  const reportLat = parseFloat(lat);
  const reportLng = parseFloat(lng);

  // Check if this area already has a report cluster (within 500m)
  const CLUSTER_RADIUS_KM = 0.5;
  function distKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const existingCluster = safetyReports.find(r =>
    r.type === type && distKm(reportLat, reportLng, r.lat, r.lng) < CLUSTER_RADIUS_KM
  );

  if (existingCluster) {
    // Increment existing cluster count instead of creating duplicate
    existingCluster.count += 1;
    existingCluster.timestamp = new Date();

    return res.status(200).json({
      success: true,
      message: '⚠️ Report submitted. This area has been flagged on the safety map.',
      clustered: true,
      areaReportCount: existingCluster.count,
      warning: existingCluster.count >= 4
        ? '🔴 This area has been marked HIGH RISK due to multiple reports.'
        : existingCluster.count >= 2
          ? '🟡 This area has been marked MODERATE RISK.'
          : null
    });
  }

  // Create new report point
  const newReport = {
    id: generateId('report'),
    type,
    lat: reportLat,
    lng: reportLng,
    area: area || 'Unknown Area',
    description: description || null,
    count: 1,
    timestamp: new Date()
    // NO userId stored — fully anonymous
  };

  safetyReports.push(newReport);

  res.status(201).json({
    success: true,
    message: ' Incident reported anonymously. Thank you for keeping the community safe 🌸',
    reportId: newReport.id,
    area: newReport.area
  });
});

// ── GET /api/report ──
// Returns all reports for the community map
router.get('/', (_req, res) => {
  res.json({
    success: true,
    count: safetyReports.length,
    reports: safetyReports.map(r => ({
      id: r.id,
      type: r.type.replace(/_/g, ' '),
      lat: r.lat,
      lng: r.lng,
      area: r.area,
      count: r.count,
      timestamp: r.timestamp
      // description is intentionally omitted from public list for privacy
    }))
  });
});

// ── GET /api/report/nearby?lat=xx&lng=xx&radius=1 ──
// Get reports near a specific location
router.get('/nearby', (req, res) => {
  const { lat, lng, radius = 1 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng are required'
    });
  }

  function distKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const nearby = safetyReports.filter(r =>
    distKm(parseFloat(lat), parseFloat(lng), r.lat, r.lng) <= parseFloat(radius)
  );

  res.json({
    success: true,
    count: nearby.length,
    reports: nearby
  });
});

module.exports = router;
