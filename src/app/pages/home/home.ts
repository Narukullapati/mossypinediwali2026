import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, EventDetails } from '../../data.service';
import { DiyaComponent } from '../../shared/diya';
import { RangoliComponent } from '../../shared/rangoli';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DiyaComponent, RangoliComponent],
  template: `
<section class="hero container">
  <p class="eyebrow">{{ ev()?.tagline || 'A community celebration' }}</p>
  <h1 class="glow">Mossy Pine <span>Family Gathering</span></h1>
  <p class="venue-line">{{ ev()?.venue }}@if (ev()?.address) { · {{ ev()?.address }}}</p>
  <p class="lede">{{ ev()?.description }}</p>
  <div class="hero-meta">
    <span class="chip"><span class="num">{{ ev()?.dateText }}</span> · {{ ev()?.timeText }}</span>
  </div>
  <div class="cta-row">
    <a class="btn btn-gold" routerLink="/rsvp">RSVP now</a>
  </div>
  <img class="flyer" src="/images/flyer.jpg" alt="K-Bar Family Gathering celebration flyer — Saturday, November 21, 2026, 11 AM to 4 PM" />
  <div class="diya-row" aria-hidden="true">
    <app-diya /><app-diya /><app-diya /><app-diya /><app-diya />
  </div>
</section>

  `,
})
export class HomePage implements OnInit {
  ev = signal<EventDetails | null>(null);
  constructor(private data: DataService) {}
  async ngOnInit() {
    this.data.event().then(e => this.ev.set(e)).catch(() => {});
  }
}
