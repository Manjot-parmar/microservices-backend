const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// STORE: Keeps track of services { "tickets": { url: "...", status: "UP" } }
let services = {};

// 1. DISCOVERY: Frontend asks "Where are the services?"
app.get('/discover', (req, res) => {
  res.json(services);
});

// 2. REGISTRATION: Services call this to say "I am here!"
app.post('/register', (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) return res.status(400).send("Missing info");
  
  services[name] = { url, status: 'UP', lastSeen: new Date() };
  console.log(`[REGISTRY] Registered service: ${name} at ${url}`);
  res.send("Registered");
});

// 3. ADMIN: Toggle a service UP or DOWN
app.post('/admin/toggle', (req, res) => {
  const { name } = req.body;
  if (services[name]) {
    services[name].status = services[name].status === 'UP' ? 'DOWN' : 'UP';
    console.log(`[ADMIN] Toggled ${name} to ${services[name].status}`);
    res.json(services[name]);
  } else {
    res.status(404).send("Service not found");
  }
});

app.listen(PORT, () => {
  console.log(`S0 Registry running on port ${PORT}`);
});
