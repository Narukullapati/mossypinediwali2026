import { Component } from '@angular/core';

// Gold rangoli-motif divider band — decorative only.
@Component({
  selector: 'app-rangoli',
  template: `<svg class="rangoli" viewBox="0 0 480 48" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <defs>
      <g id="motif">
        <path d="M0,-16 Q5,-5 16,0 Q5,5 0,16 Q-5,5 -16,0 Q-5,-5 0,-16 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle r="4" fill="currentColor"/>
        <circle cx="0" cy="-24" r="2" fill="currentColor"/>
        <circle cx="0" cy="24" r="2" fill="currentColor"/>
        <circle cx="-24" cy="0" r="2" fill="currentColor"/>
        <circle cx="24" cy="0" r="2" fill="currentColor"/>
      </g>
    </defs>
    <use href="#motif" x="24" y="24"/>
    <use href="#motif" x="72" y="24"/>
    <use href="#motif" x="120" y="24"/>
    <use href="#motif" x="168" y="24"/>
    <use href="#motif" x="216" y="24"/>
    <use href="#motif" x="264" y="24"/>
    <use href="#motif" x="312" y="24"/>
    <use href="#motif" x="360" y="24"/>
    <use href="#motif" x="408" y="24"/>
    <use href="#motif" x="456" y="24"/>
  </svg>`,
})
export class RangoliComponent {}
