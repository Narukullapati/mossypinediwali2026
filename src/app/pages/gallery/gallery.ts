import { Component, OnInit, signal } from '@angular/core';
import { DataService, GalleryItem } from '../../data.service';
import { RangoliComponent } from '../../shared/rangoli';

@Component({
  selector: 'app-gallery',
  imports: [RangoliComponent],
  template: `
<section class="container hero">
  <p class="eyebrow">Memories</p>
  <h1 class="glow">Moments from past years</h1>
  <p class="lede">Diyas, rangoli, performances and sparklers — a look back at how Mossy Pine celebrates.</p>
</section>

<app-rangoli />

<section class="container">
  <div class="gallery-grid">
    @for (img of items(); track img.src) {
      <figure>
        <img [src]="img.src" [alt]="img.alt" loading="lazy" />
        <figcaption>{{ img.alt }}</figcaption>
      </figure>
    }
  </div>
  <p class="muted" style="margin-top: var(--space-3)">Real photos from this year's celebration will
  replace these placeholders after the event — send yours to the organising team.</p>
</section>
  `,
})
export class GalleryPage implements OnInit {
  items = signal<GalleryItem[]>([]);
  constructor(private data: DataService) {}
  ngOnInit() { this.data.gallery().then(g => this.items.set(g)).catch(() => {}); }
}
