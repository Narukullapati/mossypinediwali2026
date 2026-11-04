const express = require('express');
const path = require('path');
const fs = require('fs');
const { initStore, existingRsvp, saveRsvp, saveRegistration, listRsvps, listRegistrations, rsvpStats } = require('./db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mossypine';
const adminOnly = (req, res, next) =>
  req.headers['x-admin-password'] === ADMIN_PASSWORD
    ? next()
    : res.status(401).json({ error: 'Incorrect password' });

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, '..', 'dist', 'mossypine-diwali', 'browser');
const event = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'event.json'), 'utf8'));

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

app.get('/api/event', (req, res) => res.json(event.details));
app.get('/api/schedule', (req, res) => res.json(event.schedule));
app.get('/api/gallery', (req, res) => res.json(event.gallery));
app.get('/api/potluck', (req, res) => res.json(event.potluck));
app.get('/api/contact', (req, res) => res.json(event.contact));

app.get('/api/rsvp/stats', async (req, res) => {
  try {
    res.json(await rsvpStats());
  } catch (e) {
    res.status(500).json({ error: 'stats unavailable' });
  }
});

app.post('/api/rsvp', async (req, res) => {
  const b = req.body || {};
  // honeypot: silently accept so bots think it worked
  if (typeof b.website === 'string' && b.website.trim() !== '') {
    return res.json({ ok: true });
  }
  const errors = {};
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const phone = typeof b.phone === 'string' ? b.phone.trim().slice(0, 20) : '';
  const address = typeof b.address === 'string' ? b.address.trim().slice(0, 255) : '';
  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : '';
  const adults = Number.parseInt(b.adults, 10);
  const kids = Number.parseInt(b.kids, 10);
  const guests = (Number.isInteger(adults) ? adults : 0) + (Number.isInteger(kids) ? kids : 0);
  const volunteer = b.volunteer === true || b.volunteer === 'true' || b.volunteer === 1;
  if (!name || name.length > 120) errors.name = 'Please tell us your name.';
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190))
    errors.email = 'Please enter a valid email address.';
  if (!phone || !/^[+()\-.\s\d]{7,20}$/.test(phone)) errors.phone = 'Please enter a valid phone number.';
  if (!address) errors.address = 'Please add your house address.';
  if (!Number.isInteger(adults) || adults < 1 || adults > 50)
    errors.adults = 'Adults must be between 1 and 50.';
  if (!Number.isInteger(kids) || kids < 0 || kids > 50)
    errors.kids = 'Kids must be between 0 and 50.';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });
  try {
    const dup = await existingRsvp(email, address);
    if (dup.email) errors.email = 'An RSVP already exists for this email.';
    if (dup.address) errors.address = 'An RSVP already exists for this address.';
    if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });
    const result = await saveRsvp({ name, email, phone, address, adults, kids, guests, volunteer, notes });
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Could not save your RSVP — please try again.' });
  }
});

app.post('/api/register', async (req, res) => {
  const b = req.body || {};
  const type = b.type === 'food' ? 'food' : 'cultural';
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const phone = typeof b.phone === 'string' ? b.phone.trim().slice(0, 20) : '';
  const details = typeof b.details === 'string' ? b.details.trim().slice(0, 500) : '';
  const errors = {};
  if (!name || name.length > 120) errors.name = 'Please tell us your name.';
  if (!details) errors.details = 'Please add the details.';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });
  try {
    const result = await saveRegistration({ type, name, phone, details });
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Could not save — please try again.' });
  }
});

app.get('/api/admin/rsvps', adminOnly, async (req, res) => {
  try { res.json(await listRsvps()); } catch { res.status(500).json({ error: 'unavailable' }); }
});
app.get('/api/admin/registrations', adminOnly, async (req, res) => {
  try { res.json(await listRegistrations()); } catch { res.status(500).json({ error: 'unavailable' }); }
});

app.use(express.static(DIST, { index: 'index.html', maxAge: '1h' }));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.type('html').send(fs.readFileSync(path.join(DIST, 'index.html')));
  }
  next();
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));

initStore()
  .catch((e) => console.error('store init failed:', e.message))
  .finally(() => app.listen(PORT, () => console.log(`Mossy Pine Diwali listening on :${PORT}`)));
