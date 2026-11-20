const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initStore, existingRsvp, saveRsvp, saveRegistration, updateRegistration, deleteRegistration, deleteRsvp, listRsvps, listRegistrations, rsvpStats, suggestAddresses, getRsvpByAddress, getSetting, setSetting } = require('./db');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, f, cb) => cb(null, Date.now() + '-' + (f.originalname || 'file').replace(/[^\w.\-]+/g, '_').slice(-60)),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '4466';
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
  const vegCount = Math.max(0, Number.parseInt(b.vegCount, 10) || 0);
  const nonvegCount = Math.max(0, Number.parseInt(b.nonvegCount, 10) || 0);
  const foodPref = nonvegCount > 0 ? 'nonveg' : 'veg';
  const volunteer = b.volunteer === true || b.volunteer === 'true' || b.volunteer === 1;
  if (!name || name.length > 120) errors.name = 'Please tell us your name.';
  if (!name) errors.name = 'Please tell us your name.';  if (!phone || !/^[+()\-.\s\d]{7,20}$/.test(phone)) errors.phone = 'Please enter a valid phone number.';
  if (!address) errors.address = 'Please add your house address.';
  else if (!/^\d/.test(address)) errors.address = 'Please start the address with your house number.';
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
    const itemPicks = new Map();
    for (const x of (Array.isArray(b.items) ? b.items : []).slice(0, 30)) {
      const id = String(typeof x === 'object' && x ? x.item : x).slice(0, 60);
      if (!itemPicks.has(id)) itemPicks.set(id, typeof x === 'object' && x ? String(x.dish || '').trim().slice(0, 120) : '');
    }
    const wanted = menuItems.filter(i => itemPicks.has(i.id));
    const noDish = wanted.filter(i => i.needsName && !itemPicks.get(i.id));
    if (noDish.length)
      return res.status(422).json({ ok: false, errors: { items: `Enter the dish name for ${noDish.map(i => `"${i.name}"`).join(', ')}.` } });
    if (wanted.length) {
      const foodRegs = (await listRegistrations()).filter(r => r.type === 'food');
      const full = wanted.filter(it => (it.taken || []).length + foodRegs.filter(r => (r.details || '').includes(`Item: ${it.id}`)).length >= it.slots);
      if (full.length)
        return res.status(422).json({ ok: false, errors: { items: `"${full.map(i => i.name).join('", "')}" ${full.length > 1 ? 'are' : 'is'} already filled — please uncheck and resubmit.` } });
    }
    const result = await saveRsvp({ name, email, phone, address, adults, kids, guests, vegCount, nonvegCount, foodPref, volunteer, notes });
    for (const it of wanted) {
      const details = [
        `Category: ${it.category}`, `Item: ${it.id}`, `Dish: ${itemPicks.get(it.id) || it.name}`,
        it.qty ? `Qty: ${it.qty}` : null, `Address: ${address}`,
      ].filter(Boolean).join(' | ');
      await saveRegistration({ type: 'food', name, phone, details });
    }
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

app.post('/api/register/cultural', upload.single('audio'), async (req, res) => {
  const b = req.body || {};
  const s = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const team = s(b.team, 120), performers = s(b.performers, 600), perfType = s(b.perfType, 200);
  const choreo = s(b.choreo, 120), duration = s(b.duration, 20), contact = s(b.contact, 20), email = s(b.email, 160);
  const errors = {};
  if (!team) errors.team = 'Required';
  if (!performers) errors.performers = 'Required';
  if (!perfType) errors.perfType = 'Required';
  if (!choreo) errors.choreo = 'Required';
  if (!duration) errors.duration = 'Required';
  if (!contact) errors.contact = 'Required';
  if (!email) errors.email = 'Required';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });
  const details = [
    `Team: ${team}`, `Performers: ${performers}`, `Type: ${perfType}`,
    `Choreographer: ${choreo}`, `Duration: ${duration} min`, `Email: ${email}`,
    req.file ? `Audio: ${req.file.filename}` : 'Audio: none',
  ].join(' | ');
  try {
    const result = await saveRegistration({ type: 'cultural', name: performers, phone: contact, details });
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Could not save — please try again.' });
  }
});

