const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

// CONFIGURATION (Injected by IBM Cloud)
const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";
const REGISTRY_URL = process.env.REGISTRY_URL || "http://localhost:8080";
// We need to know OUR own URL to tell the registry
const MY_URL = process.env.MY_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// DATA STORES
const db = {
  profile: {},
  tickets: [],
  posts: [],
  appointments: {}, 
  counseling: { active: false }
};

// --- LOGIC SWITCHER ---

if (SERVICE_NAME === 'profile') {
  app.get('/profile/:user', (req, res) => {
    const p = db.profile[req.params.user] || { name: "", email: "", bio: "" };
    res.json(p);
  });
  app.post('/profile/:user', (req, res) => {
    db.profile[req.params.user] = req.body;
    res.json({ success: true });
  });
}

if (SERVICE_NAME === 'tickets') {
  app.get('/tickets', (req, res) => res.json(db.tickets));
  app.post('/tickets', (req, res) => {
    const t = { ...req.body, id: Math.random().toString(36).substr(2, 5).toUpperCase(), status: 'OPEN' };
    db.tickets.push(t);
    res.json(t);
  });
  app.post('/tickets/:id/pickup', (req, res) => {
    const t = db.tickets.find(x => x.id === req.params.id);
    if (t) {
      t.status = 'PICKED_UP';
      t.counselorName = req.body.counselorName;
      res.json(t);
    } else {
      res.status(404).send("Not found");
    }
  });
}

if (SERVICE_NAME === 'board') {
  app.get('/posts', (req, res) => res.json(db.posts));
  app.post('/posts', (req, res) => {
    const p = { ...req.body, id: Date.now().toString() };
    db.posts.unshift(p);
    res.json(p);
  });
}

if (SERVICE_NAME === 'appointments') {
  app.get('/appointments/:ticketId', (req, res) => {
    res.json(db.appointments[req.params.ticketId] || null);
  });
  app.post('/appointments', (req, res) => {
    const { ticketId, studentSlot, hasVisited } = req.body;
    const existing = db.appointments[ticketId] || {};
    db.appointments[ticketId] = { ...existing, ticketId, studentSlot, hasVisited };
    res.json(db.appointments[ticketId]);
  });
}

if (SERVICE_NAME === 'counseling') {
  app.get('/status', (req, res) => res.json(db.counseling));
  app.post('/toggle', (req, res) => {
    db.counseling.active = !db.counseling.active;
    res.json(db.counseling);
  });
}

const registerSelf = async () => {
  console.log(`[${SERVICE_NAME}] Attempting to register with ${REGISTRY_URL}...`);
  try {
    await axios.post(`${REGISTRY_URL}/register`, {
      name: SERVICE_NAME,
      url: MY_URL
    });
    console.log(`[${SERVICE_NAME}] SUCCESS! Registered as ${MY_URL}`);
  } catch (e) {
    console.log(`[${SERVICE_NAME}] Registry not ready (${e.message}). Retrying in 5s...`);
    setTimeout(registerSelf, 5000);
  }
};

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
  registerSelf();
});
