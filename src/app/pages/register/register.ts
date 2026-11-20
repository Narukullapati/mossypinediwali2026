import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  template: `
<div class="rsvp">
<section class="container hero">
  <p class="eyebrow">{{ isCultural ? 'Perform on stage' : 'Potluck sign-up' }}</p>
  <h1 class="glow">{{ isCultural ? 'Cultural Activity Registration' : 'Food Registration' }}</h1>
  <p class="lede">{{ isCultural
    ? 'Sign up to perform — dance, song, skit, instrument or anything festive.'
    : 'Pick items from the menu below — once an item is filled it can’t be taken by anyone else.' }}</p>
</section>
<section class="container">
  @if (isCultural) {
    @if (done()) {
      <div class="card form-success">
        <p class="big">Your act is registered!</p>
        <p class="muted">We’ll be in touch with the performance schedule.</p>
      </div>
    } @else {
      <form class="card form-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="team" data-tip="Team or organization name">Team/Organization name <span class="req">*</span></label>
          <input id="team" type="text" formControlName="team" placeholder="Long answer text" />
          @if (bad('team')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="perfCount" data-tip="How many performers">Number of performers <span class="req">*</span></label>
          <input id="perfCount" type="number" min="1" max="30" formControlName="perfCount" (input)="syncPerformers()" placeholder="Short answer text" />
          @if (bad('perfCount')) { <p class="error">Required</p> }
        </div>
        @for (row of perfRows.controls; track $index) {
          <div class="field-row" [formGroup]="row">
            <div class="field">
              <label data-tip="Performer name">Performer {{ $index + 1 }} name <span class="req">*</span></label>
              <input type="text" formControlName="name" placeholder="Short answer text" />
            </div>
            <div class="field field-age">
              <label data-tip="Performer age">Age <span class="req">*</span></label>
              <input type="number" min="1" max="120" formControlName="age" placeholder="Age" />
            </div>
          </div>
        }
        <div class="field">
          <label for="perfType" data-tip="Dance, singing, drawing, skit…">Performance Type (Dance, Singing, drawing etc.) <span class="req">*</span></label>
          <input id="perfType" type="text" formControlName="perfType" placeholder="Short answer text" />
          @if (bad('perfType')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="choreo" data-tip="Who choreographed the act">Choreographer Name <span class="req">*</span></label>
          <input id="choreo" type="text" formControlName="choreo" placeholder="Short answer text" />
          @if (bad('choreo')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="duration" data-tip="Approximate length in minutes">Approximate duration in Minutes <span class="req">*</span></label>
          <input id="duration" type="number" min="1" max="120" formControlName="duration" placeholder="Short answer text" />
          @if (bad('duration')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="contact" data-tip="Contact phone number">Contact Number <span class="req">*</span></label>
          <input id="contact" type="tel" formControlName="contact" autocomplete="tel" placeholder="Short answer text" />
          @if (bad('contact')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="email" data-tip="Contact email address">Email <span class="req">*</span></label>
          <input id="email" type="text" formControlName="email" autocomplete="email" placeholder="Short answer text" />
          @if (bad('email')) { <p class="error">Required</p> }
        </div>
        <div class="field">
          <label for="audio">Upload Audio File</label>
          <label class="file-btn" for="audio" data-tip="Optional: upload your audio track">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {{ fileName() || 'Add file' }}
          </label>
          <input id="audio" type="file" accept="audio/*" (change)="onFile($event)" hidden />
        </div>
        @if (serverError()) { <p class="error">{{ serverError() }}</p> }
        <button class="btn btn-gold" type="submit" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Submit' }}</button>
      </form>
    }
  } @else {
    @if (claimDone()) {
      <div class="card form-success">
        <p class="big">Thank you!</p>
        <p>{{ claimMsg() }}</p>
        <p class="muted">Want to sign up for another item?</p>
        <button class="btn btn-gold" type="button" (click)="claimDone.set(false)">Add another item</button>
      </div>
    } @else {
    <form class="gform" [formGroup]="pickForm" (ngSubmit)="submitPicks()" novalidate>
      <div class="menu-sheet">
        <div class="ms-frame">
          <i class="ms-corner tl"></i><i class="ms-corner tr"></i><i class="ms-corner bl"></i><i class="ms-corner br"></i>
          <header class="ms-head">
            <p class="ms-kicker">Hospitality &amp; Event Catering</p>
            <h2 class="ms-title">K-Bar Mossy Pine Family Gathering Menu</h2>
            <p class="ms-sub">Tick the items you'll bring — anything marked Filled is already claimed.</p>
            <div class="ms-divider"><span class="ms-line"></span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#C59B27"><path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"/></svg>
              <span class="ms-line"></span></div>
            <div class="ms-meta">
              <div><span>Event Date</span><b>Saturday, Nov 21, 2026</b></div>
              <div><span>Guest Count</span><b>{{ guestCount() ? guestCount() : '100 – 120' }} Family Guests</b></div>
              <div><span>Venue / Hall</span><b>K-Bar Amenity Center</b></div>
            </div>
          </header>
          <div class="ms-signup">
            <span class="ms-signup-label">Your Sign-Up</span>
            <div class="ms-addr">
              <label for="gaddr" data-tip="Must match your RSVP home address">Home address <span class="req">*</span></label>
              <input id="gaddr" type="text" formControlName="address" list="food-addrs" autocomplete="off"
                     (input)="suggest($event)" placeholder="Start typing your RSVP home address" />
              <datalist id="food-addrs">
                @for (a of addrOptions(); track a) { <option [value]="a"></option> }
              </datalist>
              <p class="ms-addr-note">Enter your RSVP home address first — then tick the items and name your dish below.</p>
              @if (pickForm.get('address')?.touched && pickForm.get('address')?.invalid) { <p class="error">Required</p> }
            </div>
          </div>
          <div class="ms-grid">
            @if (!menu().length) {
              <p class="ms-load-err">{{ menuErr() || 'Loading menu…' }}</p>
            }
            @for (cat of menu(); track cat.title) {
              <section class="ms-card">
                <div class="ms-photo"><img [src]="cat.img" [alt]="cat.title" (error)="imgFallback($event, cat.title)" loading="lazy" /><span class="ms-badge">{{ cat.badge }}</span></div>
                <h3 class="ms-card-title">{{ cat.title }}</h3>
                <ul class="ms-list">
                    @for (it of rowItems(cat); track it.id) {
                      <li>
                        <div class="mrow" [class.plain]="!it.needsName && !it.slotLabel" [class.sel]="hasPicked(it)" [class.filled]="it.remaining <= 0">
                          @if (!it.needsName && !it.slotLabel) {
                            <span class="mslots">
                              @for (k of idxs(it.slots); track k) {
                                <input type="checkbox" class="mcheck" [checked]="!!it.taken[k] || picked().has(it.id + '#' + k)" [disabled]="it.taken[k]" [title]="it.taken[k] || ''" (change)="toggleSlot(it, k)" />
                              }
                            </span>
                          }
                          @if (it.veg === true) { <span class="mdot veg" title="Vegetarian"></span> }
                          @if (it.veg === false) { <span class="mdot nonveg" title="Non-Vegetarian"></span> }
                          @if (it.dot === 'gold') { <span class="mdot gold"></span> }
                          <span class="mname-wrap"><span class="mname">{{ it.name }}</span>@if (it.sub) { <span class="msub">{{ it.sub }}</span> }</span>
                          <span class="mleader"></span>
                          @if (it.remaining <= 0 && !it.needsName && !it.slotLabel) {
                            <span class="mpill pill-filled">Full</span>
                          } @else if (it.qty) {
                            <span class="mpill">{{ it.qty }}</span>
                          }
                        </div>
                        @if (it.needsName) {
                          <div class="dish-slots">
                            @for (k of idxs(it.slots); track k) {
                              <div class="dish-slot" [class.on]="picked().has(it.id + '#' + k)" [class.claimed]="it.taken[k]">
                                <input type="checkbox" class="mcheck" [checked]="!!it.taken[k] || picked().has(it.id + '#' + k)" [disabled]="it.taken[k]" [title]="it.taken[k] || ''" (change)="toggleSlot(it, k)" />
                                <span class="dish-tag">Variety {{ k + 1 }}</span>
                                @if (!it.taken[k]) {
                                  <input type="text" class="dish-input" maxlength="120"
                                         [placeholder]="picked().has(it.id + '#' + k) ? 'Dish name *' : 'Type the dish you will bring'"
                                         [value]="dishName(it, k)" (input)="setDish(it, k, $event)" />
                                } @else {
                                  <span class="dish-claimed">{{ it.taken[k] }}</span><span class="dish-filled">Full</span>
                                }
                              </div>
                            }
                          </div>
                        }
                        @if (it.slotLabel) {
                          <div class="dish-slots">
                            @for (k of idxs(it.slots); track k) {
                              <label class="dish-slot" [class.on]="picked().has(it.id + '#' + k)" [class.claimed]="it.taken[k]">
                                <input type="checkbox" class="mcheck" [checked]="!!it.taken[k] || picked().has(it.id + '#' + k)" [disabled]="it.taken[k]" (change)="toggleSlot(it, k)" />
                                <span class="dish-tag dish-tag--name">{{ it.slotLabel }} {{ k + 1 }}{{ it.slotTag ? ' (' + it.slotTag + ')' : '' }}</span>
                                @if (it.taken[k]) { <span class="dish-claimed">{{ it.taken[k] }}</span><span class="dish-filled">Full</span> }
                              </label>
                            }
                          </div>
                        }
                      </li>
                    }
                  </ul>
                @if (cat.note) { <p class="ms-note">{{ cat.note }}</p> }
              </section>
            }
          </div>
          <footer class="ms-foot">
            <span class="legend"><span class="mdot veg"></span> Vegetarian</span>
            <span class="legend"><span class="mdot nonveg"></span> Non-Vegetarian</span>
            <span class="ms-foot-note">K-Bar Mossy Pine Family Gathering</span>
          </footer>
        </div>
      </div>
      @if (pickError()) { <p class="error">{{ pickError() }}</p> }
      @if (serverError()) { <p class="error">{{ serverError() }}</p> }
      <button class="btn btn-gold" type="submit" [disabled]="claiming()">{{ claiming() ? 'Submitting…' : 'Submit' }}</button>
    </form>
    }
  }
</section>
  @if (notice()) {
    <div class="modal-backdrop" (click)="closeNotice()" role="presentation">
      <div class="modal card" role="alertdialog" aria-labelledby="notice-modal-title" (click)="$event.stopPropagation()">
        <h3 id="notice-modal-title">{{ noticeTitle() }}</h3>
        <p class="muted">{{ notice() }}</p>
        <button class="btn btn-gold" type="button" (click)="closeNotice()">OK</button>
      </div>
    </div>
  }
  @if (addrModal()) {
    <div class="modal-backdrop" (click)="closeAddr()" role="presentation">
      <div class="modal card" role="alertdialog" aria-labelledby="addr-modal-title" (click)="$event.stopPropagation()">
        <h3 id="addr-modal-title">Home address needed</h3>
        <p class="muted">Please enter the home address from your RSVP in the <b>Your Sign-Up</b> box above, then hit Submit again.</p>
        <button class="btn btn-gold" type="button" (click)="closeAddr()">OK</button>
      </div>
    </div>
  }
  @if (modalErrors().length) {
    <div class="modal-backdrop" (click)="closeModal()" role="presentation">
      <div class="modal card" role="alertdialog" aria-labelledby="reg-modal-title" (click)="$event.stopPropagation()">
        <h3 id="reg-modal-title">Please check your registration</h3>
        @for (e of modalErrors(); track e) { <p class="error">{{ e }}</p> }
        <button class="btn btn-gold" type="button" (click)="closeModal()">OK</button>
      </div>
    </div>
  }
</div>
  `,
  styles: `
  .gform{max-width:920px;margin-inline:auto}
  .menu-sheet{background-color:#FBF9F5;background-image:radial-gradient(#C59B27 .45px,transparent .45px),radial-gradient(#C59B27 .45px,#FBF9F5 .45px);background-size:36px 36px;background-position:0 0,18px 18px;border:1px solid rgba(197,155,39,.4);border-radius:16px;box-shadow:0 20px 50px rgba(44,39,37,.12);padding:10px;margin-bottom:14px}
  .ms-frame{position:relative;border:2px solid rgba(197,155,39,.5);border-radius:12px;background:rgba(251,249,245,.95);padding:16px 16px}
  .ms-corner{position:absolute;width:26px;height:26px;border:0 solid #C59B27;pointer-events:none}
  .ms-corner.tl{top:8px;left:8px;border-top-width:2px;border-left-width:2px;border-top-left-radius:6px}
  .ms-corner.tr{top:8px;right:8px;border-top-width:2px;border-right-width:2px;border-top-right-radius:6px}
  .ms-corner.bl{bottom:8px;left:8px;border-bottom-width:2px;border-left-width:2px;border-bottom-left-radius:6px}
  .ms-corner.br{bottom:8px;right:8px;border-bottom-width:2px;border-right-width:2px;border-bottom-right-radius:6px}
  .ms-head{text-align:center;margin-bottom:14px}
  .ms-kicker{text-transform:uppercase;letter-spacing:.28em;font-size:.68rem;font-weight:700;color:#C59B27;margin:0 0 6px}
  .ms-title{font-family:Georgia,'Times New Roman',serif;font-size:1.9rem;font-weight:700;color:#6B1D2F;margin:0 0 6px}
  .ms-sub{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:.92rem;color:#6E655F;margin:0}
  .ms-divider{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0}
  .ms-line{height:1px;width:90px;background:linear-gradient(90deg,transparent,#C59B27)}
  .ms-line:last-child{background:linear-gradient(90deg,#C59B27,transparent)}
  .ms-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:640px;margin:0 auto;background:rgba(243,236,224,.6);border:1px solid rgba(197,155,39,.3);border-radius:10px;padding:7px 12px}
  .ms-meta span{display:block;font-size:.58rem;text-transform:uppercase;letter-spacing:.14em;font-weight:700;color:#C59B27;margin-bottom:2px}
  .ms-meta b{font-family:Georgia,'Times New Roman',serif;font-size:.82rem;color:#2C2725;font-weight:600}
  .ms-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ms-load-err{grid-column:1 / -1;text-align:center;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#6E655F;padding:24px 0}
  .ms-card{background:rgba(255,255,255,.9);border:1px solid #E6DEC8;border-radius:10px;box-shadow:0 1px 3px rgba(44,39,37,.05);overflow:hidden;display:flex;flex-direction:column}
  .ms-card.wide{grid-column:1 / -1}
  .ms-photo{position:relative;height:72px;overflow:hidden;background:linear-gradient(135deg,#F3ECE0,#E8DEC9)}
  .ms-photo img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.16,1,.3,1)}
  .ms-card:hover .ms-photo img{transform:scale(1.06)}
  .ms-badge{position:absolute;bottom:9px;right:10px;font-size:.58rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#FBF9F5;background:rgba(107,29,47,.9);border:1px solid rgba(197,155,39,.4);padding:3px 9px;border-radius:999px}
  .ms-card-title{font-family:Georgia,'Times New Roman',serif;font-size:1.05rem;font-weight:700;color:#6B1D2F;margin:0;padding:9px 14px 6px;border-bottom:1px solid rgba(197,155,39,.3)}
  .ms-list{list-style:none;margin:0;padding:8px 14px 10px;display:flex;flex-direction:column;gap:6px;flex:1}
  .ms-note{font-size:.72rem;color:#6E655F;font-style:italic;margin:0 14px 10px;padding-top:6px;border-top:1px solid #F3ECE0}
  .mrow{display:flex;align-items:center;flex-wrap:wrap;gap:8px;border-radius:6px;padding:2px 6px;margin:0 -6px;transition:background .15s}
  .mslots{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}
  .mrow:not(.filled):hover{background:rgba(197,155,39,.08)}
  .mrow.sel{background:rgba(107,29,47,.07)}
  .mrow.filled{cursor:default}
  .mrow.plain:not(.filled){background:#DCFCE7;border-radius:8px;padding-left:6px;padding-right:6px}
  .mrow.plain.filled{background:#FEE2E2;border-radius:8px;padding-left:6px;padding-right:6px}
  .mrow.plain:not(.filled):hover{background:#BBF7D0}
  .mcheck{width:15px;height:15px;accent-color:#6B1D2F;flex-shrink:0;cursor:pointer;margin:0}
  .mcheck:not(:disabled):not(:checked){outline:1.5px solid #15803D;outline-offset:2px;border-radius:4px}
  .mrow.filled .mcheck{cursor:default}
  .dish-slots{display:flex;flex-direction:column;gap:4px;margin:0 6px 4px 6px}
  .dish-slot{display:flex;align-items:center;gap:8px}
  .dish-slot:not(.claimed){background:#DCFCE7;border:1px dashed rgba(21,128,61,.45);border-radius:8px;padding:5px 8px;margin-left:-8px;color:#000}
  .dish-slot.on{background:#BBF7D0;border:1px solid #15803D}
  .dish-tag{font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#C59B27;white-space:nowrap;min-width:58px}
  .dish-tag--name{font-size:.82rem;text-transform:none;letter-spacing:0;color:#000;font-weight:700}
  label.dish-slot{cursor:pointer;border-radius:6px;padding:3px 6px;margin-left:-6px}
  label.dish-slot:not(.claimed):hover{background:rgba(197,155,39,.08)}
  .dish-input{flex:1;min-width:0;background:transparent;border:none;border-bottom:1px dotted #C9B48A;padding:4px 2px;font:inherit;font-size:.85rem;color:#2C2725}
  .dish-input:disabled{opacity:.45}
  .dish-input:focus{outline:none;border-bottom:2px solid #6B1D2F}
  .dish-slot.on .dish-input{border-bottom-color:#6B1D2F}
  .dish-claimed{font-size:.82rem;color:#000;font-style:italic}
  .dish-filled{font-size:.5rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#fff;background:#EF4444;border-radius:999px;padding:0 5px;margin-left:6px;white-space:nowrap}
  .dish-slot.claimed{background:#FEE2E2;border:1px solid rgba(220,38,38,.35);border-radius:8px;padding:5px 8px;margin-left:-8px;color:#000}
  .warn-list{text-align:left;margin:8px 0 12px;padding-left:22px;color:#2C2725}
  .warn-list li{margin:2px 0}
  .mdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .mdot.veg{background:#15803D}
  .mdot.nonveg{background:#6B1D2F}
  .mdot.gold{background:#C59B27}
  .mname-wrap{display:flex;flex-direction:column;flex:1 1 140px;min-width:0}
  .mname{font-weight:700;font-size:.92rem;color:#000}
  .mrow.filled .mname{color:#000}
  .msub{font-size:.68rem;color:#8E847D;font-style:italic;margin-top:1px}
  .mleader{flex:1;min-width:12px;border-bottom:1px dotted rgba(197,155,39,.55)}
  .mpill{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#FBF9F5;background:#6B1D2F;border:1px solid #C59B27;padding:4px 10px;border-radius:6px;white-space:nowrap;flex-shrink:0}
  .mpill.pill-filled{color:#fff;background:#EF4444;border-radius:999px;font-size:.55rem;padding:2px 7px}
  .mpill.pill-avail{color:#fff;background:#22C55E;border:1px solid #22C55E;border-radius:999px}
  .mrow.sel .mpill:not(.pill-avail){background:#C59B27;color:#FBF9F5}
  .ms-signup{max-width:640px;margin:0 auto 12px;background:rgba(243,236,224,.6);border:1px solid rgba(197,155,39,.3);border-radius:10px;padding:9px 16px 8px}
  .ms-signup-label{display:block;text-align:center;font-size:.6rem;text-transform:uppercase;letter-spacing:.2em;font-weight:700;color:#C59B27;margin-bottom:5px}
  .ms-addr label{display:block;font-weight:500;font-size:1rem;color:#1E1E3C;margin-bottom:6px}
  .ms-addr label .req{color:#D92D20}
  .ms-addr input{width:100%;background:transparent;border:none;border-bottom:1px dotted #5F6368;padding:5px 0;font:inherit;color:#2C2725}
  .ms-addr input:focus{outline:none;border-bottom:2px solid #6B1D2F}
  .ms-addr input::placeholder{color:#9AA0A6}
  .ms-addr-note{font-size:.72rem;color:#6E655F;margin:6px 0 0}
  .ms-foot{display:flex;align-items:center;gap:18px;margin-top:12px;padding-top:8px;border-top:1px solid rgba(197,155,39,.4);font-size:.72rem;color:#6E655F}
  .legend{display:inline-flex;align-items:center;gap:6px}
  .ms-foot-note{margin-left:auto;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#2C2725}
  @media(max-width:720px){.ms-grid{grid-template-columns:1fr}.ms-meta{grid-template-columns:1fr;text-align:center}.ms-title{font-size:1.5rem}
    .mrow{flex-wrap:wrap;gap:4px 8px}
    .mname-wrap{flex:1 1 55%;min-width:0}
    .mname{overflow-wrap:break-word}
    .msub{overflow-wrap:break-word}
    .mleader{display:none}
    .mpill{font-size:.72rem;padding:3px 8px}
    .dish-slot{flex-wrap:wrap}
    .dish-input{min-width:0;flex:1}}
  .gform .field{max-width:640px;margin-inline:auto;margin-bottom:16px}
  .gform .btn-gold{display:block;margin:0 auto}
  `,
})
export class RegisterPage implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  type = 'cultural';
  isCultural = true;
  form = this.fb.group({
    team: ['', Validators.required],
    perfCount: ['', Validators.required],
    performers: this.fb.array<FormGroup>([]),
    perfType: ['', Validators.required],
    choreo: ['', Validators.required],
    duration: ['', Validators.required],
    contact: ['', Validators.required],
    email: ['', Validators.required],
  });
  file: File | null = null;
  fileName = signal('');
  sending = signal(false);
  done = signal(false);
  serverError = signal('');
  menu = signal<any[]>([]);
  flatMenu = computed(() => this.menu().flatMap((c: any) => c.items));
  rowItems = (c: any) => (c.items || []).filter((i: any) => !i.tile);
  imgFallback(e: Event, label: string) {
    const img = e.target as HTMLImageElement;
    if (img.dataset['fb']) return;
    img.dataset['fb'] = '1';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320" viewBox="0 0 800 320"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6B1D2F"/><stop offset="100%" stop-color="#3E0F1A"/></linearGradient></defs><rect width="800" height="320" fill="url(#bg)"/><rect x="16" y="16" width="768" height="288" rx="12" fill="none" stroke="#C59B27" stroke-width="1.5" stroke-opacity="0.65"/><text x="400" y="152" text-anchor="middle" fill="#FBF9F5" font-family="Georgia, serif" font-size="28" font-weight="bold">${label}</text><text x="400" y="186" text-anchor="middle" fill="#DEC065" font-family="sans-serif" font-size="13" letter-spacing="4">K-BAR MOSSY PINE CATERING</text></svg>`;
    img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }
  picked = signal<Set<string>>(new Set());
  pickForm = this.fb.group({ address: ['', Validators.required] });
  claiming = signal(false);
  pickError = signal('');
  claimMsg = signal('');

  async ngOnInit() {
    this.isCultural = this.route.snapshot.data['type'] !== 'food';
    if (!this.isCultural) {
      this.loadMenu();
      this.loadGuestCount();
    }
  }

  menuErr = signal('');
  guestCount = signal('');

  async loadGuestCount() {
    try {
      const r = await fetch('/api/rsvp/stats');
      const d = await r.json();
      if (Number.isInteger(d.guests)) this.guestCount.set(`${d.guests + 15} – ${d.guests + 25}`);
    } catch { /* keep fallback text */ }
  }

  async loadMenu() {
    try {
      const r = await fetch('/api/food-menu');
      const d = await r.json();
      if (!r.ok || !d.categories?.length) this.menuErr.set('Menu is unavailable right now — please refresh or try again shortly.');
      this.menu.set(d.categories || []);
    } catch {
      this.menuErr.set('Menu is unavailable right now — please refresh or try again shortly.');
    }
  }

  idxs = (n: number) => Array.from({ length: Math.max(1, n || 1) }, (_, i) => i);

  hasPicked(it: any) {
    for (const k of this.picked()) if (k.startsWith(it.id + '#')) return true;
    return false;
  }

  dishNames = signal<Map<string, string>>(new Map());

  dishName(it: any, k: number) { return this.dishNames().get(it.id + '#' + k) || ''; }

  setDish(it: any, k: number, e: Event) {
    const v = (e.target as HTMLInputElement).value;
    const m = new Map(this.dishNames());
    m.set(it.id + '#' + k, v);
    this.dishNames.set(m);
    if (v.trim() && !this.picked().has(it.id + '#' + k)) {
      const s = new Set(this.picked());
      s.add(it.id + '#' + k);
      this.picked.set(s);
    }
  }

  private comboKeys(it: any, k: number): { key: string; taken: boolean; name: string }[] {
    const flat = this.menu().flatMap((c: any) => c.items);
    const slotTaken = (id: string, idx: number) => {
      const i = flat.find((x: any) => x.id === id);
      return !!i && !!i.taken[idx];
    };
    const nameOf = (id: string) => flat.find((x: any) => x.id === id)?.name || id;
    if (it.id === 'chapathi') {
      const pid = 'waterCase' + (k + 1);
      if (flat.some((x: any) => x.id === pid))
        return [{ key: pid + '#0', taken: slotTaken(pid, 0), name: nameOf(pid) }];
    }
    const m = /^waterCase(\d+)$/.exec(it.id);
    if (m && flat.some((x: any) => x.id === 'chapathi')) {
      const k2 = Number(m[1]) - 1;
      return [{ key: 'chapathi#' + k2, taken: slotTaken('chapathi', k2), name: 'Chapati + Water Set ' + (k2 + 1) }];
    }
    for (const g of [
      ['coldDrinksCase3', 'bowls', 'napkins'],
      ['paperPlates', 'spoons'],
      ['curdRice', 'trashBags'],
      ['sandwichZiploc', 'tableCovers', 'cleaningWipes', 'paperCups'],
    ]) {
      if (g.includes(it.id))
        return g.filter(id => id !== it.id).map(id => ({ key: id + '#0', taken: slotTaken(id, 0), name: nameOf(id) }));
    }
    return [];
  }

  toggleSlot(it: any, k: number) {
    if (it.taken[k]) return;
    const key = it.id + '#' + k;
    const s = new Set(this.picked());
    const on = !s.has(key);
    const partners = this.comboKeys(it, k);
    if (on && partners.some(p => p.taken)) {
      const filled = partners.filter(p => p.taken).map(p => `"${p.name}"`).join(', ');
      this.noticeTitle.set('Combo partner filled');
      this.notice.set(`"${it.name}" goes together with ${filled} — but it's already filled.`);
      return;
    }
    if (on) s.add(key); else s.delete(key);
    for (const p of partners) { if (on) s.add(p.key); else s.delete(p.key); }
    if (on && partners.length) {
      this.noticeTitle.set('Combo selected');
      this.notice.set(`You have to bring ${partners.length > 1 ? 'all these items' : 'both items'} — "${[it.name, ...partners.map(p => p.name)].join('", "')}" are selected together.`);
    }
    this.picked.set(s);
    this.pickError.set('');
  }

  claimDone = signal(false);

  notice = signal('');
  noticeTitle = signal('Please check your selection');
  closeNotice() { this.notice.set(''); this.noticeTitle.set('Please check your selection'); }

  addrModal = signal(false);
  closeAddr() {
    this.addrModal.set(false);
    document.getElementById('gaddr')?.focus();
  }

  async submitPicks() {
    this.pickError.set('');
    this.serverError.set('');
    if (!this.picked().size) { this.notice.set('Pick at least one item from the menu.'); return; }
    const noDish = this.flatMenu().filter((it: any) =>
      it.needsName && this.idxs(it.slots).some(k => this.picked().has(it.id + '#' + k) && !this.dishName(it, k).trim()));
    if (noDish.length) {
      this.notice.set(`Enter the dish name for ${noDish.map((it: any) => `"${it.name}"`).join(', ')}.`);
      return;
    }
    if (this.pickForm.invalid) { this.pickForm.markAllAsTouched(); this.addrModal.set(true); return; }
    this.claiming.set(true);
    try {
      const items = [...this.picked()].map(k => {
        const [id, kStr] = String(k).split('#');
        const it = this.flatMenu().find((i: any) => i.id === id);
        const slot = +kStr;
        return it?.needsName ? { item: id, dish: this.dishNames().get(String(k))?.trim() || '', slot } : { item: id, slot };
      });
      const r = await fetch('/api/food-menu/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: this.pickForm.value.address }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        const got = (d.claimed || []).join(', ');
        const miss = (d.failed || []).length ? ` — couldn't get: ${d.failed.join(', ')} (already filled)` : '';
        this.claimMsg.set(`${d.name ? d.name + ', you are' : 'You are'} signed up for: ${got}${miss}`);
        this.claimDone.set(true);
        setTimeout(() => document.querySelector('.form-success')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        this.picked.set(new Set());
        this.dishNames.set(new Map());
        this.pickForm.reset();
        await this.loadMenu();
        return;
      }
      if (d.errors) {
        if (d.errors.items) this.notice.set(d.errors.items);
        if (d.errors.address) { this.pickForm.get('address')?.setErrors({ server: d.errors.address }); this.pickForm.markAllAsTouched(); }
      } else if (r.status === 409) this.notice.set(d.error || 'Those items are already filled.');
      else this.serverError.set(d.error || 'Something went wrong — please try again.');
      if (r.status === 409) await this.loadMenu();
    } catch {
      this.serverError.set('Network problem — please try again.');
    } finally { this.claiming.set(false); }
  }

  bad(name: string) {
    const c = this.form.get(name);
    return !!(c && c.touched && c.invalid);
  }

  get perfRows() { return this.form.get('performers') as FormArray<FormGroup>; }

  syncPerformers() {
    const n = Math.min(Math.max(parseInt(String(this.form.value.perfCount), 10) || 0, 0), 30);
    const arr = this.perfRows;
    while (arr.length < n) arr.push(this.fb.group({ name: ['', Validators.required], age: ['', Validators.required] }));
    while (arr.length > n) arr.removeAt(arr.length - 1);
  }

  addrOptions = signal<string[]>([]);
  private suggestTimer: any = null;
  suggest(e: Event) {
    const q = (e.target as HTMLInputElement).value;
    clearTimeout(this.suggestTimer);
    this.suggestTimer = setTimeout(async () => {
      if (!q || q.length < 2) { this.addrOptions.set([]); return; }
      try {
        const r = await fetch(`/api/address-suggest?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        this.addrOptions.set(d.suggestions || []);
      } catch { /* ignore */ }
    }, 200);
  }


  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] || null;
    this.file = f;
    this.fileName.set(f ? f.name : '');
  }

  modalErrors = signal<string[]>([]);
  closeModal() { this.modalErrors.set([]); }

  private missing(form: any, labels: Record<string, string>) {
    return Object.keys(labels).filter(k => form.get(k)?.invalid).map(k => `${labels[k]} is required.`);
  }

  async submit() {
    this.serverError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const miss = this.missing(this.form, {
        team: 'Team/Organization name', perfCount: 'Number of performers',
        perfType: 'Performance type', choreo: 'Choreographer name',
        duration: 'Duration', contact: 'Contact number', email: 'Email',
      });
      if (this.perfRows.controls.some(r => r.invalid)) miss.push('Performer names and ages are required.');
      this.modalErrors.set(miss);
      return;
    }
    this.sending.set(true);
    try {
      const fd = new FormData();
      const v = this.form.value as any;
      fd.append('team', v.team ?? '');
      fd.append('perfCount', v.perfCount ?? '');
      fd.append('performers', this.perfRows.value.map((p: any) => `${p.name}${p.age ? ` (${p.age})` : ''}`).join(', '));
      fd.append('perfType', v.perfType ?? '');
      fd.append('choreo', v.choreo ?? '');
      fd.append('duration', v.duration ?? '');
      fd.append('contact', v.contact ?? '');
      fd.append('email', v.email ?? '');
      if (this.file) fd.append('audio', this.file);
      const r = await fetch('/api/register/cultural', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { this.done.set(true); return; }
      if (d.errors) {
        const first = Object.keys(d.errors)[0];
        const c = this.form.get(first);
        if (c) c.setErrors({ server: d.errors[first] });
        c?.markAsTouched();
        this.modalErrors.set(Object.values(d.errors));
      } else this.serverError.set(d.error || 'Something went wrong — please try again.');
    } catch {
      this.serverError.set('Network problem — please try again.');
    } finally { this.sending.set(false); }
  }
}
