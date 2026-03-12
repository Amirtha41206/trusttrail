// ============================================================
//  trusttrail — In-Memory Database
//  No Firebase/Supabase setup needed for hackathon demo.
//  All data lives here while the server is running.
//  Just restart the server to reset all data.
// ============================================================

// ── Users ──
const users = [
  {
    id: 'user-001',
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya@example.com',
    password: 'hashed_password_here', // In real app: use bcrypt
    emergencyContacts: [
      { name: 'Amma', phone: '7558187083' },
      { name: 'Sister', phone: '7200461781' }
    ],
    createdAt: new Date()
  }
];

// ── SOS Alerts ──
const sosAlerts = [];

// ── Live Locations (latest location per user) ──
const liveLocations = {};

// ── Safety Reports (anonymous) ──
const safetyReports = [
  // Seed data for demo heatmap
  { id: 'r001', type: 'harassment', lat: 13.0827, lng: 80.2707, area: 'Anna Nagar', timestamp: new Date(), count: 3 },
  { id: 'r002', type: 'suspicious_activity', lat: 13.0569, lng: 80.2425, area: 'T.Nagar', timestamp: new Date(), count: 1 },
  { id: 'r003', type: 'unsafe_driver', lat: 13.1067, lng: 80.2206, area: 'Ambattur', timestamp: new Date(), count: 5 },
  { id: 'r004', type: 'being_followed', lat: 13.0358, lng: 80.2622, area: 'Adyar', timestamp: new Date(), count: 2 },
  { id: 'r005', type: 'harassment', lat: 13.0732, lng: 80.2609, area: 'Egmore', timestamp: new Date(), count: 4 },
];

// ── Trusted Travellers ──
const trustedTravellers = [
  // Seed data for demo
  {
    id: 'tt-001',
    name: 'Ravi Kumar',
    type: 'auto_driver',
    vehicleNumber: 'TN09 AB1234',
    phone: '9876511111',
    area: 'Anna Nagar',
    recommendedBy: 5,
    recommenders: ['user-001'],
    rating: 4.8,
    verified: true,
    createdAt: new Date()
  },
  {
    id: 'tt-002',
    name: 'Murugan Transports',
    type: 'cab',
    vehicleNumber: 'TN22 XY9876',
    phone: '9876522222',
    area: 'T.Nagar',
    recommendedBy: 8,
    recommenders: [],
    rating: 4.5,
    verified: true,
    createdAt: new Date()
  },
  {
    id: 'tt-003',
    name: 'Lakshmi Homestay',
    type: 'homestay',
    vehicleNumber: null,
    phone: '9876533333',
    area: 'Mylapore',
    recommendedBy: 12,
    recommenders: [],
    rating: 4.9,
    verified: true,
    createdAt: new Date()
  },
  {
    id: 'tt-004',
    name: 'Selvi Safe Shop',
    type: 'safe_shop',
    vehicleNumber: null,
    phone: '9876544444',
    area: 'Adyar',
    recommendedBy: 3,
    recommenders: [],
    rating: 4.6,
    verified: false,
    createdAt: new Date()
  }
];

// ── Complaints ──
const complaints = [];

// ── Evidence Files (stored as metadata, files go to /uploads) ──
const evidenceFiles = [];

// ── Helper: Generate simple IDs ──
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

module.exports = {
  users,
  sosAlerts,
  liveLocations,
  safetyReports,
  trustedTravellers,
  complaints,
  evidenceFiles,
  generateId
};
