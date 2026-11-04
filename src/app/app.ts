import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MarqueeComponent } from './shared/marquee';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MarqueeComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  menuOpen = false;
}
