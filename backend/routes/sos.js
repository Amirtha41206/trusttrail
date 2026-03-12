const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');

// Send SMS using MSG91
async function sendSMS(phone, message) {
  try {
    const response = await axios.get('https://api.msg91.com/api/sendhttp.php', {
      params: {
        authkey: process.env.MSG91_API_KEY,
        mobiles: `91${phone}`,
        message: message,
        sender: 'MGALRT',
        route: '4',
        country: '91'
      }
    });
    return { success: true, response: response.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Trigger SOS
router.post('/trigger', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { lat, lng } = req.body;

  if (!userId) return res.status(401).json({ success: false, message: 'User ID required' });

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const alertId = `sos-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const trackingLink = `http://trusttrail.app/track/${userId}`;
  const notifications = [];

  for (const contact of user.emergencyContacts) {
    const message = `🚨 URGENT: Your loved one ${user.name} is in DANGER and needs immediate help! She has triggered an emergency SOS alert. Her current location: https://maps.google.com/?q=${lat},${lng} - Please call her immediately or track her live at: ${trackingLink} - Sent via TrustTrail Women Safety App`;
    const result = await sendSMS(contact.phone, message);
    notifications.push({
      name: contact.name,
      phone: contact.phone,
      status: result.success ? 'sent ✅' : 'failed ❌',
      error: result.error || null
    });
  }

  res.json({
    success: true,
    message: '🚨 SOS Alert sent!',
    alertId,
    location: { lat, lng },
    notificationsSent: notifications,
    trackingLink
  });
});

// Resolve SOS
router.post('/resolve', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ success: false, message: 'User ID required' });
  res.json({ success: true, message: 'SOS resolved. Stay safe! 🌸' });
});

module.exports = router;