// ============================================================
//  trusttrail — Trusted Traveller Network Routes  MAIN FEATURE
//
//  GET    /api/trusted-traveller            → List all / search
//  POST   /api/trusted-traveller            → Add new listing
//  POST   /api/trusted-traveller/:id/recommend → Recommend someone
//  GET    /api/trusted-traveller/:id        → Get single listing
//  GET    /api/trusted-traveller/types      → Get all types
// ============================================================

const express = require('express');
const router = express.Router();
const { trustedTravellers, generateId } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Valid listing types
const VALID_TYPES = ['auto_driver', 'cab', 'homestay', 'safe_shop', 'other'];

// ── GET /api/trusted-traveller ──
// Query params: type, area, search (name/vehicle)
// Returns all listings, optionally filtered
router.get('/', (req, res) => {
  const { type, area, search } = req.query;

  let results = [...trustedTravellers];

  // Filter by type (auto_driver, cab, homestay, safe_shop)
  if (type) {
    results = results.filter(t => t.type === type);
  }

  // Filter by area (partial match, case-insensitive)
  if (area) {
    results = results.filter(t =>
      t.area.toLowerCase().includes(area.toLowerCase())
    );
  }

  // Search by name or vehicle number
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(q))
    );
  }

  // Sort by most recommended first
  results.sort((a, b) => b.recommendedBy - a.recommendedBy);

  res.json({
    success: true,
    count: results.length,
    listings: results.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type.replace(/_/g, ' '),
      vehicleNumber: t.vehicleNumber,
      area: t.area,
      recommendedBy: t.recommendedBy,
      rating: t.rating,
      verified: t.verified
    }))
  });
});

// ── GET /api/trusted-traveller/types ──
// Returns all available listing types
router.get('/types', (_req, res) => {
  res.json({
    success: true,
    types: [
      { value: 'auto_driver', label: ' Auto Driver' },
      { value: 'cab',         label: ' Cab / Taxi' },
      { value: 'homestay',    label: ' Homestay' },
      { value: 'safe_shop',   label: ' Safe Shop' },
      { value: 'other',       label: ' Other' }
    ]
  });
});

// ── GET /api/trusted-traveller/:id ──
// Get full details of a single listing
router.get('/:id', (req, res) => {
  const listing = trustedTravellers.find(t => t.id === req.params.id);

  if (!listing) {
    return res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
  }

  res.json({
    success: true,
    listing: {
      id: listing.id,
      name: listing.name,
      type: listing.type.replace(/_/g, ' '),
      vehicleNumber: listing.vehicleNumber,
      phone: listing.phone,
      area: listing.area,
      recommendedBy: listing.recommendedBy,
      rating: listing.rating,
      verified: listing.verified,
      addedAt: listing.createdAt
    }
  });
});

// ── POST /api/trusted-traveller ──
// Header: x-user-id
// Body: { name, type, vehicleNumber, phone, area }
// Add a new trusted traveller listing
router.post('/', authMiddleware, (req, res) => {
  const { name, type, vehicleNumber, phone, area } = req.body;

  if (!name || !type || !area) {
    return res.status(400).json({
      success: false,
      message: 'name, type, and area are required fields'
    });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `type must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  // Check for duplicate vehicle number
  if (vehicleNumber) {
    const duplicate = trustedTravellers.find(
      t => t.vehicleNumber && t.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `This vehicle (${vehicleNumber}) is already listed as "${duplicate.name}". You can recommend the existing listing instead!`
      });
    }
  }

  const newListing = {
    id: generateId('tt'),
    name,
    type,
    vehicleNumber: vehicleNumber || null,
    phone: phone || null,
    area,
    recommendedBy: 1, // The person adding it counts as first recommendation
    recommenders: [req.user.id],
    rating: 5.0,
    verified: false, // Starts unverified until more women recommend
    createdAt: new Date()
  };

  trustedTravellers.push(newListing);

  res.status(201).json({
    success: true,
    message: ` ${name} has been added to the Trusted Traveller Network! Thank you for keeping the community safe 🌸`,
    listing: {
      id: newListing.id,
      name: newListing.name,
      type: newListing.type,
      area: newListing.area,
      recommendedBy: newListing.recommendedBy
    }
  });
});

// ── POST /api/trusted-traveller/:id/recommend ──
// Header: x-user-id
// A user recommends an existing listing (upvote)
router.post('/:id/recommend', authMiddleware, (req, res) => {
  const listing = trustedTravellers.find(t => t.id === req.params.id);

  if (!listing) {
    return res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
  }

  // Check if user already recommended this listing
  if (listing.recommenders.includes(req.user.id)) {
    return res.status(400).json({
      success: false,
      message: 'You have already recommended this listing. Each woman can recommend once.'
    });
  }

  // Add recommendation
  listing.recommenders.push(req.user.id);
  listing.recommendedBy = listing.recommenders.length;

  // Auto-verify if 5+ women have recommended
  if (listing.recommendedBy >= 5 && !listing.verified) {
    listing.verified = true;
    console.log(` ${listing.name} is now VERIFIED by community trust (5+ recommendations)`);
  }

  res.json({
    success: true,
    message: `💜 Your recommendation for ${listing.name} has been recorded! They now have ${listing.recommendedBy} recommendation(s).`,
    recommendedBy: listing.recommendedBy,
    verified: listing.verified,
    verificationMessage: listing.verified
      ? ' This traveller is now Community Verified!'
      : `${5 - listing.recommendedBy} more recommendations needed for verification badge`
  });
});

module.exports = router;
