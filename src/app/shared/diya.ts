import { Component } from '@angular/core';

// A single hand-drawn diya (bowl + rim + flame) in the site palette.
@Component({
  selector: 'app-diya',
  template: `<svg viewBox="0 0 100 140" role="img" aria-hidden="true">
    <path class="bowl" d="M8,96 A42,30 0 0 0 92,96 Z" fill="#FF8A1E"/>
    <ellipse cx="50" cy="96" rx="42" ry="9" fill="#F5B841"/>
    <path class="flame" d="M50,8 C58,32 62,66 50,92 C38,66 42,32 50,8 Z" fill="#F5B841"/>
    <path d="M50,42 C54,56 56,74 50,86 C44,74 46,56 50,42 Z" fill="#FFF3DC"/>
  </svg>`,
})
export class DiyaComponent {}
