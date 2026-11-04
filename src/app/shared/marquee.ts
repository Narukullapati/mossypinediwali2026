import { Component } from '@angular/core';

const WORDS = ['Mossy Pine Family Gathering', 'Nov 21 · 11 AM – 4 PM', 'Community celebration', 'All families welcome', 'Games, food & fun'];

@Component({
  selector: 'app-marquee',
  template: `<div class="marquee" [class.paused]="paused">
    <div class="marquee-track" aria-hidden="true">
      @for (w of words; track w) { <span>{{ w }} ✦</span> }
      @for (w of words; track w) { <span>{{ w }} ✦</span> }
    </div>
    <span class="sr-only">{{ words.join(', ') }}</span>
    <button type="button" class="marquee-pause" (click)="paused = !paused"
      [attr.aria-label]="paused ? 'Play scrolling greetings' : 'Pause scrolling greetings'">
      {{ paused ? '▶' : '❚❚' }}
    </button>
  </div>`,
  styles: `.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}`,
})
export class MarqueeComponent {
  words = WORDS;
  paused = false;
}
