import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-reg-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `<div class="reg-tabs" role="tablist" aria-label="Registration">
    <a role="tab" routerLink="/rsvp" routerLinkActive="on">RSVP</a>
    <a role="tab" routerLink="/cultural" routerLinkActive="on">Cultural activity</a>
    <a role="tab" routerLink="/food" routerLinkActive="on">Food</a>
  </div>`,
})
export class RegTabsComponent {}
