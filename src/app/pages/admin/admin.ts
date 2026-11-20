import { Component, signal, computed } from '@angular/core';
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
    <div class="card admin-grid sug-card">
      <div class="xl-title">{{ tab() === 'rsvp' ? 'RSVPs' : tab() === 'food' ? 'Food registrations' : 'Categories' }}.xlsx — Excel</div>
      <div class="sug-toolbar">
        <span class="sug-title">{{ tab() === 'rsvp' ? 'RSVPs — ' + totalGuests() + ' guests' : tab() === 'food' ? 'Food registrations' : 'Close food categories' }}</span>
        @if (tab() !== 'settings') {
          <input type="search" class="tbl-filter" placeholder="Name, phone, address or details…" (input)="q.set($any($event.target).value)" />
          <button class="dl-xls" type="button" (click)="reload()" title="Refresh" aria-label="Refresh" [disabled]="refreshing()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1D6F42" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [style.animation]="refreshing() ? 'spin 1s linear infinite' : ''"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="dl-xls" type="button" (click)="download()" title="Download Excel" aria-label="Download Excel">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1D6F42" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="6 11 12 17 18 11"/><path d="M4 21h16"/></svg>
          </button>
        }
      </div>
      <div class="excel-body">
      @if (tab() === 'rsvp') {
        <table class="totals-table">
          <tr><td>Non-Veg <b>{{ totalNonveg() }}</b></td><td>Veg <b>{{ totalVeg() }}</b></td><td>Adults <b>{{ totalAdults() }}</b></td><td>Kids <b>{{ totalKids() }}</b></td></tr>
        </table>
        <table class="admin-table sug-table">
          <thead>
            <tr class="xl-letters"><th class="xl-corner"></th>@for (l of letters.slice(0, 10); track l) {<th>{{ l }}</th>}</tr>
            <tr><th class="xl-gutter"></th><th class="th-sort" (click)="by('registered')">Registered{{ arrow('registered') }}</th><th class="th-sort" (click)="by('name')">Name{{ arrow('name') }}</th><th>Phone</th><th class="th-sort" (click)="by('address')">Address{{ arrow('address') }}</th><th class="th-sort" (click)="by('adults')">Adults{{ arrow('adults') }}</th><th class="th-sort" (click)="by('kids')">Kids{{ arrow('kids') }}</th><th class="th-sort" (click)="by('veg')">Food{{ arrow('veg') }}</th><th>Bringing</th><th>Volunteer</th><th></th></tr>
          </thead>
          <tbody>
            @for (r of rsvpView(); track r.id; let i = $index) {
              <tr [class.no-food]="!foodFor(r.address)"><td class="num">{{ i + 1 }}</td><td>{{ fmt(r.created_at) }}</td><td class="name" [title]="r.name">{{ r.name }}</td><td>{{ r.phone }}</td><td [title]="r.address">{{ r.address }}</td><td>{{ r.adults }}</td><td>{{ r.kids }}</td><td>🟢{{ r.veg_count ?? 0 }} 🔴{{ r.nonveg_count ?? 0 }}</td><td [title]="foodFor(r.address)">{{ foodFor(r.address) }}</td><td>{{ r.volunteer ? 'Yes' : 'No' }}</td><td class="row-acts"><button type="button" class="row-del" title="Delete RSVP" (click)="delRsvp(r)">×</button></td></tr>
            }
          </tbody>
        </table>
        <ul class="rsvp-list">
          @for (r of rsvpView(); track r.id; let i = $index) {
            <li [class.no-food]="!foodFor(r.address)"><b>{{ i + 1 }}.</b><span>{{ r.name }}</span><i>{{ r.guests }} guests 🟢{{ r.veg_count ?? 0 }} 🔴{{ r.nonveg_count ?? 0 }}</i><button type="button" class="row-del" title="Delete RSVP" (click)="delRsvp(r)">×</button></li>
          }
        </ul>
      }
      @if (tab() === 'food') {
        <table class="admin-table sug-table">
          <thead>
            <tr class="xl-letters"><th class="xl-corner"></th>@for (l of letters.slice(0, 6); track l) {<th>{{ l }}</th>}</tr>
            <tr><th class="xl-gutter"></th><th class="th-sort" (click)="by('registered')">Registered{{ arrow('registered') }}</th><th class="th-sort" (click)="by('name')">Name{{ arrow('name') }}</th><th>Phone</th><th class="th-sort" (click)="by('address')">Address{{ arrow('address') }}</th><th class="th-sort" (click)="by('details')">Details{{ arrow('details') }}</th><th></th></tr>
          </thead>
          <tbody>
            @for (g of foodGroups(); track g.category) {
              <tr class="cat-row"><td colspan="7">{{ g.category }} ({{ g.items.length }})</td></tr>
              @for (r of g.items; track r.id; let i = $index) {
                <tr><td class="num">{{ i + 1 }}</td><td>{{ fmt(r.created_at) }}</td><td class="name">{{ r.name }}</td><td>{{ r.phone }}</td><td [title]="pick(r.details, 'Address')">{{ pick(r.details, 'Address') }}</td><td><span class="dish-pill">{{ pick(r.details, 'Dish') }}</span> {{ rest(r.details, 'Dish') }}</td><td class="row-acts"><button type="button" class="row-edit" title="Edit claim" (click)="openEdit(r)">✎</button><button type="button" class="row-del" title="Delete claim" (click)="delReg(r)">×</button></td></tr>
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
      <div class="xl-sheetbar">
        <span class="xl-nav" aria-hidden="true">◄ ►</span>
        <div class="xl-sheets" role="tablist" aria-label="Admin data">
          <a role="tab" class="xl-sheet" [class.on]="tab() === 'rsvp'" (click)="tab.set('rsvp')" style="cursor:pointer">RSVP ({{ rsvps().length }})</a>
          <a role="tab" class="xl-sheet" [class.on]="tab() === 'food'" (click)="tab.set('food')" style="cursor:pointer">Food ({{ food().length }})</a>
          @if (false) { <a role="tab" class="xl-sheet" [class.on]="tab() === 'settings'" (click)="tab.set('settings')" style="cursor:pointer">Categories</a> }
        </div>
      </div>
      <div class="xl-statusbar">
        <span>Ready</span>
        @if (tab() === 'rsvp') {
          <span class="xl-status-stats">Average: {{ rsvps().length ? (totalGuests() / rsvps().length).toFixed(1) : 0 }} &nbsp; Count: {{ rsvps().length }} &nbsp; Sum: {{ totalGuests() }} guests</span>
        }
      </div>
    </div>
    @if (editing(); as er) {
      <div class="cf-overlay" (click)="editing.set(null)">
        <div class="cf-card" (click)="$event.stopPropagation()">
          <h4 class="cf-title">Edit claim</h4>
          <div class="cf-field"><label>Name</label><input [(ngModel)]="editForm.name" name="ename" /></div>
          <div class="cf-field"><label>Phone</label><input [(ngModel)]="editForm.phone" name="ephone" /></div>
          <div class="cf-field"><label>Address</label><input [(ngModel)]="editForm.address" name="eaddr" /></div>
          <div class="cf-field"><label>Dish / item name</label><input [(ngModel)]="editForm.dish" name="edish" /></div>
          <div class="cf-btns">
            <button type="button" class="cf-btn cf-cancel" (click)="editing.set(null)">Cancel</button>
            <button type="button" class="cf-btn cf-save" (click)="saveEdit()">Save</button>
          </div>
        </div>
      </div>
    }
    @if (confirmBox(); as cb) {
      <div class="cf-overlay" (click)="resolveConfirm(false)">
        <div class="cf-card" (click)="$event.stopPropagation()">
          <h4 class="cf-title">{{ cb.title }}</h4>
          @for (l of cb.lines; track l) { <p class="cf-line">{{ l }}</p> }
          <div class="cf-btns">
            <button type="button" class="cf-btn cf-cancel" (click)="resolveConfirm(false)">Cancel</button>
            <button type="button" class="cf-btn cf-del" (click)="resolveConfirm(true)">{{ cb.action }}</button>
          </div>
        </div>
      </div>
    }
  }
</section>
  `,
  styles: `.admin-section{max-width:1600px}
  .sug-card{padding:0!important;overflow:hidden;border:1px solid #E5EAF2!important;box-shadow:0 2px 8px rgba(30,50,80,.06)!important;display:flex;flex-direction:column;min-height:480px;border-radius:4px}
  .excel-body{overflow-x:auto;background:#fff;flex:1;min-height:0}
  @media(max-width:768px){.cat-toggle{padding:6px 10px;font-size:.85rem}}
  .admin-grid{overflow-x:hidden}
  .xl-title{background:#217346;color:#fff;text-align:center;font-size:.85rem;font-weight:600;padding:7px 0;letter-spacing:.02em;flex-shrink:0}
  .xl-sheetbar{flex-shrink:0;display:flex;align-items:stretch;gap:8px;background:#E9E9E9;border-top:1px solid #C9C9C9;padding:0 8px;overflow-x:auto;scrollbar-width:none}
  .xl-sheetbar::-webkit-scrollbar{display:none}
  .xl-nav{display:flex;align-items:center;color:#7F7F7F;font-size:.55rem;letter-spacing:3px;padding:0 4px;flex-shrink:0;user-select:none}
  .xl-sheets{display:flex;align-items:flex-end;gap:2px;padding-top:4px}
  .xl-sheet{clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 100%,0 100%);background:linear-gradient(#D6D6D6,#C4C4C4);color:#3F3F3F;font-size:.78rem;font-weight:600;padding:5px 20px;white-space:nowrap;flex-shrink:0}
  .xl-sheet:not(.on):hover{background:#E2E2E2;color:#1F1F1F}
  .xl-sheet.on{background:#fff;color:#1F1F1F;font-weight:700}
  .xl-statusbar{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;background:#F3F2F1;border-top:1px solid #D4D4D4;padding:3px 10px;font-size:.72rem;color:#4A4A4A}
  .xl-status-stats{color:#4A4A4A}
  .dl-xls{background:#fff;border:1px solid #C9C9C9;cursor:pointer;padding:4px;line-height:0;border-radius:2px;flex-shrink:0}
  .dl-xls:hover{background:#F3F2F1}
  @keyframes spin{to{transform:rotate(360deg)}}
  .sug-toolbar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid #E6E6E6;background:#fff}
  .sug-title{font-weight:700;color:#1F3A5F;font-size:.92rem}
  .tbl-filter{margin-left:auto;border:1px solid #C9C9C9;border-radius:2px;padding:5px 10px;font:inherit;font-size:.82rem;min-width:200px;max-width:320px;background:#fff;color:#333}
  .tbl-filter::placeholder{color:#A6A6A6}
  .tbl-filter:focus{outline:none;border-color:#217346;box-shadow:0 0 0 1px #217346}
  .th-sort{cursor:pointer;user-select:none;white-space:nowrap}
  .th-sort:hover{color:#217346}
  .sug-table thead{position:sticky;top:0;z-index:2}
  .sug-table tr.xl-letters th{background:#E6E6E6;color:#4A4A4A;font-weight:400;font-size:.62rem;text-align:center;padding:2px 4px;border:1px solid #C9C9C9}
  .sug-table tr.xl-letters th.xl-corner{background:linear-gradient(135deg,#E6E6E6 45%,#C9C9C9 46%,#C9C9C9 54%,#E6E6E6 55%)}
  .sug-table th.xl-gutter,.sug-table td.num{background:#E6E6E6;color:#4A4A4A;text-align:center;font-size:.68rem;font-weight:400;width:42px;min-width:42px;padding:4px 2px;border:1px solid #C9C9C9}
  .sug-table th{background:#fff;color:#333;font-weight:600;font-size:.75rem;text-align:left;padding:5px 8px;border:1px solid #D4D4D4;white-space:nowrap}
  .sug-table td{padding:4px 8px;border:1px solid #E2E2E2;color:#333;vertical-align:middle;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis}
  .sug-table tbody tr:hover td{background:rgba(33,115,70,.07)}
  .sug-table tbody tr:hover td.num{background:#D6D6D6}
  .sug-table td.name{font-weight:600}
  .excel-body>.totals-table{margin:10px 14px}
  .excel-body>.rsvp-list,.excel-body>.cat-settings,.excel-body>.saved-msg,.excel-body>p{margin:10px 14px}
  .excel-body .rsvp-list{padding-left:14px}
  .cat-row td{background:#FDF0F7!important;font-weight:700;color:var(--color-primary);font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}
  .sug-table tr.no-food td{background:#FEE2E2}
  .rsvp-list li.no-food{background:#FEE2E2}
  .dish-pill{display:inline-block;background:#FDF0F7;color:var(--color-primary);border:1px solid var(--color-primary);border-radius:999px;padding:2px 10px;font-weight:700;font-size:.75rem;margin-right:6px;white-space:nowrap}
  .row-del{background:none;border:none;color:#B42318;font-size:1rem;font-weight:700;cursor:pointer;line-height:1;padding:0 4px}
  .row-del:hover{color:#7A160F}
  .cf-overlay{position:fixed;inset:0;background:rgba(20,16,12,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
  .cf-card{background:#fff;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.25);max-width:420px;width:100%;padding:20px}
  .cf-title{margin:0 0 10px;font-size:1rem;color:#1F3A5F}
  .cf-line{margin:3px 0;font-size:.88rem;color:#444;white-space:pre-wrap}
  .cf-btns{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
  .cf-btn{border-radius:6px;padding:7px 18px;font-weight:600;font-size:.85rem;cursor:pointer;border:1px solid #C9C9C9;background:#F3F2F1;color:#333}
  .cf-btn:hover{filter:brightness(.96)}
  .cf-del{background:#B42318;border-color:#B42318;color:#fff}
  .cf-save{background:#217346;border-color:#217346;color:#fff}
  .cf-field{margin-bottom:10px}
  .cf-field label{display:block;font-size:.72rem;font-weight:600;color:#666;margin-bottom:3px}
  .cf-field input{width:100%;border:1px solid #C9C9C9;border-radius:6px;padding:7px 10px;font:inherit;font-size:.88rem;box-sizing:border-box}
  .cf-field input:focus{outline:none;border-color:#217346}
  .row-acts{white-space:nowrap;text-align:center}
  .row-edit{background:none;border:none;color:#1D6F42;font-size:.95rem;cursor:pointer;line-height:1;padding:0 4px}
  .row-edit:hover{color:#12512F}
  .cat-settings{display:flex;flex-direction:column;gap:8px;max-width:480px}
  .cat-toggle{display:flex;align-items:center;gap:10px;padding:7px 12px;border:1px solid #E5E7EB;border-radius:8px;cursor:pointer;font-size:.9rem}
  .cat-toggle input{width:18px;height:18px;accent-color:var(--color-primary)}
  .cat-toggle.closed{border-color:var(--color-primary);background:#FDF0F7}
  .full-tag{margin-left:auto;background:var(--color-primary);color:#fff;border-radius:999px;padding:1px 10px;font-size:.7rem;font-weight:700}
  .saved-msg{color:#157A3E;font-weight:600;font-size:.85rem;margin-top:10px}
  .totals-table{border-collapse:collapse;margin-bottom:10px;font-size:.8125rem}
  .totals-table td{border:1px solid #D4D4D4;background:#F8F8F8;padding:5px 14px;color:#5B5B78}
  .totals-table td b{color:#1E1E3C;margin-left:4px}
  .totals-table td:first-child{color:#B42318}.totals-table td:nth-child(2){color:#157A3E}
  .admin-grid{overflow-x:auto;margin-top:0;border-top-left-radius:0}
  .grid-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .admin-table{width:100%;border-collapse:collapse;font-size:.8rem;font-family:Calibri,'Segoe UI',Arial,sans-serif}
  .rsvp-list{display:none;list-style:none;margin:8px 0 0;padding:0}
  .rsvp-list li{padding:8px 2px;border-bottom:1px solid var(--color-surface);display:flex;gap:8px;align-items:baseline;font-size:.9375rem}
  .rsvp-list b{color:var(--color-primary);font-weight:700;white-space:nowrap}
  .rsvp-list span{flex:1;min-width:0;word-break:break-word}
  .rsvp-list i{font-style:normal;color:var(--color-primary);white-space:nowrap}
  .cat-row td{font-weight:700;color:var(--color-primary);background:#FDF0F7}
  .rsvp-list .cat-head{font-weight:700;color:var(--color-primary);list-style:none;margin-top:10px}
  @media(max-width:768px){.admin-table{display:none}.rsvp-list{display:block}}`,
})
export class AdminPage {
  pw = '';
  authed = signal(false);
  err = signal('');
  tab = signal<'rsvp' | 'food' | 'settings'>('rsvp');
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
  letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  rsvps = signal<any[]>([]);
  regs = signal<any[]>([]);
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
  foodByAddr = computed(() => {
    const m = new Map<string, string[]>();
    for (const r of this.food()) {
      const addr = this.pick(r.details, 'Address').toLowerCase();
      if (!addr) continue;
      if (!m.has(addr)) m.set(addr, []);
      m.get(addr)!.push(this.pick(r.details, 'Dish') || this.pick(r.details, 'Item'));
    }
    return m;
  });
  foodFor(addr: string) { return (this.foodByAddr().get((addr || '').toLowerCase()) || []).join(', '); }
  rsvpView = computed(() => this.sorted(
    this.rsvps().filter(r => this.match(r, ['name', 'phone', 'address'])),
    { registered: (r: any) => r.created_at, name: (r: any) => (r.name || '').toLowerCase(), address: (r: any) => (r.address || '').toLowerCase(), veg: (r: any) => r.veg_count ?? 0, nonveg: (r: any) => r.nonveg_count ?? 0, adults: (r: any) => r.adults ?? 0, kids: (r: any) => r.kids ?? 0 }));
  foodView = computed(() => this.sorted(
    this.food().filter(r => this.match(r, ['name', 'phone', 'details'])),
    { registered: (r: any) => r.created_at, name: (r: any) => (r.name || '').toLowerCase(), address: (r: any) => this.pick(r.details, 'Address').toLowerCase(), details: (r: any) => (r.details || '').toLowerCase() }));
  foodGroups = computed(() => {
    const map = new Map<string, any[]>();
    for (const r of this.foodView()) {
      const cat = this.pick(r.details, 'Category').split(' (')[0] || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }
    const num = (c: string) => { const m = c.match(/^(\d+)/); return m ? +m[1] : 999; };
    return [...map.entries()].map(([category, items]) => ({ category, items }))
      .sort((a, b) => num(a.category) - num(b.category) || a.category.localeCompare(b.category));
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

  refreshing = signal(false);
  async load() {
    const r = await fetch('/api/admin/rsvps', { headers: this.headers });
    if (r.status === 401) { this.err.set('Incorrect password.'); return false; }
    this.rsvps.set(await r.json());
    const g = await fetch('/api/admin/registrations', { headers: this.headers });
    this.regs.set(await g.json());
    return true;
  }
  async reload() {
    this.refreshing.set(true);
    await this.load();
    this.refreshing.set(false);
  }
  confirmBox = signal<{ title: string; lines: string[]; action: string } | null>(null);
  private confirmResolve: ((v: boolean) => void) | null = null;
  askConfirm(title: string, lines: string[], action = 'Delete') {
    return new Promise<boolean>(res => {
      this.confirmResolve = res;
      this.confirmBox.set({ title, lines, action });
    });
  }
  resolveConfirm(v: boolean) {
    this.confirmBox.set(null);
    this.confirmResolve?.(v);
    this.confirmResolve = null;
  }
  editing = signal<any | null>(null);
  editForm = { name: '', phone: '', address: '', dish: '' };
  openEdit(r: any) {
    this.editForm = {
      name: r.name || '', phone: r.phone || '',
      address: this.pick(r.details, 'Address'), dish: this.pick(r.details, 'Dish'),
    };
    this.editing.set(r);
  }
  async saveEdit() {
    const r = this.editing();
    if (!r) return;
    const f = this.editForm;
    let hasDish = false;
    const details = (r.details || '').split(' | ').map((p: string) => {
      if (p.startsWith('Dish: ')) { hasDish = true; return `Dish: ${f.dish}`; }
      if (p.startsWith('Address: ')) return `Address: ${f.address}`;
      return p;
    }).join(' | ');
    const body = { name: f.name, phone: f.phone, details: hasDish ? details : `${details} | Dish: ${f.dish}` };
    const res = await fetch(`/api/admin/registrations/${r.id}`, {
      method: 'PATCH', headers: { ...this.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      this.regs.set(this.regs().map(x => x.id === r.id ? { ...x, ...body } : x));
      this.editing.set(null);
    }
  }
  async delReg(r: any) {
    const item = this.pick(r.details, 'Item');
    const addr = this.pick(r.details, 'Address').toLowerCase();
    const slot = +this.pick(r.details, 'Slot') || 0;
    const wm = /^waterCase(\d+)$/.exec(item);
    let partnerIds: string[] = [];
    if (item === 'chapathi') partnerIds = [`waterCase${slot + 1}`];
    else if (wm) partnerIds = ['chapathi'];
    else {
      const g = [['coldDrinksCase3', 'bowls', 'napkins'], ['paperPlates', 'spoons'], ['curdRice', 'trashBags'], ['sandwichZiploc', 'tableCovers', 'cleaningWipes', 'paperCups']]
        .find(g => g.includes(item));
      if (g) partnerIds = g.filter(x => x !== item);
    }
    const others = this.food().filter(x => {
      if (x.id === r.id || this.pick(x.details, 'Address').toLowerCase() !== addr) return false;
      const xi = this.pick(x.details, 'Item');
      if (!partnerIds.includes(xi)) return false;
      if (xi === 'chapathi' && wm) return (+this.pick(x.details, 'Slot') || 0) === +wm[1] - 1;
      return true;
    });
    const label = (x: any) => `"${this.pick(x.details, 'Dish') || x.details}"`;
    const lines = [`${label(r)} — ${r.name}`];
    if (others.length) lines.push('Also removes its combo item(s):', ...others.map(x => '• ' + label(x)));
    const ok = await this.askConfirm(others.length ? 'Delete combo claim?' : 'Delete claim?', lines);
    if (!ok) return;
    for (const x of [r, ...others]) {
      const res = await fetch(`/api/admin/registrations/${x.id}`, { method: 'DELETE', headers: this.headers });
      if (res.ok) this.regs.set(this.regs().filter(y => y.id !== x.id));
    }
  }
  async delRsvp(r: any) {
    const addr = (r.address || '').toLowerCase();
    const claims = addr ? this.food().filter(x => this.pick(x.details, 'Address').toLowerCase() === addr) : [];
    const lines = [`${r.name} — ${r.address}`, `${r.guests ?? 0} guests`];
    if (claims.length) lines.push('Also removes their food claim(s):', ...claims.map(x => '• ' + (this.pick(x.details, 'Dish') || x.details)));
    const ok = await this.askConfirm('Delete RSVP?', lines);
    if (!ok) return;
    for (const x of claims) {
      const res = await fetch(`/api/admin/registrations/${x.id}`, { method: 'DELETE', headers: this.headers });
      if (res.ok) this.regs.set(this.regs().filter(y => y.id !== x.id));
    }
    const res = await fetch(`/api/admin/rsvps/${r.id}`, { method: 'DELETE', headers: this.headers });
    if (res.ok) this.rsvps.set(this.rsvps().filter(y => y.id !== r.id));
  }
  async login() {
    this.err.set('');
    this.headers['x-admin-password'] = this.pw;
    if (!(await this.load())) return;
    const cc = await fetch('/api/closed-categories');
    this.closed.set((await cc.json()).closed || []);
    this.authed.set(true);
  }

  download() {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const t = this.tab();
    let csv: string, file: string;
    if (t === 'rsvp') {
      const cols = ['id', 'created_at', 'name', 'phone', 'address', 'adults', 'kids', 'guests', 'veg_count', 'nonveg_count', 'food_items', 'volunteer', 'notes'];
      csv = [cols.join(','), ...this.rsvps().map(r => cols.map(c =>
        esc(c === 'volunteer' ? (r.volunteer ? 'Yes' : 'No') : c === 'created_at' ? this.fmtCsv(r.created_at) : c === 'food_items' ? this.foodFor(r.address) : r[c])).join(','))].join('\r\n');
      file = 'rsvps.csv';
    } else {
      const rows = this.food();
      const keys = ['Category', 'Dish', 'Serves', 'Address'];
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
