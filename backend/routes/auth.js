// ============================================================
//  trusttrail — Auth Routes
//  POST /api/auth/register  → Create new account
//  POST /api/auth/login     → Login and get userId
//  PUT  /api/auth/emergency-contacts → Update family contacts
// ============================================================

const express = require('express');
const router = express.Router();
const { users, generateId } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ── POST /api/auth/register ──
// Body: { name, phone, email, password }
router.post('/register', (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'name, phone, and password are required'
    });
  }

  // Check if phone already registered
  const existing = users.find(u => u.phone === phone);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'This phone number is already registered'
    });
  }

  const newUser = {
    id: generateId('user'),
    name,
    phone,
    email: email || '',
    password, // Note: In production, hash with bcrypt before storing
    emergencyContacts: [],
    createdAt: new Date()
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'Account created successfully! ',
    userId: newUser.id,
    name: newUser.name
  });
});

// ── POST /api/auth/login ──
// Body: { phone, password }
router.post('/login', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'phone and password are required'
    });
  }

  const user = users.find(u => u.phone === phone && u.password === password);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid phone number or password'
    });
  }

  res.json({
    success: true,
    message: 'Login successful! Welcome back ',
    userId: user.id,
    name: user.name
  });
});

// ── PUT /api/auth/emergency-contacts ──
// Header: x-user-id
// Body: { contacts: [{ name, phone }] }
router.put('/emergency-contacts', authMiddleware, (req, res) => {
  const { contacts } = req.body;

  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      message: 'contacts must be an array of { name, phone } objects'
    });
  }

  req.user.emergencyContacts = contacts;

  res.json({
    success: true,
    message: 'Emergency contacts updated successfully',
    contacts: req.user.emergencyContacts
  });
});

// ── GET /api/auth/profile ──
// Header: x-user-id
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      emergencyContacts: req.user.emergencyContacts
    }
  });
});

module.exports = router;
