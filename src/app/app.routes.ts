import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { SchedulePage } from './pages/schedule/schedule';
import { RsvpPage } from './pages/rsvp/rsvp';
import { GalleryPage } from './pages/gallery/gallery';
import { FoodPage } from './pages/food/food';
import { ContactPage } from './pages/contact/contact';
import { RegisterPage } from './pages/register/register';
import { AdminPage } from './pages/admin/admin';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Mossy Pine Family Gathering 2026' },
  { path: 'schedule', component: SchedulePage, title: 'Schedule — Mossy Pine Family Gathering' },
  { path: 'rsvp', component: RsvpPage, title: 'RSVP — Mossy Pine Family Gathering' },
  { path: 'cultural', component: RegisterPage, data: { type: 'cultural' }, title: 'Cultural Activity Registration — Mossy Pine Family Gathering' },
  { path: 'food', component: RegisterPage, data: { type: 'food' }, title: 'Food Registration — Mossy Pine Family Gathering' },
  { path: 'gallery', component: GalleryPage, title: 'Gallery — Mossy Pine Family Gathering' },
  { path: 'food', component: FoodPage, title: 'Food & Potluck — Mossy Pine Family Gathering' },
  { path: 'contact', component: ContactPage, title: 'Contact — Mossy Pine Family Gathering' },
  { path: 'admin', component: AdminPage, title: 'Admin — Mossy Pine Family Gathering' },
  { path: '**', redirectTo: '' },
];
