import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  template: `
<div class="rsvp">
<section class="container hero">
  <p class="eyebrow">{{ isCultural ? 'Perform on stage' : 'Potluck sign-up' }}</p>
  <h1 class="glow">{{ isCultural ? 'Cultural Activity Registration' : 'Food Registration' }}</h1>
  <p class="lede">{{ isCultural
    ? 'Sign up to perform — dance, song, skit, instrument or anything festive.'
    : 'Tell us what dish you’re bringing to the community lunch.' }}</p>
</section>
<section class="container">
  @if (isCultural) {
    @if (done()) {
      <div class="card form-success">
        <p class="big">Your act is registered!</p>
        <p class="muted">We’ll be in touch with the performance schedule.</p>
      </div>
    } @else {
      <form class="card form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="team" data-tip="Team or organization name">Team/Organization name <span class="req">*</span></label>
          <input id="team" type="text" formControlName="team" placeholder="Long answer text" />
          @if (bad('team')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="perfCount" data-tip="How many performers">Number of performers <span class="req">*</span></label>
          <input id="perfCount" type="number" min="1" max="30" formControlName="perfCount" (input)="syncPerformers()" placeholder="Short answer text" />
          @if (bad('perfCount')) { <p class="error">Required</p> }
        </div>
        @for (row of perfRows.controls; track $index) {
          <div class="field-row" [formGroup]="row">
            <div class="field">
              <label data-tip="Performer name">Performer {{ $index + 1 }} name <span class="req">*</span></label>
              <input type="text" formControlName="name" placeholder="Short answer text" />
            </div>
            <div class="field field-age">
              <label data-tip="Performer age">Age <span class="req">*</span></label>
              <input type="number" min="1" max="120" formControlName="age" placeholder="Age" />
            </div>
          </div>
        }
        <div class="field">
          <label for="perfType" data-tip="Dance, singing, drawing, skit…">Performance Type (Dance, Singing, drawing etc.) <span class="req">*</span></label>
          <input id="perfType" type="text" formControlName="perfType" placeholder="Short answer text" />
          @if (bad('perfType')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="choreo" data-tip="Who choreographed the act">Choreographer Name <span class="req">*</span></label>
          <input id="choreo" type="text" formControlName="choreo" placeholder="Short answer text" />
          @if (bad('choreo')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="duration" data-tip="Approximate length in minutes">Approximate duration in Minutes <span class="req">*</span></label>
          <input id="duration" type="number" min="1" max="120" formControlName="duration" placeholder="Short answer text" />
          @if (bad('duration')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="contact" data-tip="Contact phone number">Contact Number <span class="req">*</span></label>
          <input id="contact" type="tel" formControlName="contact" autocomplete="tel" placeholder="Short answer text" />
          @if (bad('contact')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="email" data-tip="Contact email address">Email <span class="req">*</span></label>
          <input id="email" type="text" formControlName="email" autocomplete="email" placeholder="Short answer text" />
          @if (bad('email')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="audio">Upload Audio File</label>
          <label class="file-btn" for="audio" data-tip="Optional: upload your audio track">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {{ fileName() || 'Add file' }}
          </label>
          <input id="audio" type="file" accept="audio/*" (change)="onFile($event)" hidden />
        </div>
        @if (serverError()) { <p class="error">{{ serverError() }}</p> }
        <button class="btn btn-gold" type="submit" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Submit' }}</button>
      </form>
    }
  } @else {
    @if (done()) {
      <div class="card form-success">
        <p class="big">Your dish is registered!</p>
        <p class="muted">Thanks — we'll see it at the potluck lunch.</p>
      </div>
    } @else {
      <form class="card form-card" [formGroup]="foodForm" (ngSubmit)="submitFood()" novalidate>
        <div class="field">
          <label for="faddr" data-tip="Must match your RSVP home address">Home address <span class="req">*</span></label>
          <input id="faddr" type="text" formControlName="address" list="food-addrs" autocomplete="off"
                 (input)="suggest($event)" placeholder="Start typing your RSVP home address" />
          <datalist id="food-addrs">
            @for (a of addrOptions(); track a) { <option [value]="a"></option> }
          </datalist>
          <p class="muted">Must match the address on your RSVP.</p>
          @if (fbad('address')) { <p class="error">{{ fmsg('address') }}</p> }
        </div>
        <div class="field">
          <label for="fcat" data-tip="Pick a food category">Food category <span class="req">*</span></label>
          <select id="fcat" formControlName="category">
            <option value="" disabled selected>Choose</option>
            @for (c of cats; track c) {
              <option [value]="c" [disabled]="closedCats().includes(c)">{{ c }}{{ closedCats().includes(c) ? ' — Full' : '' }}</option>
            }
          </select>
          @if (catHint()) { <p class="muted">Note: e.g., {{ catHint() }}</p> }
          @if (fbad('category')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="fdish" data-tip="Dish name and description">Dish name &amp; description <span class="req">*</span></label>
          <input id="fdish" type="text" formControlName="dish" placeholder="e.g. Mutter Paneer (Medium Spicy, 10 servings)" />
          @if (fbad('dish')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label>Dietary / allergy information</label>
          <label class="opt"><input type="checkbox" formControlName="veg" /> Vegetarian</label>
          <label class="opt"><input type="checkbox" formControlName="vegan" /> Vegan</label>
          <label class="opt"><input type="checkbox" formControlName="jain" /> Jain (no onion/garlic)</label>
          <label class="opt"><input type="checkbox" formControlName="nuts" /> Contains nuts / peanut allergy</label>
          <label class="opt"><input type="checkbox" formControlName="dairy" /> Contains dairy</label>
          <label class="opt"><input type="checkbox" formControlName="glutenFree" /> Gluten-free</label>
          <label class="opt"><input type="checkbox" formControlName="halal" /> Halal</label>
        </div>
        <div class="field">
          <label data-tip="How spicy is the dish?">Spice level <span class="req">*</span></label>
          <label class="opt"><input type="radio" formControlName="spice" value="Mild" /> Mild</label>
          <label class="opt"><input type="radio" formControlName="spice" value="Medium" /> Medium</label>
          <label class="opt"><input type="radio" formControlName="spice" value="Spicy" /> Spicy</label>
          @if (fbad('spice')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="fqty" data-tip="e.g., Feeds 8-10 people">Estimated quantity / portions <span class="req">*</span></label>
          <input id="fqty" type="text" formControlName="qty" placeholder="e.g. Feeds 8-10 people" />
          @if (fbad('qty')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label data-tip="Needs reheating on-site?">Does your dish require warming on-site? <span class="req">*</span></label>
          <label class="opt"><input type="radio" formControlName="warming" value="Yes - needs oven/microwave" /> Yes — needs oven/microwave</label>
          <label class="opt"><input type="radio" formControlName="warming" value="Yes - bringing Instant Pot/Crockpot" /> Yes — bringing Instant Pot/Crockpot</label>
          <label class="opt"><input type="radio" formControlName="warming" value="No - ready to serve" /> No — ready to serve</label>
          @if (fbad('warming')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label data-tip="Bringing your own serving spoons?">Are you bringing your own serving spoons? <span class="req">*</span></label>
          <label class="opt"><input type="radio" formControlName="spoons" value="Yes" /> Yes</label>
          <label class="opt"><input type="radio" formControlName="spoons" value="No" /> No</label>
          @if (fbad('spoons')) { <p class="error">Required</p> }
        </div>
        @if (serverError()) { <p class="error">{{ serverError() }}</p> }
        <button class="btn btn-gold" type="submit" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Submit' }}</button>
      </form>
    }
  }
</section>
  @if (modalErrors().length) {
    <div class="modal-backdrop" (click)="closeModal()" role="presentation">
      <div class="modal card" role="alertdialog" aria-labelledby="reg-modal-title" (click)="$event.stopPropagation()">
        <h3 id="reg-modal-title">Please check your registration</h3>
        @for (e of modalErrors(); track e) { <p class="error">{{ e }}</p> }
        <button class="btn btn-gold" type="button" (click)="closeModal()">OK</button>
      </div>
    </div>
  }
</div>
  `,
})
export class RegisterPage implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  type = 'cultural';
  isCultural = true;
  form = this.fb.group({
    team: ['', Validators.required],
    perfCount: ['', Validators.required],
    performers: this.fb.array<FormGroup>([]),
    perfType: ['', Validators.required],
    choreo: ['', Validators.required],
    duration: ['', Validators.required],
    contact: ['', Validators.required],
    email: ['', Validators.required],
  });
  foodForm = this.fb.group({
    address: ['', Validators.required],
    category: ['', Validators.required],
    dish: ['', Validators.required],
    veg: [false], vegan: [false], jain: [false], nuts: [false],
    dairy: [false], glutenFree: [false], halal: [false],
    spice: ['', Validators.required],
    qty: ['', Validators.required],
    warming: ['', Validators.required],
    spoons: ['', Validators.required],
  });
  private catHints: Record<string, string> = {
    'Appetizers / Snacks': 'Samosas, Pakoras, Chaat, Paneer Tikka',
    'Main Course - Vegetarian': 'Paneer Butter Masala, Chole, Dal Makhani, Veg Biryani',
    'Main Course - Non-Vegetarian': 'Chicken Curry, Mutton Biryani, Fish Fry',
    'Breads / Rice': 'Naan, Puri, Rotis, Jeera Rice, Pulao',
    'Accompaniments / Sides': 'Raita, Salad, Chutneys, Papad, Pickles',
    'Desserts': 'Gulab Jamun, Kheer, Rasmalai, Halwa',
    'Beverages': 'Mango Lassi, Masala Chai, Thandai, Soft Drinks, Juices',
    'Paper Goods & Supplies': 'Plates, Cups, Napkins, Cutlery, Serving Spoons, Trash Bags',
  };
  catHint() { return this.catHints[this.foodForm.value.category || ''] || ''; }
  cats = [
    'Appetizers / Snacks', 'Main Course - Vegetarian', 'Main Course - Non-Vegetarian',
    'Breads / Rice', 'Accompaniments / Sides', 'Desserts', 'Beverages', 'Paper Goods & Supplies',
  ];
  closedCats = signal<string[]>([]);
  file: File | null = null;
  fileName = signal('');
  sending = signal(false);
  done = signal(false);
  serverError = signal('');

  async ngOnInit() {
    this.isCultural = this.route.snapshot.data['type'] !== 'food';
    if (!this.isCultural) {
      try {
        const r = await fetch('/api/closed-categories');
        this.closedCats.set((await r.json()).closed || []);
      } catch { /* ignore */ }
    }
  }

  bad(name: string) {
    const c = this.form.get(name);
    return !!(c && c.touched && c.invalid);
  }

  get perfRows() { return this.form.get('performers') as FormArray<FormGroup>; }

  syncPerformers() {
    const n = Math.min(Math.max(parseInt(String(this.form.value.perfCount), 10) || 0, 0), 30);
    const arr = this.perfRows;
    while (arr.length < n) arr.push(this.fb.group({ name: ['', Validators.required], age: ['', Validators.required] }));
    while (arr.length > n) arr.removeAt(arr.length - 1);
  }

  fbad(name: string) {
    const c = this.foodForm.get(name);
    return !!(c && c.touched && c.invalid);
  }

  fmsg(name: string) {
    const c = this.foodForm.get(name);
    return c?.errors?.['server'] || 'Required';
  }

  addrOptions = signal<string[]>([]);
  private suggestTimer: any = null;
  suggest(e: Event) {
    const q = (e.target as HTMLInputElement).value;
    clearTimeout(this.suggestTimer);
    this.suggestTimer = setTimeout(async () => {
      if (!q || q.length < 2) { this.addrOptions.set([]); return; }
      try {
        const r = await fetch(`/api/address-suggest?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        this.addrOptions.set(d.suggestions || []);
      } catch { /* ignore */ }
    }, 200);
  }

  async submitFood() {
    this.serverError.set('');
    if (this.foodForm.invalid) {
      this.foodForm.markAllAsTouched();
      this.modalErrors.set(this.missing(this.foodForm, {
        address: 'Home address', category: 'Food category', dish: 'Dish name',
        spice: 'Spice level', qty: 'Quantity/portions', warming: 'Warming on-site', spoons: 'Serving spoons',
      }));
      return;
    }
    this.sending.set(true);
    try {
      const r = await fetch('/api/register/food', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.foodForm.value),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { this.done.set(true); return; }
      if (d.errors) {
        Object.keys(d.errors).forEach(k => this.foodForm.get(k)?.setErrors({ server: d.errors[k] }));
        this.foodForm.markAllAsTouched();
        this.modalErrors.set(Object.values(d.errors));
      } else this.serverError.set(d.error || 'Something went wrong — please try again.');
    } catch {
      this.serverError.set('Network problem — please try again.');
    } finally { this.sending.set(false); }
  }

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] || null;
    this.file = f;
    this.fileName.set(f ? f.name : '');
  }

  modalErrors = signal<string[]>([]);
  closeModal() { this.modalErrors.set([]); }

  private missing(form: any, labels: Record<string, string>) {
    return Object.keys(labels).filter(k => form.get(k)?.invalid).map(k => `${labels[k]} is required.`);
  }

  async submit() {
    this.serverError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const miss = this.missing(this.form, {
        team: 'Team/Organization name', perfCount: 'Number of performers',
        perfType: 'Performance type', choreo: 'Choreographer name',
        duration: 'Duration', contact: 'Contact number', email: 'Email',
      });
      if (this.perfRows.controls.some(r => r.invalid)) miss.push('Performer names and ages are required.');
      this.modalErrors.set(miss);
      return;
    }
    this.sending.set(true);
    try {
      const fd = new FormData();
      const v = this.form.value as any;
      fd.append('team', v.team ?? '');
      fd.append('perfCount', v.perfCount ?? '');
      fd.append('performers', this.perfRows.value.map((p: any) => `${p.name}${p.age ? ` (${p.age})` : ''}`).join(', '));
      fd.append('perfType', v.perfType ?? '');
      fd.append('choreo', v.choreo ?? '');
      fd.append('duration', v.duration ?? '');
      fd.append('contact', v.contact ?? '');
      fd.append('email', v.email ?? '');
      if (this.file) fd.append('audio', this.file);
      const r = await fetch('/api/register/cultural', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { this.done.set(true); return; }
      if (d.errors) {
        const first = Object.keys(d.errors)[0];
        const c = this.form.get(first);
        if (c) c.setErrors({ server: d.errors[first] });
        c?.markAsTouched();
        this.modalErrors.set(Object.values(d.errors));
      } else this.serverError.set(d.error || 'Something went wrong — please try again.');
    } catch {
      this.serverError.set('Network problem — please try again.');
    } finally { this.sending.set(false); }
  }
}
