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
  <div class="diya-row" aria-hidden="true">
    <app-diya /><app-diya /><app-diya /><app-diya /><app-diya />
  </div>
</section>

<section class="container">
  <h2>A day of light, food &amp; family</h2>
  <p class="muted">Three moments not to miss.</p>
  <div class="card-grid" style="margin-top: var(--space-4)">
    <div class="card">
      <h3>Cultural &amp; kids' fun</h3>
      <p>Dances, songs and skits by the children of Mossy Pine, plus games and activities for the whole family.</p>
    </div>
    <div class="card">
      <h3>Community lunch</h3>
      <p>A potluck feast made by Mossy Pine families — biryanis, chaat, sweets and endless chai.</p>
    </div>
    <div class="card">
      <h3>Sparklers &amp; dance</h3>
      <p>Family-safe sparklers in the courtyard, then Bollywood favourites and garba on the open floor.</p>
    </div>
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
