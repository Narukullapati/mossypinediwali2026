const fs = require('fs');
const path = require('path');

// MySQL on the server comes from env vars injected by the platform
// (DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD).
// Locally (no env), RSVPs fall back to a JSON file so the app still works.
let pool = null;
const LOCAL = path.join(__dirname, 'data', 'rsvps.local.json');

function getPool() {
  if (pool) return pool;
  if (process.env.DATABASE_URL) {
    pool = require('mysql2/promise').createPool(process.env.DATABASE_URL);
  } else if (process.env.DB_HOST) {
    pool = require('mysql2/promise').createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 4,
    });
  }
  return pool;
}

async function initStore() {
  const p = getPool();
  if (p) {
    await p.query(`CREATE TABLE IF NOT EXISTS rsvps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      address VARCHAR(255),
      guests INT NOT NULL DEFAULT 1,
      volunteer TINYINT(1) NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    // add columns to tables created before they existed
    for (const col of [
      'ADD COLUMN phone VARCHAR(20)',
      'ADD COLUMN adults INT',
      'ADD COLUMN kids INT',
      'ADD COLUMN address VARCHAR(255)',
      'ADD COLUMN food_pref VARCHAR(16)',
      'ADD COLUMN veg_count INT',
      'ADD COLUMN nonveg_count INT',
      'ADD COLUMN volunteer TINYINT(1) NOT NULL DEFAULT 0',
      'ADD UNIQUE KEY uq_rsvp_address (address)',
    ]) {
      try { await p.query(`ALTER TABLE rsvps ${col}`); } catch (e) { /* already there */ }
    }
    await p.query('CREATE TABLE IF NOT EXISTS settings (k VARCHAR(64) PRIMARY KEY, v TEXT)');
    await p.query(`CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(16) NOT NULL,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(20),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('mysql store ready');
  } else if (!fs.existsSync(LOCAL)) {
    fs.writeFileSync(LOCAL, '[]');
    console.log('no DB env — using local JSON store');
  }
  await migrateFoodDetails();
}

// one-time migration (idempotent): menu item ids were renamed kebab-case -> camelCase,
// Gulab Jamoon qty changed 75 -> 100 pieces, and dish names are normalized to title case.
const ID_RENAMES = {
  'veg-appetizer': 'vegAppetizer', 'paneer-curry': 'paneerCurry', 'veg-kurma': 'vegKurma',
  'veg-curry': 'vegCurry', 'veg-biryani': 'vegBiryani', 'curd-rice': 'curdRice',
  'veg-fried-rice': 'vegFriedRice', 'gulab-jamoon-1': 'gulabJamoon1', 'gulab-jamoon-2': 'gulabJamoon2',
  'fruit-custard': 'fruitCustard', 'ice-cream': 'iceCream', 'water-case1': 'waterCase1',
  'water-case2': 'waterCase2', 'cold-drinks-2cases': 'coldDrinks2Cases', 'ziploc-bags': 'ziplocBags',
  'cold-drinks-case3': 'coldDrinksCase3', 'paper-plates': 'paperPlates', 'trash-bags': 'trashBags',
  'sandwich-ziploc': 'sandwichZiploc', 'table-covers': 'tableCovers', 'cleaning-wipes': 'cleaningWipes',
  'paper-cups': 'paperCups',
};

function migrateDetails(details) {
  if (!details) return details;
  let d = String(details);
  for (const [oldId, newId] of Object.entries(ID_RENAMES))
    d = d.replace(new RegExp(`Item: ${oldId}(?=\\s*\\|)`), `Item: ${newId}`);
  if (d.includes('gulabJamoon')) d = d.replaceAll('75 Pieces', '100 Pieces');
  d = d.replace(/Dish: ([^|]+)/, (m, dish) =>
    'Dish: ' + dish.replace(/(^|\s)(\p{L})/gu, (x, sp, c) => sp + c.toUpperCase()));
  return d;
}

async function migrateFoodDetails() {
  const p = getPool();
  if (p) {
    const [rows] = await p.query("SELECT id, details FROM registrations WHERE type='food'");
    for (const r of rows) {
      const next = migrateDetails(r.details);
      if (next !== r.details) await p.query('UPDATE registrations SET details=? WHERE id=?', [next, r.id]);
    }
    return;
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  let changed = false;
  for (const r of rows) {
    if (r.type !== 'food') continue;
    const next = migrateDetails(r.details);
    if (next !== r.details) { r.details = next; changed = true; }
  }
  if (changed) fs.writeFileSync(LOCAL, JSON.stringify(rows, null, 2));
}

async function existingRsvp(email, address) {
  const el = (email || '').toLowerCase(), al = (address || '').toLowerCase();
  const p = getPool();
  if (p) {
    const [[row]] = await p.query(
      'SELECT SUM(LOWER(email)=? AND email<>\'\' AND email<>\'diwali@kbar.fun\') AS email_dup, SUM(LOWER(address)=?) AS address_dup FROM rsvps',
      [el, al],
    );
    return { email: Number(row.email_dup) > 0, address: Number(row.address_dup) > 0 };
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  return {
    email: el !== '' && el !== 'diwali@kbar.fun' && rows.some(r => (r.email || '').toLowerCase() === el),
    address: rows.some(r => r.address && r.address.toLowerCase() === al),
  };
}

async function saveRsvp({ name, email, phone, address, adults, kids, guests, vegCount, nonvegCount, foodPref, volunteer, notes }) {
  const p = getPool();
  if (p) {
    const [r] = await p.query(
      'INSERT INTO rsvps (name, email, phone, address, adults, kids, guests, veg_count, nonveg_count, food_pref, volunteer, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [name, email, phone, address, adults, kids, guests, vegCount || 0, nonvegCount || 0, foodPref || 'veg', volunteer ? 1 : 0, notes || null],
    );
    return { id: r.insertId };
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  const row = { id: rows.length + 1, name, email, phone, address, adults, kids, guests, veg_count: vegCount || 0, nonveg_count: nonvegCount || 0, food_pref: foodPref || 'veg', volunteer: !!volunteer, notes: notes || null, created_at: new Date().toISOString() };
  rows.push(row);
  fs.writeFileSync(LOCAL, JSON.stringify(rows, null, 2));
  return { id: row.id };
}

async function saveRegistration({ type, name, phone, details }) {
  const p = getPool();
  if (p) {
    const [r] = await p.query(
      'INSERT INTO registrations (type, name, phone, details) VALUES (?,?,?,?)',
      [type, name, phone, details || null],
    );
    return { id: r.insertId };
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  const row = { id: `reg${rows.length + 1}`, type, name, phone, details, created_at: new Date().toISOString() };
  rows.push(row);
  fs.writeFileSync(LOCAL, JSON.stringify(rows, null, 2));
  return { id: row.id };
}

async function listRsvps() {
  const p = getPool();
  if (p) {
    const [rows] = await p.query('SELECT * FROM rsvps ORDER BY created_at DESC');
    return rows;
  }
  return JSON.parse(fs.readFileSync(LOCAL, 'utf8')).filter(r => !String(r.id).startsWith('reg')).reverse();
}
async function listRegistrations() {
  const p = getPool();
  if (p) {
    const [rows] = await p.query('SELECT * FROM registrations ORDER BY created_at DESC');
    return rows;
  }
  return JSON.parse(fs.readFileSync(LOCAL, 'utf8')).filter(r => String(r.id).startsWith('reg')).reverse();
}
async function updateRegistration(id, { name, phone, details }) {
  const p = getPool();
  if (p) {
    const [r] = await p.query('UPDATE registrations SET name=?, phone=?, details=? WHERE id=?', [name, phone, details || null, id]);
    return r.affectedRows > 0;
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  const i = rows.findIndex(r => String(r.id) === String(id));
  if (i < 0) return false;
  rows[i] = { ...rows[i], name, phone, details };
  fs.writeFileSync(LOCAL, JSON.stringify(rows, null, 2));
  return true;
}
async function deleteRegistration(id) {
  const p = getPool();
  if (p) {
    const [r] = await p.query('DELETE FROM registrations WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  const next = rows.filter(r => String(r.id) !== String(id));
  fs.writeFileSync(LOCAL, JSON.stringify(next, null, 2));
  return next.length !== rows.length;
}
async function deleteRsvp(id) {
  const p = getPool();
  if (p) {
    const [r] = await p.query('DELETE FROM rsvps WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  const next = rows.filter(r => String(r.id).startsWith('reg') || String(r.id) !== String(id));
  fs.writeFileSync(LOCAL, JSON.stringify(next, null, 2));
  return next.length !== rows.length;
}
async function rsvpStats() {
  const p = getPool();
  if (p) {
    const [[row]] = await p.query('SELECT COUNT(*) AS rsvps, COALESCE(SUM(guests),0) AS guests FROM rsvps');
    return { rsvps: Number(row.rsvps), guests: Number(row.guests) };
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8')).filter(r => !String(r.id).startsWith('reg'));
  return { rsvps: rows.length, guests: rows.reduce((n, r) => n + (r.guests || 0), 0) };
}

async function suggestAddresses(q) {
  const ql = (q || '').toLowerCase();
  if (!ql) return [];
  const p = getPool();
  if (p) {
    const [rows] = await p.query(
      "SELECT DISTINCT address FROM rsvps WHERE address <> '' AND LOWER(address) LIKE ? LIMIT 6",
      [`%${ql}%`],
    );
    return rows.map(r => r.address);
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  const seen = new Set();
  return rows
    .map(r => r.address || '')
    .filter(a => a && a.toLowerCase().includes(ql) && !seen.has(a.toLowerCase()) && seen.add(a.toLowerCase()))
    .slice(0, 6);
}

async function getRsvpByAddress(address) {
  const al = (address || '').toLowerCase();
  if (!al) return null;
  const p = getPool();
  if (p) {
    const [[row]] = await p.query('SELECT name, phone FROM rsvps WHERE LOWER(address)=? LIMIT 1', [al]);
    return row || null;
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  return rows.find(r => r.address && r.address.toLowerCase() === al) || null;
}

const SETTINGS = path.join(__dirname, 'data', 'settings.local.json');
async function getSetting(key) {
  const p = getPool();
  if (p) {
    const [[r]] = await p.query('SELECT v FROM settings WHERE k=?', [key]);
    return r ? JSON.parse(r.v) : null;
  }
  if (!fs.existsSync(SETTINGS)) return null;
  return JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))[key] ?? null;
}
async function setSetting(key, val) {
  const p = getPool();
  if (p) {
    await p.query('INSERT INTO settings (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [key, JSON.stringify(val)]);
    return;
  }
  const d = fs.existsSync(SETTINGS) ? JSON.parse(fs.readFileSync(SETTINGS, 'utf8')) : {};
  d[key] = val;
  fs.writeFileSync(SETTINGS, JSON.stringify(d, null, 2));
}

module.exports = { initStore, existingRsvp, saveRsvp, saveRegistration, updateRegistration, deleteRegistration, deleteRsvp, listRsvps, listRegistrations, rsvpStats, suggestAddresses, getRsvpByAddress, getSetting, setSetting };
