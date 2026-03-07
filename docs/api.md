# TRUSTTRAIL — API Documentation
### Written by Amirtha S S 
### Base URL: http://localhost:3000

---

## How to Call These APIs from the Frontend

All requests need this header when the user is logged in:
```
x-user-id: user-001
```

---

## 1. AUTH

### Register
```
POST /api/auth/register
Body: { "name": "Priya", "phone": "9876543210", "password": "mypassword" }
Returns: { userId, name }
```

### Login
```
POST /api/auth/login
Body: { "phone": "9876543210", "password": "mypassword" }
Returns: { userId, name }   ← SAVE userId in app state
```

### Update Emergency Contacts
```
PUT /api/auth/emergency-contacts
Header: x-user-id
Body: { "contacts": [{ "name": "Amma", "phone": "9876500001" }] }
```

---

## 2. SOS 

### Trigger SOS
```
POST /api/sos/trigger
Header: x-user-id
Body: { "lat": 13.0827, "lng": 80.2707 }
Returns: { alertId, trackingLink, notificationsSent }
```

### Resolve SOS (user is safe)
```
POST /api/sos/resolve
Header: x-user-id
Body: { "alertId": "sos-xxx" }
```

---

## 3. LIVE LOCATION 

### Send location update (call every 5 seconds during SOS)
```
POST /api/location/update
Header: x-user-id
Body: { "lat": 13.0827, "lng": 80.2707 }
```

### Get someone's live location (for family tracking page)
```
GET /api/location/:userId
No auth needed
Returns: { lat, lng, updatedAt, isLive }
```

### Stop sharing location
```
POST /api/location/stop
Header: x-user-id
```

---

## 4. SAFETY HEATMAP 

### Get all heatmap points (paint the colored zones)
```
GET /api/heatmap
Returns: array of { lat, lng, area, risk: { level, color, label } }
```

### Get risk level for current location
```
GET /api/heatmap/risk?lat=13.08&lng=80.27
Returns: { risk, message, warning }
```

### Get recent area alerts (for notification bar)
```
GET /api/heatmap/alerts
Returns: array of { area, risk, message }
```

---

## 5. TRUSTED TRAVELLER NETWORK 

### Get all listings (with optional filters)
```
GET /api/trusted-traveller
GET /api/trusted-traveller?type=auto_driver
GET /api/trusted-traveller?area=Anna Nagar
GET /api/trusted-traveller?search=Ravi
Returns: array of listings sorted by most recommended
```

### Get listing types (for dropdown)
```
GET /api/trusted-traveller/types
```

### Add new listing
```
POST /api/trusted-traveller
Header: x-user-id
Body: { "name": "Ravi", "type": "auto_driver", "vehicleNumber": "TN09 AB1234", "area": "Anna Nagar" }
```

### Recommend an existing listing
```
POST /api/trusted-traveller/:id/recommend
Header: x-user-id
Returns: { recommendedBy, verified }
```

---

## 6. ANONYMOUS SAFETY REPORT 

### Submit a report
```
POST /api/report
Body: { "type": "harassment", "lat": 13.0827, "lng": 80.2707, "area": "Anna Nagar" }
No auth needed — fully anonymous
Types: being_followed | harassment | unsafe_driver | suspicious_activity | other
```

### Get all reports (for community map)
```
GET /api/report
```

---

## 7. COMPLAINT GENERATOR 

### Get incident types (for dropdown)
```
GET /api/complaint/templates
```

### Generate complaint
```
POST /api/complaint/generate
Body: { "incidentType": "harassment", "location": "Anna Nagar Metro", "time": "9:45 PM" }
Returns: { subject, body, authority }  ← Show this in a text box the user can copy
```

---

## 8. EVIDENCE UPLOAD 

### Upload evidence
```
POST /api/evidence/upload
Header: x-user-id
Form-data: file (photo/video/audio), incidentType, location
Returns: { evidenceId }
```

---

## REAL-TIME (Socket.io)

Connect to: `http://localhost:3000`

```javascript
// User sharing location
socket.emit('share-location', { userId, lat, lng })

// Family member watching
socket.emit('watch-user', { userId })
socket.on('location-update', ({ lat, lng }) => { ... })

// SOS events
socket.on('sos-triggered', ({ userName, lat, lng }) => { ... })
socket.on('sos-resolved', ({ alertId }) => { ... })
```