app.get('/api/address-suggest', async (req, res) => {
  try { res.json({ suggestions: await suggestAddresses(String(req.query.q || '')) }); }
  catch { res.status(500).json({ suggestions: [] }); }
});

app.post('/api/register/food', async (req, res) => {
  const b = req.body || {};
  const s = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const address = s(b.address, 255), category = s(b.category, 120), dish = s(b.dish, 300);
  const qty = s(b.qty, 80);
  const errors = {};
  if (!address) errors.address = 'Required';
  if (!category) errors.category = 'Required';
  if (!dish) errors.dish = 'Required';
  if (!qty) errors.qty = 'Required';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });
  const rsvp = await getRsvpByAddress(address);
  if (!rsvp) return res.status(422).json({ ok: false, errors: { address: 'Home address must match an existing RSVP.' } });
  const closed = (await getSetting('closedCategories')) || [];
  if (closed.includes(category)) return res.status(422).json({ ok: false, errors: { category: 'This category is full — please pick another.' } });
  const details = [
    `Category: ${category}`, `Dish: ${dish}`,
    `Serves: ${qty}`, `Address: ${address}`,
  ].join(' | ');
  try {
    const result = await saveRegistration({ type: 'food', name: rsvp.name, phone: rsvp.phone, details });
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Could not save — please try again.' });
  }
});

const foodMenu = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'food-menu.json'), 'utf8'));
const menuItems = foodMenu.categories.flatMap(c => c.items.map(i => ({ ...i, category: c.title })));

async function foodMenuState() {
  const regs = (await listRegistrations()).filter(r => r.type === 'food');
  let guestTarget = '100 – 120';
  try { const g = (await rsvpStats()).guests; guestTarget = `${g + 15} – ${g + 25}`; } catch { /* fallback text */ }
  return {
    categories: foodMenu.categories.map(c => ({
      ...c,
      note: c.note ? c.note.replaceAll('{guests}', guestTarget) : c.note,
      items: c.items.map(item => {
        const claims = regs.filter(r => (r.details || '').includes(`Item: ${item.id}`));
        const taken = new Array(item.slots).fill(null);
        (item.taken || []).forEach((n, i) => { if (i < item.slots) taken[i] = n; });
        for (const r of claims) {
          const dm = /Dish: ([^|]+)/.exec(r.details || '');
          const sm = /Slot: (\d+)/.exec(r.details || '');
          const dish = dm ? dm[1].trim() : '';
          const label = dish && dish !== item.name ? dish : 'Item selected';
          let idx = sm ? +sm[1] : -1;
          if (idx < 0 || idx >= item.slots || taken[idx]) idx = taken.findIndex(t => !t);
          if (idx >= 0) taken[idx] = label;
        }
        return { ...item, taken, remaining: Math.max(0, item.slots - taken.filter(Boolean).length) };
      }),
    })),
  };
}

app.get('/api/food-menu', async (req, res) => {
  try { res.json(await foodMenuState()); }
  catch { res.status(500).json({ categories: [] }); }
});

