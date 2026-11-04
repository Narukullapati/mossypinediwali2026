import { Injectable } from '@angular/core';

export interface EventDetails {
  name: string; tagline: string; date: string; dateText: string;
  timeText: string; venue: string; address: string; description: string;
}
export interface ScheduleItem { time: string; title: string; desc: string; }
export interface GalleryItem { src: string; alt: string; }
export interface Potluck { note: string; menu: { title: string; items: string }[]; }
export interface Contact { org: string; name: string; email: string; phone: string; note: string; }
export interface RsvpStats { rsvps: number; guests: number; }
export interface RsvpResult { ok: boolean; id?: number; errors?: Record<string, string>; error?: string; }

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

@Injectable({ providedIn: 'root' })
export class DataService {
  event = () => get<EventDetails>('/api/event');
  schedule = () => get<ScheduleItem[]>('/api/schedule');
  gallery = () => get<GalleryItem[]>('/api/gallery');
  potluck = () => get<Potluck>('/api/potluck');
  contact = () => get<Contact>('/api/contact');
  rsvpStats = () => get<RsvpStats>('/api/rsvp/stats');

  async rsvp(body: { name: string; email: string; phone: string; address: string; adults: number; kids: number; vegCount: number; nonvegCount: number; volunteer: boolean; notes: string; website: string }): Promise<RsvpResult> {
    const r = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok && r.status !== 422) return { ok: false, error: data.error || 'Something went wrong — please try again.' };
    return data;
  }
}
