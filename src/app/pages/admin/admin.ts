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
    <div class="reg-tabs big-tabs" role="tablist" aria-label="Admin data">
      <a role="tab" [class.on]="tab() === 'rsvp'" (click)="tab.set('rsvp')" style="cursor:pointer">RSVP ({{ rsvps().length }})</a>
      <a role="tab" [class.on]="tab() === 'cultural'" (click)="tab.set('cultural')" style="cursor:pointer">Cultural ({{ cultural().length }})</a>
      <a role="tab" [class.on]="tab() === 'food'" (click)="tab.set('food')" style="cursor:pointer">Food ({{ food().length }})</a>
    </div>
    <div class="card admin-grid">
      @if (tab() === 'rsvp') {
        <div class="grid-head">
          <h3>RSVPs — {{ totalGuests() }} guests</h3>
          <button class="btn btn-outline" (click)="download()">Download CSV</button>
        </div>
        <table class="admin-table">
          <thead><tr><th>#</th><th>Registered</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Adults</th><th>Kids</th><th>Volunteer</th></tr></thead>
          <tbody>
            @for (r of rsvps(); track r.id; let i = $index) {
              <tr><td>{{ i + 1 }}</td><td>{{ fmt(r.created_at) }}</td><td>{{ r.name }}</td><td>{{ r.email }}</td><td>{{ r.phone }}</td><td>{{ r.address }}</td><td>{{ r.adults }}</td><td>{{ r.kids }}</td><td>{{ r.volunteer ? 'Yes' : 'No' }}</td></tr>
            }
          </tbody>
        </table>
        <ul class="rsvp-list">
          @for (r of rsvps(); track r.id; let i = $index) {
            <li><b>{{ i + 1 }}.</b><span>{{ r.name }}</span><i>{{ r.guests }} guests</i></li>
          }
        </ul>
      }
      @if (tab() === 'cultural') {
        <h3>Cultural activity registrations</h3>
        <table class="admin-table">
          <thead><tr><th>#</th><th>Registered</th><th>Name</th><th>Phone</th><th>Details</th></tr></thead>
          <tbody>
            @for (r of cultural(); track r.id) {
              <tr><td>{{ r.id }}</td><td>{{ fmt(r.created_at) }}</td><td>{{ r.name }}</td><td>{{ r.phone }}</td><td>{{ r.details }}</td></tr>
            }
          </tbody>
        </table>
      }
      @if (tab() === 'food') {
        <h3>Food registrations</h3>
        <table class="admin-table">
          <thead><tr><th>#</th><th>Registered</th><th>Name</th><th>Phone</th><th>Details</th></tr></thead>
          <tbody>
            @for (r of food(); track r.id) {
              <tr><td>{{ r.id }}</td><td>{{ fmt(r.created_at) }}</td><td>{{ r.name }}</td><td>{{ r.phone }}</td><td>{{ r.details }}</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  }
</section>
  `,
  styles: `.admin-section{max-width:1600px}
  .big-tabs a{font-size:.875rem;padding-inline:var(--space-2);min-height:40px}
  .admin-grid{overflow-x:auto;margin-top:0;border-top-left-radius:0}
  .grid-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .admin-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:.8125rem;table-layout:fixed}
  .admin-table th,.admin-table td{padding:6px;text-align:left;border-bottom:1px solid var(--color-surface);word-break:break-word;vertical-align:top}
  .admin-table th{color:var(--color-primary);font-weight:700}
  .admin-table td:nth-child(-n+2){white-space:nowrap}
  .rsvp-list{display:none;list-style:none;margin:8px 0 0;padding:0}
  .rsvp-list li{padding:8px 2px;border-bottom:1px solid var(--color-surface);display:flex;gap:8px;align-items:baseline;font-size:.9375rem}
  .rsvp-list b{color:var(--color-primary);font-weight:700;white-space:nowrap}
  .rsvp-list span{flex:1;min-width:0;word-break:break-word}
  .rsvp-list i{font-style:normal;color:var(--color-primary);white-space:nowrap}
  @media(max-width:768px){.admin-table{display:none}.rsvp-list{display:block}}`,
})
export class AdminPage {
  pw = '';
  authed = signal(false);
  err = signal('');
  tab = signal<'rsvp' | 'cultural' | 'food'>('rsvp');
  rsvps = signal<any[]>([]);
  regs = signal<any[]>([]);
  cultural = computed(() => this.regs().filter(r => r.type === 'cultural'));
  food = computed(() => this.regs().filter(r => r.type === 'food'));
  private headers = { 'x-admin-password': '' };

  fmt(d: string) { return d ? new Date(d).toLocaleString() : ''; }
  totalGuests() { return this.rsvps().reduce((n, r) => n + (r.guests || 0), 0); }

  async login() {
    this.err.set('');
    this.headers['x-admin-password'] = this.pw;
    const r = await fetch('/api/admin/rsvps', { headers: this.headers });
    if (r.status === 401) { this.err.set('Incorrect password.'); return; }
    this.rsvps.set(await r.json());
    const g = await fetch('/api/admin/registrations', { headers: this.headers });
    this.regs.set(await g.json());
    this.authed.set(true);
  }

  download() {
    const cols = ['id', 'created_at', 'name', 'phone', 'address', 'adults', 'kids', 'guests', 'volunteer', 'notes'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...this.rsvps().map(r => cols.map(c => esc(c === 'volunteer' ? (r.volunteer ? 'Yes' : 'No') : r[c])).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'rsvps.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
