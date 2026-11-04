import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegTabsComponent } from '../../shared/reg-tabs';

const COPY: Record<string, { eyebrow: string; title: string; lede: string; label: string; placeholder: string; done: string }> = {
  cultural: {
    eyebrow: 'Perform on stage',
    title: 'Cultural Activity Registration',
    lede: 'Sign up to perform — dance, song, skit, instrument or anything festive.',
    label: 'Your performance',
    placeholder: 'e.g. Bollywood dance, 4 minutes — 3 kids',
    done: 'Your act is registered!',
  },
  food: {
    eyebrow: 'Potluck sign-up',
    title: 'Food Registration',
    lede: 'Tell us what dish you\u2019re bringing to the community lunch.',
    label: 'Your dish',
    placeholder: 'e.g. Kaju katli — serves 15',
    done: 'Your dish is registered!',
  },
};

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RegTabsComponent],
  template: `
<app-reg-tabs />
<section class="container hero">
  <p class="eyebrow">{{ c.eyebrow }}</p>
  <h1 class="glow">{{ c.title }}</h1>
  <p class="lede">{{ c.lede }}</p>
</section>
<section class="container">
    <div class="card form-success">
      <p class="big">We'll be back soon!</p>
      <p class="muted">{{ c.lede }} Registration opens shortly — check back here.</p>
    </div>
  @if (false) {
    <form class="card form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="name">Your name</label>
        <input id="name" type="text" formControlName="name" autocomplete="name" />
        @if (form.controls.name.touched && form.controls.name.invalid) { <p class="error">Please tell us your name.</p> }
      </div>
      <div class="field">
        <label for="phone">Phone number</label>
        <input id="phone" type="tel" formControlName="phone" autocomplete="tel" />
        @if (form.controls.phone.touched && form.controls.phone.invalid) { <p class="error">Please enter a valid phone number.</p> }
      </div>
      <div class="field">
        <label for="details">{{ c.label }}</label>
        <textarea id="details" formControlName="details" rows="3" [placeholder]="c.placeholder"></textarea>
        @if (form.controls.details.touched && form.controls.details.invalid) { <p class="error">Please add the details.</p> }
      </div>
      @if (serverError()) { <p class="error">{{ serverError() }}</p> }
      <button class="btn btn-gold" type="submit" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Submit' }}</button>
    </form>
  }
</section>
  `,
})
export class RegisterPage implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  c = COPY['cultural'];
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+()\-.\s\d]{7,20}$/)]],
    details: ['', [Validators.required, Validators.maxLength(500)]],
  });
  done = signal(false);
  sending = signal(false);
  name = signal('');
  serverError = signal('');
  private type = 'cultural';

  ngOnInit() {
    this.type = this.route.snapshot.data['type'] === 'food' ? 'food' : 'cultural';
    this.c = COPY[this.type];
  }

  async submit() {
    this.serverError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.sending.set(true);
    const v = this.form.value;
    const r = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: this.type, name: v.name, phone: v.phone, details: v.details }),
    });
    this.sending.set(false);
    const res = await r.json().catch(() => ({}));
    if (r.ok && res.ok) { this.name.set(v.name!); this.done.set(true); }
    else this.serverError.set(res.error || 'Something went wrong — please try again.');
  }
}
