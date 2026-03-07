// ============================================================
//  trusttrail — Evidence Capture Routes
//  POST /api/evidence/upload  → Upload photo/video/audio evidence
//  GET  /api/evidence/:id     → Get evidence metadata
// ============================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { evidenceFiles, generateId } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ── Setup upload directory ──
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config — accept images, video, audio ──
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|aac|m4a/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos, and audio files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// ── POST /api/evidence/upload ──
// Header: x-user-id
// Form-data: file (the media), incidentType, location (optional), description (optional)
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please attach a photo, video, or audio file.'
    });
  }

  const { incidentType, location, description } = req.body;

  const evidence = {
    id: generateId('evidence'),
    userId: req.user.id,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    incidentType: incidentType || 'unspecified',
    location: location || null,
    description: description || null,
    uploadedAt: new Date()
  };

  evidenceFiles.push(evidence);

  res.status(201).json({
    success: true,
    message: '📎 Evidence uploaded and secured. This can be used to support your complaint.',
    evidenceId: evidence.id,
    fileType: evidence.fileType,
    uploadedAt: evidence.uploadedAt,
    tip: 'You can reference this evidence ID in your complaint report.'
  });
});

// ── GET /api/evidence/:id ──
// Header: x-user-id
router.get('/:id', authMiddleware, (req, res) => {
  const evidence = evidenceFiles.find(
    e => e.id === req.params.id && e.userId === req.user.id
  );

  if (!evidence) {
    return res.status(404).json({
      success: false,
      message: 'Evidence not found or you do not have access to it.'
    });
  }

  res.json({
    success: true,
    evidence: {
      id: evidence.id,
      originalName: evidence.originalName,
      fileType: evidence.fileType,
      incidentType: evidence.incidentType,
      location: evidence.location,
      uploadedAt: evidence.uploadedAt
    }
  });
});

// ── Error handler for multer file size/type errors ──
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 50MB.' });
  }
  res.status(400).json({ success: false, message: err.message });
});

module.exports = router;
