import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Contact } from '../../data.service';
import { RangoliComponent } from '../../shared/rangoli';

@Component({
  selector: 'app-contact',
  imports: [RouterLink, RangoliComponent],
  template: `
<section class="container hero">
  <p class="eyebrow">Questions?</p>
  <h1 class="glow">Talk to the organisers</h1>
  <p class="lede">Volunteering, potluck ideas, accessibility needs or anything else — reach out any time.</p>
</section>

<app-rangoli />

<section class="container">
  <div class="card" style="max-width: 640px">
    <h3>{{ c()?.org }}</h3>
    <p class="muted">{{ c()?.note }}</p>
    <a class="btn btn-gold" routerLink="/rsvp" style="margin-top: var(--space-2)">RSVP for the event</a>
  </div>
</section>
  `,
})
export class ContactPage implements OnInit {
  c = signal<Contact | null>(null);
  constructor(private data: DataService) {}
  ngOnInit() { this.data.contact().then(c => this.c.set(c)).catch(() => {}); }
}
