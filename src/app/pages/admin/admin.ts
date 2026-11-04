import { Component, signal, computed, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  template: `
<section class="container admin-section">
  @if (!authed()) {
    <form class="card form-card" (ngSubmit)="login()">
      <div class="field">
        <label for="pw">Administrator password</label>
        <input id="pw" type="password" [(ngModel)]="pw" name="pw" autocomplete="current-password" />
        @if (err()) { <p class="error">{{ err() }}</p> }
      </div>
      <button class="btn btn-gold" type="submit">Sign in</button>
    </form>
  } @else {
    <div #card class="card admin-grid sug-card" [style.height.px]="cardH() || null">
      <div class="reg-tabs big-tabs sug-tabs" role="tablist" aria-label="Admin data">
        <a role="tab" [class.on]="tab() === 'rsvp'" (click)="tab.set('rsvp')" style="cursor:pointer">RSVP ({{ rsvps().length }})</a>
        <a role="tab" [class.on]="tab() === 'cultural'" (click)="tab.set('cultural')" style="cursor:pointer">Cultural ({{ cultural().length }})</a>
        <a role="tab" [class.on]="tab() === 'food'" (click)="tab.set('food')" style="cursor:pointer">Food ({{ food().length }})</a>
        <a role="tab" [class.on]="tab() === 'settings'" (click)="tab.set('settings')" style="cursor:pointer">Categories</a>
        @if (tab() !== 'settings') {
          <button class="dl-xls" type="button" (click)="download()" title="Download Excel" aria-label="Download Excel">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1D6F42" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="6 11 12 17 18 11"/><path d="M4 21h16"/></svg>
          </button>
        }
      </div>
      <div class="sug-toolbar">
        <span class="sug-title">{{ tab() === 'rsvp' ? 'RSVPs — ' + totalGuests() + ' guests' : tab() === 'cultural' ? 'Cultural activity registrations' : tab() === 'food' ? 'Food registrations' : 'Close food categories' }}</span>
        @if (tab() !== 'settings') {
          <input type="search" class="tbl-filter" placeholder="Name, phone, address or details…" (input)="q.set($any($event.target).value)" />
        }
      </div>
      <div class="excel-body">
      @if (tab() === 'rsvp') {
        <table class="totals-table">
          <tr><td>Non-Veg <b>{{ totalNonveg() }}</b></td><td>Veg <b>{{ totalVeg() }}</b></td><td>Adults <b>{{ totalAdults() }}</b></td><td>Kids <b>{{ totalKids() }}</b></td></tr>
        </table>
        <table class="admin-table sug-table">
          <thead>
            <tr><th>#</th><th class="th-sort" (click)="by('registered')">Registered{{ arrow('registered') }}</th><th class="th-sort" (click)="by('name')">Name{{ arrow('name') }}</th><th>Email</th><th>Phone</th><th class="th-sort" (click)="by('address')">Address{{ arrow('address') }}</th><th class="th-sort" (click)="by('adults')">Adults{{ arrow('adults') }}</th><th class="th-sort" (click)="by('kids')">Kids{{ arrow('kids') }}</th><th class="th-sort" (click)="by('veg')">Food{{ arrow('veg') }}</th><th>Volunteer</th></tr>
          </thead>
          <tbody>
            @for (r of rsvpView(); track r.id; let i = $index) {
              <tr><td class="num">{{ i + 1 }}</td><td>{{ fmt(r.created_at) }}</td><td class="name">{{ r.name }}</td><td>{{ r.email }}</td><td>{{ r.phone }}</td><td>{{ r.address }}</td><td>{{ r.adults }}</td><td>{{ r.kids }}</td><td>🟢{{ r.veg_count ?? 0 }} 🔴{{ r.nonveg_count ?? 0 }}</td><td>{{ r.volunteer ? 'Yes' : 'No' }}</td></tr>
            }
          </tbody>
        </table>
        <ul class="rsvp-list">
          @for (r of rsvpView(); track r.id; let i = $index) {
            <li><b>{{ i + 1 }}.</b><span>{{ r.name }}</span><i>{{ r.guests }} guests 🟢{{ r.veg_count ?? 0 }} 🔴{{ r.nonveg_count ?? 0 }}</i></li>
          }
        </ul>
      }
      @if (tab() === 'cultural') {
        <table class="admin-table sug-table">
          <thead>
            <tr><th>#</th><th class="th-sort" (click)="by('registered')">Registered{{ arrow('registered') }}</th><th class="th-sort" (click)="by('name')">Name{{ arrow('name') }}</th><th>Phone</th><th class="th-sort" (click)="by('details')">Details{{ arrow('details') }}</th></tr>
          </thead>
          <tbody>
            @for (r of culturalView(); track r.id; let i = $index) {
              <tr><td class="num">{{ i + 1 }}</td><td>{{ fmt(r.created_at) }}</td><td class="name">{{ r.name }}</td><td>{{ r.phone }}</td><td>{{ r.details }}</td></tr>
            }
          </tbody>
        </table>
        <ul class="rsvp-list">
          @for (r of culturalView(); track r.id; let i = $index) {
            <li><b>{{ i + 1 }}.</b><span>{{ r.name }}</span><i>{{ pick(r.details, 'Type') }}</i></li>
          }
        </ul>
      }
      @if (tab() === 'food') {
        <table class="admin-table sug-table">
          <thead>
            <tr><th>#</th><th class="th-sort" (click)="by('registered')">Registered{{ arrow('registered') }}</th><th class="th-sort" (click)="by('name')">Name{{ arrow('name') }}</th><th>Phone</th><th class="th-sort" (click)="by('details')">Details{{ arrow('details') }}</th></tr>
          </thead>
          <tbody>
            @for (g of foodGroups(); track g.category) {
              <tr class="cat-row"><td colspan="5">{{ g.category }} ({{ g.items.length }})</td></tr>
              @for (r of g.items; track r.id; let i = $index) {
                <tr><td class="num">{{ i + 1 }}</td><td>{{ fmt(r.created_at) }}</td><td class="name">{{ r.name }}</td><td>{{ r.phone }}</td><td><span class="dish-pill">{{ pick(r.details, 'Dish') }}</span> {{ rest(r.details, 'Dish') }}</td></tr>
              }
            }
          </tbody>
        </table>
        <ul class="rsvp-list">
          @for (g of foodGroups(); track g.category) {
            <li class="cat-head">{{ g.category }} ({{ g.items.length }})</li>
            @for (r of g.items; track r.id; let i = $index) {
              <li><b>{{ i + 1 }}.</b><span>{{ r.name }}</span><i>{{ pick(r.details, 'Dish') }}</i></li>
            }
          }
        </ul>
      }
      @if (tab() === 'settings') {
        <p class="muted">Checked categories show as "Full" in the food form and can't be selected.</p>
        <div class="cat-settings">
          @for (c of foodCats; track c) {
            <label class="cat-toggle" [class.closed]="closed().includes(c)">
              <input type="checkbox" [checked]="closed().includes(c)" (change)="toggleCat(c)" />
              <span>{{ c }}</span>
              @if (closed().includes(c)) { <span class="full-tag">Full</span> }
            </label>
          }
        </div>
        @if (saved()) { <p class="saved-msg">Saved ✓</p> }
      }
      </div>
    </div>
  }
</section>
  `,
  styles: `.admin-section{max-width:1600px}
  .sug-card{padding:0!important;overflow:hidden;border:1px solid #E5EAF2!important;box-shadow:0 2px 8px rgba(30,50,80,.06)!important;display:flex;flex-direction:column;min-height:320px;border-radius:10px}
  .excel-body{flex:1;overflow:auto;min-height:0;background:#fff}
  @media(max-width:768px){.excel-body{height:58vh;flex:none}}
  .admin-grid{overflow-x:hidden}
  .sug-tabs{background:transparent;padding:8px 10px 0;flex-wrap:nowrap;justify-content:flex-start;align-items:flex-end;gap:4px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid #E5EAF2}
  .sug-tabs::-webkit-scrollbar{display:none}
  .sug-tabs a{
    font-size:.82rem;padding-inline:16px;min-height:34px;flex-shrink:0;white-space:nowrap;
    border:1px solid #E5EAF2;border-bottom:none;border-radius:8px 8px 0 0;
    background:#F1F5FA;color:#5B6B85;font-weight:600;
  }
  .sug-tabs a.on{background:#fff;color:#1F3A5F;box-shadow:inset 0 -3px 0 var(--color-primary)}
  .sug-tabs a:hover{color:var(--color-primary)}
  .dl-xls{margin-left:auto;position:sticky;right:0;background:#fff;border:1px solid #E5EAF2;cursor:pointer;padding:4px;line-height:0;border-radius:6px;flex-shrink:0;align-self:center}
  .dl-xls:hover{background:#F1F5FA}
  .sug-toolbar{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #E5EAF2;background:#fff}
  .sug-title{font-weight:700;color:#1F3A5F;font-size:.92rem}
  .tbl-filter{margin-left:auto;border:1px solid #DCE3EE;border-radius:6px;padding:6px 12px;font:inherit;font-size:.85rem;min-width:200px;max-width:320px;background:#fff;color:#2E3E52}
  .tbl-filter::placeholder{color:#9AA8BD}
  .tbl-filter:focus{outline:none;border-color:var(--color-primary)}
  .th-sort{cursor:pointer;user-select:none;white-space:nowrap}
  .th-sort:hover{color:var(--color-primary)}
  .admin-table{width:100%;border-collapse:collapse;font-size:.85rem}
  .sug-table thead{position:sticky;top:0;z-index:2}
  .sug-table th{background:#F8FAFC;color:#6B7A90;font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;text-align:left;padding:10px 14px;border-bottom:2px solid #E5EAF2}
  .sug-table td{padding:10px 14px;border-bottom:1px solid #EDF1F7;color:#2E3E52;vertical-align:top}
  .sug-table tbody tr:hover td{background:#F7FAFD}
  .sug-table td.num{color:#9AA8BD;width:36px}
  .sug-table td.name{font-weight:700;color:#1F3A5F}
  .excel-body>.totals-table{margin:10px 14px}
  .excel-body>.rsvp-list,.excel-body>.cat-settings,.excel-body>.saved-msg,.excel-body>p{margin:10px 14px}
  .excel-body .rsvp-list{padding-left:14px}
  .cat-row td{background:#FDF0F7!important;font-weight:700;color:var(--color-primary);font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}
  .dish-pill{display:inline-block;background:#FDF0F7;color:var(--color-primary);border:1px solid var(--color-primary);border-radius:999px;padding:2px 10px;font-weight:700;font-size:.75rem;margin-right:6px;white-space:nowrap}
  .cat-settings{display:flex;flex-direction:column;gap:8px;max-width:480px}
  .cat-toggle{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;cursor:pointer;font-size:.9rem}
  .cat-toggle input{width:18px;height:18px;accent-color:var(--color-primary)}
  .cat-toggle.closed{border-color:var(--color-primary);background:#FDF0F7}
  .full-tag{margin-left:auto;background:var(--color-primary);color:#fff;border-radius:999px;padding:1px 10px;font-size:.7rem;font-weight:700}
  .saved-msg{color:#157A3E;font-weight:600;font-size:.85rem;margin-top:10px}
  .totals-table{border-collapse:collapse;margin-bottom:10px;font-size:.8125rem}
  .totals-table td{border:1px solid #E5E7EB;background:#F8F9FB;padding:6px 14px;color:#5B5B78}
  .totals-table td b{color:#1E1E3C;margin-left:4px}
  .totals-table td:first-child{color:#B42318}.totals-table td:nth-child(2){color:#157A3E}
  .admin-grid{overflow-x:auto;margin-top:0;border-top-left-radius:0}
  .grid-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .totals-table{border-collapse:collapse;margin-bottom:8px;font-size:.9375rem;border:2px solid var(--color-primary)}
  .totals-table th{padding:6px 16px;border:1px solid var(--color-primary);text-align:left;color:var(--color-primary)}
  .totals-table td{padding:6px 12px;border:1px solid var(--color-primary);white-space:nowrap}
  .totals-table td:last-child{text-align:right;font-weight:700;color:var(--color-primary)}
  .admin-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:.8125rem;table-layout:fixed}
  .admin-table th,.admin-table td{padding:6px;text-align:left;border-bottom:1px solid var(--color-surface);word-break:break-word;vertical-align:top}
  .admin-table th{color:var(--color-primary);font-weight:700}
  .admin-table td:nth-child(-n+2){white-space:nowrap}
  .rsvp-list{display:none;list-style:none;margin:8px 0 0;padding:0}
  .rsvp-list li{padding:8px 2px;border-bottom:1px solid var(--color-surface);display:flex;gap:8px;align-items:baseline;font-size:.9375rem}
  .rsvp-list b{color:var(--color-primary);font-weight:700;white-space:nowrap}
  .rsvp-list span{flex:1;min-width:0;word-break:break-word}
  .rsvp-list i{font-style:normal;color:var(--color-primary);white-space:nowrap}
  .cat-row td{font-weight:700;color:var(--color-primary);background:#FDF0F7}
  .rsvp-list .cat-head{font-weight:700;color:var(--color-primary);list-style:none;margin-top:10px}
  @media(max-width:768px){.admin-table{display:none}.rsvp-list{display:block}}`,
})
export class AdminPage implements AfterViewInit {
  @ViewChild('card') cardRef!: ElementRef;
  cardH = signal(420);
  @HostListener('window:resize') onResize() { this.fit(); }
  ngAfterViewInit() { setTimeout(() => this.fit()); }
  fit() {
    const el = this.cardRef?.nativeElement;
    if (!el) return;
    if (window.innerWidth <= 768) { this.cardH.set(0); return; }
    this.cardH.set(Math.max(window.innerHeight - el.getBoundingClientRect().top - 16, 300));
  }
  pw = '';
  authed = signal(false);
  err = signal('');
  tab = signal<'rsvp' | 'cultural' | 'food' | 'settings'>('rsvp');
  closed = signal<string[]>([]);
  saved = signal(false);
  foodCats = [
    'Appetizers / Snacks', 'Main Course - Vegetarian', 'Main Course - Non-Vegetarian',
    'Breads / Rice', 'Accompaniments / Sides', 'Desserts', 'Beverages', 'Paper Goods & Supplies',
  ];
  async toggleCat(c: string) {
    const cur = this.closed();
    const next = cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c];
    this.closed.set(next);
    try {
      await fetch('/api/admin/closed-categories', {
        method: 'PUT', headers: { ...this.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ closed: next }),
      });
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 1500);
    } catch { this.closed.set(cur); }
  }
  rsvps = signal<any[]>([]);
  regs = signal<any[]>([]);
  cultural = computed(() => this.regs().filter(r => r.type === 'cultural'));
  food = computed(() => this.regs().filter(r => r.type === 'food'));
  q = signal('');
  sortKey = signal('created_at');
  sortAsc = signal(false);
  by(key: string) {
    if (this.sortKey() === key) this.sortAsc.update(a => !a);
    else { this.sortKey.set(key); this.sortAsc.set(true); }
  }
  arrow(key: string) { return this.sortKey() === key ? (this.sortAsc() ? ' ▲' : ' ▼') : ''; }
  private match(r: any, fields: string[]) {
    const q = this.q().toLowerCase();
    return !q || fields.some(f => String(r[f] ?? '').toLowerCase().includes(q));
  }
  private sorted<T extends Record<string, any>>(rows: T[], map: Record<string, (r: T) => any>) {
    const k = this.sortKey(), a = this.sortAsc();
    const get = map[k] ?? ((r: T) => r[k]);
    return [...rows].sort((x, y) => { const vx = get(x) ?? '', vy = get(y) ?? ''; return (vx > vy ? 1 : vx < vy ? -1 : 0) * (a ? 1 : -1); });
  }
  rsvpView = computed(() => this.sorted(
    this.rsvps().filter(r => this.match(r, ['name', 'phone', 'address', 'email'])),
    { registered: (r: any) => r.created_at, name: (r: any) => (r.name || '').toLowerCase(), address: (r: any) => (r.address || '').toLowerCase(), veg: (r: any) => r.veg_count ?? 0, nonveg: (r: any) => r.nonveg_count ?? 0, adults: (r: any) => r.adults ?? 0, kids: (r: any) => r.kids ?? 0 }));
  culturalView = computed(() => this.sorted(
    this.cultural().filter(r => this.match(r, ['name', 'phone', 'details'])),
    { registered: (r: any) => r.created_at, name: (r: any) => (r.name || '').toLowerCase(), details: (r: any) => (r.details || '').toLowerCase() }));
  foodView = computed(() => this.sorted(
    this.food().filter(r => this.match(r, ['name', 'phone', 'details'])),
    { registered: (r: any) => r.created_at, name: (r: any) => (r.name || '').toLowerCase(), details: (r: any) => (r.details || '').toLowerCase() }));
  foodGroups = computed(() => {
    const map = new Map<string, any[]>();
    for (const r of this.foodView()) {
      const cat = this.pick(r.details, 'Category').split(' (')[0] || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  });
  private headers = { 'x-admin-password': '' };

  fmt(d: string) { return d ? new Date(d).toLocaleString() : ''; }
  fmtCsv(d: string) {
    return d ? new Date(d).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: true }) : '';
  }
  pick(details: string, key: string) {
    const m = (details || '').match(new RegExp(`${key}: ([^|]*)`));
    return m ? m[1].trim() : '';
  }
  rest(details: string, key: string) {
    return (details || '').split(' | ').filter(p => !p.startsWith(`${key}: `)).join(' | ');
  }
  totalGuests() { return this.rsvps().reduce((n, r) => n + (r.guests || 0), 0); }
  totalVeg() { return this.rsvps().reduce((n, r) => n + (r.veg_count || 0), 0); }
  totalNonveg() { return this.rsvps().reduce((n, r) => n + (r.nonveg_count || 0), 0); }
  totalAdults() { return this.rsvps().reduce((n, r) => n + (r.adults || 0), 0); }
  totalKids() { return this.rsvps().reduce((n, r) => n + (r.kids || 0), 0); }

  async login() {
    this.err.set('');
    this.headers['x-admin-password'] = this.pw;
    const r = await fetch('/api/admin/rsvps', { headers: this.headers });
    if (r.status === 401) { this.err.set('Incorrect password.'); return; }
    this.rsvps.set(await r.json());
    const g = await fetch('/api/admin/registrations', { headers: this.headers });
    this.regs.set(await g.json());
    const cc = await fetch('/api/closed-categories');
    this.closed.set((await cc.json()).closed || []);
    this.authed.set(true);
  }

  download() {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const t = this.tab();
    let csv: string, file: string;
    if (t === 'rsvp') {
      const cols = ['id', 'created_at', 'name', 'phone', 'address', 'adults', 'kids', 'guests', 'veg_count', 'nonveg_count', 'volunteer', 'notes'];
      csv = [cols.join(','), ...this.rsvps().map(r => cols.map(c =>
        esc(c === 'volunteer' ? (r.volunteer ? 'Yes' : 'No') : c === 'created_at' ? this.fmtCsv(r.created_at) : r[c])).join(','))].join('\r\n');
      file = 'rsvps.csv';
    } else {
      const rows = t === 'cultural' ? this.cultural() : this.food();
      const keys = t === 'cultural'
        ? ['Team', 'Performers', 'Type', 'Choreographer', 'Duration', 'Email', 'Audio']
        : ['Category', 'Dish', 'Dietary', 'Spice', 'Serves', 'Warming', 'Serving spoons', 'Address'];
      const head = ['no', 'registered', 'name', 'phone', ...keys.map(k => k.toLowerCase().replace(/ /g, '_'))];
      csv = [head.join(','), ...rows.map((r, i) =>
        [i + 1, this.fmtCsv(r.created_at), r.name, r.phone,
         ...keys.map(k => { const v = this.pick(r.details, k); return k === 'Category' ? v.split(' (')[0] : v; })].map(esc).join(','))].join('\r\n');
      file = `${t}-registrations.csv`;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = file;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