app.post('/api/food-menu/claim', async (req, res) => {
  const b = req.body || {};
  const s = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const picks = new Map();
  const rawItems = Array.isArray(b.items) ? b.items : (b.item ? [b.item] : []);
  for (const x of rawItems.slice(0, 60)) {
    const id = String(typeof x === 'object' && x ? x.item : x).slice(0, 60);
    const dish = typeof x === 'object' && x ? s(x.dish, 120) : '';
    const slot = typeof x === 'object' && x ? Number.parseInt(String(x.slot), 10) : NaN;
    if (!picks.has(id)) picks.set(id, []);
    picks.get(id).push({ dish, slot: Number.isInteger(slot) && slot >= 0 ? slot : null });
  }
  const address = s(b.address, 255);
  const wanted = menuItems.filter(i => picks.has(i.id));
  const errors = {};
  if (!wanted.length) errors.items = 'Pick at least one item from the menu.';
  if (!address) errors.address = 'Required';
  const noDish = wanted.filter(i => i.needsName && picks.get(i.id).some(p => !p.dish));
  if (noDish.length) errors.items = `Enter the dish name for ${noDish.map(i => `"${i.name}"`).join(', ')}.`;
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });
  const rsvp = await getRsvpByAddress(address);
  if (!rsvp) return res.status(422).json({ ok: false, errors: { address: 'Home address must match an existing RSVP.' } });
  const foodRegs = (await listRegistrations()).filter(r => r.type === 'food');
  const claimed = [], failed = [];
  for (const item of wanted) {
    const entries = picks.get(item.id);
    let got = 0;
    while (got < entries.length) {
      const regs = foodRegs.filter(r => (r.details || '').includes(`Item: ${item.id}`));
      const used = new Set();
      for (let i = 0; i < Math.min((item.taken || []).length, item.slots); i++) used.add(i);
      for (const r of regs) {
        const sm = /Slot: (\d+)/.exec(r.details || '');
        if (sm && +sm[1] < item.slots) used.add(+sm[1]);
        else { let i = 0; while (used.has(i)) i++; used.add(i); }
      }
      if (used.size >= item.slots) break;
      const want = entries[got];
      let idx = want.slot != null && want.slot < item.slots && !used.has(want.slot) ? want.slot : -1;
      if (idx < 0) { idx = 0; while (used.has(idx)) idx++; }
      const details = [
        `Category: ${item.category}`, `Item: ${item.id}`, `Dish: ${want.dish || item.name}`,
        item.qty ? `Qty: ${item.qty}` : null, `Address: ${address}`, `Slot: ${idx}`,
      ].filter(Boolean).join(' | ');
      try {
        await saveRegistration({ type: 'food', name: rsvp.name, phone: rsvp.phone, details });
        foodRegs.push({ details });
        got++;
      } catch { break; }
    }
    if (got) claimed.push(item.name + (got > 1 ? ` ×${got}` : ''));
    if (got < entries.length) failed.push(item.name + (entries.length - got > 1 ? ` ×${entries.length - got}` : ''));
  }
  if (!claimed.length)
    return res.status(409).json({ ok: false, error: `${failed.join(', ')} — already filled.` });
  res.status(201).json({ ok: true, name: rsvp.name, claimed, failed });
});

app.get('/api/closed-categories', async (req, res) => {
  try { res.json({ closed: (await getSetting('closedCategories')) || [] }); }
  catch { res.status(500).json({ closed: [] }); }
});

app.put('/api/admin/closed-categories', adminOnly, express.json(), async (req, res) => {
  const c = req.body?.closed;
  if (!Array.isArray(c)) return res.status(400).json({ error: 'invalid' });
  await setSetting('closedCategories', c.slice(0, 20).map(x => String(x).slice(0, 80)));
  res.json({ ok: true });
});

app.get('/api/admin/file/:name', adminOnly, (req, res) => {
  const name = path.basename(req.params.name || '');
  const file = path.join(UPLOAD_DIR, name);
  if (!name || !fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
});

app.get('/api/admin/rsvps', adminOnly, async (req, res) => {
  try { res.json(await listRsvps()); } catch { res.status(500).json({ error: 'unavailable' }); }
});
app.get('/api/admin/registrations', adminOnly, async (req, res) => {
  try { res.json(await listRegistrations()); } catch { res.status(500).json({ error: 'unavailable' }); }
});
app.patch('/api/admin/registrations/:id', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const s = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
    const ok = await updateRegistration(req.params.id, { name: s(b.name, 120), phone: s(b.phone, 20), details: s(b.details, 500) });
    res.status(ok ? 200 : 404).json({ ok });
  } catch { res.status(500).json({ error: 'unavailable' }); }
});
app.delete('/api/admin/registrations/:id', adminOnly, async (req, res) => {
  try {
    const ok = await deleteRegistration(req.params.id);
    res.status(ok ? 200 : 404).json({ ok });
  } catch { res.status(500).json({ error: 'unavailable' }); }
});
app.delete('/api/admin/rsvps/:id', adminOnly, async (req, res) => {
  try {
    const ok = await deleteRsvp(req.params.id);
    res.status(ok ? 200 : 404).json({ ok });
  } catch { res.status(500).json({ error: 'unavailable' }); }
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
