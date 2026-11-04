import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService, RsvpStats } from '../../data.service';
@Component({
  selector: 'app-rsvp',
  imports: [ReactiveFormsModule],
  template: `
<div class="rsvp">
<section class="container hero">
  <p class="eyebrow">Save your spot</p>
  <h1 class="glow">RSVP — Family Gathering</h1>
  <p class="lede">Mossy Pine Family Gathering — <span class="hl">Saturday, November 21, 2026, 11:00 AM – 4:00 PM</span>.</p>
</section>

<section class="container">
  @if (done()) {
    <div class="card form-success">
      <p class="big">See you there!</p>
      <p>Thanks, {{ name() }} — your RSVP is in.</p>
      <p class="muted">Details: Saturday, November 21, 2026 · 11:00 AM – 4:00 PM · K-Bar Amenity Center, Tampa</p>
    </div>
  } @else {
    <form class="card form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="name" data-tip="Enter your full name">Your name <span class="req">*</span></label>
        <input id="name" type="text" formControlName="name" autocomplete="name"
          [attr.aria-invalid]="touched('name') && form.controls.name.invalid" aria-describedby="name-err" />
        @if (touched('name') && form.controls.name.invalid) {
          <p class="error" id="name-err">{{ err('name', 'Please tell us your name.') }}</p>
        }
      </div>
      <div class="field">
        <label for="phone" data-tip="Your phone number">Phone number <span class="req">*</span></label>
        <input id="phone" type="tel" formControlName="phone" autocomplete="tel"
          [attr.aria-invalid]="touched('phone') && form.controls.phone.invalid" aria-describedby="phone-err" />
        @if (touched('phone') && form.controls.phone.invalid) {
          <p class="error" id="phone-err">{{ err('phone', 'Please enter a valid phone number.') }}</p>
        }
      </div>
      <div class="field addr-field">
        <label for="address" data-tip="House address — must be unique per RSVP">House address <span class="req">*</span></label>
        <input id="address" type="text" formControlName="address" autocomplete="street-address"
          placeholder="House no, street — helps us map the neighbourhood"
          [attr.aria-invalid]="touched('address') && form.controls.address.invalid" aria-describedby="address-err" />
        @if (touched('address') && form.controls.address.invalid) {
          <p class="error" id="address-err">{{ err('address', 'Start with your house number (e.g., 19273 Mossy Pine Drive).') }}</p>
        }
      </div>
      <div class="field-row">
        <div class="field">
          <label for="adults" data-tip="Number of adults">Adults <span class="req">*</span></label>
          <input id="adults" type="number" formControlName="adults" min="1" max="50" inputmode="numeric"
            [attr.aria-invalid]="touched('adults') && form.controls.adults.invalid" aria-describedby="adults-err" />
          @if (touched('adults') && form.controls.adults.invalid) {
            <p class="error" id="adults-err">{{ err('adults', '1–50 adults.') }}</p>
          }
        </div>
        <div class="field">
          <label for="kids" data-tip="Number of kids">Kids</label>
          <input id="kids" type="number" formControlName="kids" min="0" max="50" inputmode="numeric"
            [attr.aria-invalid]="touched('kids') && form.controls.kids.invalid" aria-describedby="kids-err" />
          @if (touched('kids') && form.controls.kids.invalid) {
            <p class="error" id="kids-err">{{ err('kids', '0–50 kids.') }}</p>
          }
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="vegCount" data-tip="How many vegetarian guests">Vegetarian</label>
          <input id="vegCount" type="number" formControlName="vegCount" min="0" max="50" inputmode="numeric" />
        </div>
        <div class="field">
          <label for="nonvegCount" data-tip="How many non-vegetarian guests">Non-vegetarian</label>
          <input id="nonvegCount" type="number" formControlName="nonvegCount" min="0" max="50" inputmode="numeric" />
        </div>
      </div>
      <p class="muted" style="margin-top:-8px;font-size:.8125rem">Veg + non-veg should match your total head count.</p>
      <div class="field check">
        <label class="check-label" for="volunteer" data-tip="Check if you can help at the event">
          <input id="volunteer" type="checkbox" formControlName="volunteer" />
          I'd like to volunteer
        </label>
      </div>
      <div class="hp" aria-hidden="true">
        <label>Website <input type="text" formControlName="website" tabindex="-1" autocomplete="off" /></label>
      </div>
      @if (serverError()) { <p class="error">{{ serverError() }}</p> }
      <button class="btn btn-gold" type="submit" [disabled]="sending()">
        {{ sending() ? 'Sending…' : 'Submit RSVP' }}
      </button>

    </form>
  }
  @if (modalErrors().length) {
    <div class="modal-backdrop" (click)="closeModal()" role="presentation">
      <div class="modal card" role="alertdialog" aria-labelledby="modal-title" (click)="$event.stopPropagation()">
        <h3 id="modal-title">Please check your RSVP</h3>
        @for (e of modalErrors(); track e) { <p class="error">{{ e }}</p> }
        <button class="btn btn-gold" type="button" (click)="closeModal()">OK</button>
      </div>
    </div>
  }
</section>
</div>
  `,
})
export class RsvpPage implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: [''],
    phone: ['', [Validators.required, Validators.pattern(/^[+()\-.\s\d]{7,20}$/)]],
    address: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/^\d/)]],
    adults: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    kids: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    vegCount: [0, [Validators.min(0), Validators.max(50)]],
    nonvegCount: [0, [Validators.min(0), Validators.max(50)]],
    volunteer: [false],
    notes: [''],
    website: [''],
  });
  done = signal(false);
  sending = signal(false);
  name = signal('');
  stats = signal<RsvpStats | null>(null);
  serverError = signal('');
  serverErrors = signal<Record<string, string>>({});
  modalErrors = signal<string[]>([]);
  closeModal() { this.modalErrors.set([]); }
  suggestions = signal<{ display_name: string }[]>([]);
  private addrTimer: any = null;
  private addrSeq = 0;

  onAddressInput(q: string) {
    clearTimeout(this.addrTimer);
    if (!q || q.trim().length < 4) { this.suggestions.set([]); return; }
    this.addrTimer = setTimeout(async () => {
      const seq = ++this.addrSeq;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us&q=${encodeURIComponent(q.trim())}`,
        );
        const list = await r.json();
        if (seq === this.addrSeq) this.suggestions.set(Array.isArray(list) ? list : []);
      } catch { /* keep typing without suggestions */ }
    }, 350);
  }
  pickAddress(v: string) { this.form.controls.address.setValue(v); this.suggestions.set([]); }
  hideSuggestionsSoon() { setTimeout(() => this.suggestions.set([]), 150); }

  ngOnInit() { this.data.rsvpStats().then(s => this.stats.set(s)).catch(() => {}); }

  touched(field: 'name' | 'email' | 'phone' | 'address' | 'adults' | 'kids') {
    return this.form.controls[field].touched || this.form.controls[field].dirty || this.serverErrors()[field];
  }
  err(field: string, fallback: string) { return this.serverErrors()[field] || fallback; }

  async submit() {
    this.serverErrors.set({});
    this.serverError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v0 = this.form.value;
    if (Number(v0.vegCount) + Number(v0.nonvegCount) !== Number(v0.adults) + Number(v0.kids)) {
      this.modalErrors.set(['Food counts should add up to your total head count.']);
      return;
    }
    this.sending.set(true);
    const v = this.form.value;
    const res = await this.data.rsvp({
      name: v.name!, email: v.email || 'diwali@kbar.fun', phone: v.phone!, address: v.address!,
      adults: Number(v.adults), kids: Number(v.kids),
      vegCount: Number(v.vegCount), nonvegCount: Number(v.nonvegCount),
      volunteer: !!v.volunteer, notes: v.notes || '', website: v.website || '',
    });
    this.sending.set(false);
    if (res.ok) {
      this.name.set(v.name!);
      this.done.set(true);
      this.data.rsvpStats().then(s => this.stats.set(s)).catch(() => {});
    } else if (res.errors) {
      this.serverErrors.set(res.errors);
      this.modalErrors.set(Object.values(res.errors));
    } else {
      this.serverError.set(res.error || 'Something went wrong — please try again.');
    }
  }
}
