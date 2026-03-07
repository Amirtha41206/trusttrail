// ============================================================
//  trusttrail — AI Auto Complaint Generator Routes
//  POST /api/complaint/generate  → Generate a structured complaint
//  GET  /api/complaint/templates → Get complaint templates
// ============================================================

const express = require('express');
const router = express.Router();
const { complaints, generateId } = require('../config/db');

// ── Complaint templates per incident type ──
// These simulate what an AI would generate.
// In production: call OpenAI / Gemini API here.
const COMPLAINT_TEMPLATES = {
  harassment: {
    subject: 'Complaint Regarding Harassment Incident',
    body: (data) =>
      `To Whom It May Concern,\n\nI am writing to formally report a harassment incident that occurred on ${data.date} at approximately ${data.time} near ${data.location}.\n\n${data.description ? `Details of the incident: ${data.description}\n\n` : ''}I request that immediate action be taken to investigate this matter and ensure the safety of women in this area.\n\nThis report was submitted via TRUSTTRAIL Women Safety App.\n\nSincerely,\nA concerned citizen`,
    authority: `Local Police Station / Women's Helpline 1091`
  },
  unsafe_driver: {
    subject: 'Complaint Against Unsafe Driver',
    body: (data) =>
      `To Whom It May Concern,\n\nI wish to report an unsafe driver incident on ${data.date} at ${data.time} near ${data.location}.\n\n${data.vehicleNumber ? `Vehicle Number: ${data.vehicleNumber}\n` : ''}${data.description ? `Incident Description: ${data.description}\n\n` : ''}I urge the concerned authorities to investigate this vehicle and take necessary action to protect commuters.\n\nThis complaint was generated via TRUSTTRAIL Women Safety App.\n\nRegards,\nA concerned user`,
    authority: 'Transport Department / Police Control Room 100'
  },
  being_followed: {
    subject: 'Report of Stalking / Being Followed',
    body: (data) =>
      `To Whom It May Concern,\n\nI am reporting an incident of stalking/being followed that occurred on ${data.date} at approximately ${data.time} in the area of ${data.location}.\n\n${data.description ? `Description: ${data.description}\n\n` : ''}This behavior is threatening and I request immediate intervention and patrol in the mentioned area.\n\nThis report was submitted via TRUSTTRAIL Women Safety App.\n\nSincerely,\nA concerned citizen`,
    authority: 'Nearest Police Station / Women\'s Helpline 1091'
  },
  suspicious_activity: {
    subject: 'Report of Suspicious Activity',
    body: (data) =>
      `To Whom It May Concern,\n\nI would like to report suspicious activity observed on ${data.date} at ${data.time} near ${data.location}.\n\n${data.description ? `Observation: ${data.description}\n\n` : ''}I request that authorities investigate and increase surveillance in this area for the safety of residents.\n\nThis report was submitted via TRUSTTRAIL Women Safety App.`,
    authority: 'Local Police Station / PCR 100'
  },
  other: {
    subject: 'Safety Incident Report',
    body: (data) =>
      `To Whom It May Concern,\n\nI am writing to report a safety incident that occurred on ${data.date} at ${data.time} near ${data.location}.\n\n${data.description ? `Details: ${data.description}\n\n` : ''}I request appropriate action to be taken.\n\nThis report was submitted via TRUSTTRAIL Women Safety App.`,
    authority: 'Local Police Station'
  }
};

// ── POST /api/complaint/generate ──
// Body: { incidentType, location, date, time, vehicleNumber, description }
// No auth required — anyone can generate a complaint draft
router.post('/generate', (req, res) => {
  const { incidentType, location, date, time, vehicleNumber, description } = req.body;

  if (!incidentType || !location) {
    return res.status(400).json({
      success: false,
      message: 'incidentType and location are required to generate a complaint'
    });
  }

  const template = COMPLAINT_TEMPLATES[incidentType] || COMPLAINT_TEMPLATES['other'];

  const complaintData = {
    date: date || new Date().toLocaleDateString('en-IN'),
    time: time || new Date().toLocaleTimeString('en-IN'),
    location,
    vehicleNumber: vehicleNumber || null,
    description: description || null
  };

  const generatedComplaint = {
    id: generateId('complaint'),
    incidentType,
    subject: template.subject,
    body: template.body(complaintData),
    authority: template.authority,
    generatedAt: new Date(),
    metadata: complaintData
  };

  complaints.push(generatedComplaint);

  res.status(201).json({
    success: true,
    message: 'Complaint generated successfully. You can copy and send this to the authorities.',
    complaint: generatedComplaint
  });
});

// ── GET /api/complaint/templates ──
// Returns available incident types for the frontend dropdown
router.get('/templates', (_req, res) => {
  res.json({
    success: true,
    incidentTypes: [
      { value: 'harassment',          label: ' Harassment' },
      { value: 'unsafe_driver',       label: ' Unsafe Driver' },
      { value: 'being_followed',      label: ' Being Followed / Stalking' },
      { value: 'suspicious_activity', label: ' Suspicious Activity' },
      { value: 'other',               label: ' Other Incident' }
    ],
    authorities: {
      police:          'Police Control Room: 100',
      womens_helpline: 'Women\'s Helpline: 1091',
      ambulance:       'Ambulance: 108',
      child_helpline:  'Child Helpline: 1098'
    }
  });
});

module.exports = router;
