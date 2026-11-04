import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Potluck } from '../../data.service';
import { RangoliComponent } from '../../shared/rangoli';

@Component({
  selector: 'app-food',
  imports: [RouterLink, RangoliComponent],
  template: `
<section class="container hero">
  <p class="eyebrow">Community lunch</p>
  <h1 class="glow">Food &amp; potluck</h1>
  <p class="lede">Lunch is a potluck made by Mossy Pine families — here's what's usually on the table.</p>
</section>

<app-rangoli />

<section class="container">
  <div class="card-grid">
    @for (m of potluck()?.menu || []; track m.title) {
      <div class="card">
        <h3>{{ m.title }}</h3>
        <p>{{ m.items }}</p>
      </div>
    }
  </div>
  <div class="card" style="margin-top: var(--space-4)">
    <h3>Bringing a dish?</h3>
    <p>{{ potluck()?.note }} Nothing formal — just mention it in the notes when you RSVP and the
    committee will balance the menu.</p>
    <a class="btn btn-gold" routerLink="/rsvp" style="margin-top: var(--space-2)">RSVP &amp; tell us your dish</a>
  </div>
</section>
  `,
})
export class FoodPage implements OnInit {
  potluck = signal<Potluck | null>(null);
  constructor(private data: DataService) {}
  ngOnInit() { this.data.potluck().then(p => this.potluck.set(p)).catch(() => {}); }
}
