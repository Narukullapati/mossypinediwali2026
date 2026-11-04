import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, ScheduleItem } from '../../data.service';
import { RangoliComponent } from '../../shared/rangoli';

@Component({
  selector: 'app-schedule',
  imports: [RouterLink, RangoliComponent],
  template: `
<section class="container hero">
  <p class="eyebrow">Run of show</p>
  <h1 class="glow">The evening, hour by hour</h1>
  <p class="lede">Saturday, November 21, 2026 · from 11:00 AM · K-Bar Amenity Center, Tampa</p>
</section>

<app-rangoli />

<section class="container">
  <ol class="timeline">
    @for (item of items(); track item.time) {
      <li>
        <div class="time">{{ item.time }}</div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.desc }}</p>
      </li>
    }
  </ol>
  <div class="card" style="margin-top: var(--space-4)">
    <h3>Good to know</h3>
    <p>Bring the kids — sparklers are family-safe and gloves are provided. Lunch is a potluck;
    tell us what you're bringing when you RSVP. Parking fills fast, so arrive early or carpool.</p>
    <a class="btn btn-gold" routerLink="/rsvp" style="margin-top: var(--space-2)">RSVP now</a>
  </div>
</section>
  `,
})
export class SchedulePage implements OnInit {
  items = signal<ScheduleItem[]>([]);
  constructor(private data: DataService) {}
  ngOnInit() { this.data.schedule().then(s => this.items.set(s)).catch(() => {}); }
}
