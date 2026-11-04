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
async function rsvpStats() {
  const p = getPool();
  if (p) {
    const [[row]] = await p.query('SELECT COUNT(*) AS rsvps, COALESCE(SUM(guests),0) AS guests FROM rsvps');
    return { rsvps: Number(row.rsvps), guests: Number(row.guests) };
  }
  const rows = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  return { rsvps: rows.length, guests: rows.reduce((n, r) => n + (r.guests || 0), 0) };
}

module.exports = { initStore, existingRsvp, saveRsvp, saveRegistration, listRsvps, listRegistrations, rsvpStats };
