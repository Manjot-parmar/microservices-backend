// reg.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// STATIC SERVICE MAP
// Pre-populate with all known services so /discover is never {}.
let services = {
  profile: {
    url: 'https://s1-profile.onrender.com',
    status: 'DOWN',
    lastSeen: new Date()
  },
  tickets: {
    url: 'https://s2-tickets.onrender.com',
    status: 'DOWN',
    lastSeen: new Date()
  },
  board: {
    url: 'https://s3-board.onrender.com',
    status: 'DOWN',
    lastSeen: new Date()
  },
  appointments: {
    url: 'https://s4-appointments.onrender.com',
    status: 'DOWN',
    lastSeen: new Date()
  },
  counseling: {
    url: 'https://s5-counseling.onrender.com',
    status: 'DOWN',
    lastSeen: new Date()
  }
};

// 1. DISCOVERY: 
app.get('/discover', (req, res) => {
  res.json(services);
});

// 2. REGISTRATION:
app.post('/register', (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    return res.status(400).send('Missing info');
  }

  services[name] = {
    ...(services[name] || {}),
    url,
    status: 'UP',
    lastSeen: new Date()
  };

  console.log(`[REGISTRY] Registered service: ${name} at ${url}`);
  res.send('Registered');
});

// 3. ADMIN: toggle a service UP or DOWN
app.post('/admin/toggle', (req, res) => {
  const { name } = req.body;
  const svc = services[name];

  if (!svc) {
    return res.status(404).send('Service not found');
  }

  svc.status = svc.status === 'UP' ? 'DOWN' : 'UP';
  console.log(`[ADMIN] Toggled ${name} to ${svc.status}`);
  res.json(svc);
});

app.listen(PORT, () => {
  console.log(`S0 Registry running on port ${PORT}`);
});

