# RÉVISION 2026-11-27 (user): 50 % Vercel / 50 % Lease Lane — SUPERSEDES the 65/35 split below where they differ

The user changed the balance to 50/50. Keep everything the 65/35 work built for STRUCTURE and CRAFT (Vercel half), and bring
back Lease Lane's IDENTITY in the chrome and the titles (Lease Lane half):

Vercel half (unchanged from 65/35): Geist for UI/body text, Geist Mono labels (IDs, eyebrows, table headers, keys), body text
greys #171717 / #4D4D4D / #666, #FAFAFA canvas + white cards, shadow-as-border rings and hairlines (no soft heavy shadows), tinted
status pills, Vercel tables / tabs / inputs / segmented controls, control heights 36 desktop / 44 phone, tight tracking, no
gradients, no glows, no blur > 24px.

Lease Lane half (changes from 65/35):
1. Navigation chrome is MARINE again, flat solid #0C2147 (no gradient, no glow):
   - tenant/owner sidebar: keep the Vercel structure (icon + label in a row, ~240 px wide on desktop) but on marine; items
     #DCE7F5, hover rgba(255,255,255,.08), active rgba(255,255,255,.12) + white text 500 + 2px #91B5E0 indicator; badges
     white-on-#3767A2; logo = logo-icone-blanc / logo-sur-marine. Radius of the sidebar panel 12px (it floats like today).
   - phone bottom bar: marine flat, floating 12px radius bar (left/right/bottom 8px + safe-area), active item
     rgba(255,255,255,.12); "Plus" popover stays white.
   - admin top bar BarreHaut stays WHITE (it is white in Lease Lane too) with hairline ring; admin phone bar BarreBasAdmin =
     marine flat like above.
2. Page header band comes back on the tenant pages (`.lo-bandeau`) as a FLAT solid marine band, radius 12, padding 24/28
   desktop and 20/16 phone, white title, #C8DAF0 subtitle/eyebrow, controls on the band with ring rgba(255,255,255,.16),
   urgency button tinted (#FDECEB/#9B2E28). NO card overlap: remove the negative "remonte" margin, cards start 24px below
   the band (16 on phone). The tenant home keeps its +40 % breathing room between greeting and cards INSIDE the band layout
   (i.e. band bottom padding 24 + gap; don't re-create empty navy space).
   Owner/admin pages keep their own header structure (no band) but titles follow rule 3.
3. Titles in Lease Lane's display face: Poppins 600 for h1 / page titles / greetings / section titles (h2.titre-carte,
   .po-titre, .accueil-tete h1, .po-section h2, .lo-bandeau h1), letter-spacing -0.02em (h1) / -0.01em (h2), colour marine
   #0C2147 on light surfaces (white on the marine band). Everything else stays Geist (body, buttons, numbers, tables). KPI
   numbers stay Geist 600 tabular.
4. Radii in between: cards 12 (was 8), popovers/modals/drawers 12, controls 8 (was 6), pills 9999.
5. Marine may be used for headings (rule 3), links, primary buttons, active states, focus, progress, chart lines, info pills,
   and ONE optional marine hero card per page.
6. Audit adjustments: Poppins is now PERMITTED on the title selectors of rule 3 (configure `poppinsPermis`); everything else
   unchanged (radius > 12 still flagged except pills/circles, palette, contrast AA, overflow, targets, errors).
The prototype toggle labels stay "Actuel / Mix Vercel".

# Lease Lane × Vercel — 65 % Vercel / 35 % Lease Lane (all portals)

Decided 2026-11-27 with the user: "Vercel dominant, 65 % Vercel styling, 35 % Lease Lane, for all portals, very perfect".

## Split of roles
- VERCEL (65 %) gives: the chrome (white sidebar / top bar, white page headers, no coloured banners), the neutral
  palette, typography (Geist + Geist Mono), density, radii, shadow-as-border, every component's craft, motion.
- LEASE LANE (35 %) gives: the brand accent (marine #0C2147) used ONLY on primary actions, the active-nav indicator,
  selected tab underline, focus ring, links, progress fills and chart lines, the logo block, status colours, Cléo
  (avatar kept), copy and layout content. At most ONE marine-surface "hero" element per page (e.g. tenant
  "Prochain loyer" card, owner revenue KPI) — optional, only if it helps hierarchy.
- Rule of thumb: ~90 % of pixels on any screen are Vercel neutrals. No gradients, no glows, no radial blobs,
  no radius > 12 px except pills/avatars, no blurred shadow > 24 px.

## Tokens (scope everything under html[data-mix="vercel"])
Neutrals: bg #FAFAFA · surface #FFFFFF · surface-2 #F5F5F5 (hover, segmented track, inset) · text #171717 ·
text-2 #4D4D4D · text-3 #666666 · placeholder #8F8F8F · border #EBEBEB · border-strong #D4D4D4.
Ring (= border): box-shadow 0 0 0 1px rgba(0,0,0,.08).
Card: 0 0 0 1px rgba(0,0,0,.08), 0 2px 2px rgba(0,0,0,.04), 0 8px 8px -8px rgba(0,0,0,.04).
Popover/menu: 0 0 0 1px rgba(0,0,0,.08), 0 4px 8px -4px rgba(0,0,0,.04), 0 16px 24px -8px rgba(0,0,0,.06).
Modal/drawer: popover stack + overlay rgba(0,0,0,.32).
Brand: marine #0C2147 (primary bg, active indicator) · marine-hover #1A3463 · link #2E5788 · tint #EEF2F8
(selected row/item bg, info pill bg) · focus ring: 0 0 0 2px #FFF, 0 0 0 4px rgba(55,103,162,.6).
Status pills (tinted, AA): success #E9F5EF/#0F5A43 · warning #FFF4E5/#8A4B00 · error #FDECEB/#9B2E28 ·
info #EEF2F8/#0C2147 · neutral #F2F2F2/#4D4D4D. Pill: radius 9999, height 22, 12px/500, padding 0 8px.
Urgency (Urgence 24/7): error-tinted button (#FDECEB bg, #9B2E28 text, ring rgba(155,46,40,.16)).
Radii: card 8 · featured/popover/modal 12 · control (button/input/select/segment) 6 · pill 9999.
Type: Geist 400/500/600 only (700 only micro badges), font-feature-settings "liga","tnum" on numbers.
  page title 24/32 600 -0.96px (home greeting 32/40 -1.28px) · section 20/28 600 -0.4px ·
  card title 16/24 600 -0.32px · body 14/20 · small 13/18 · caption 12/16 ·
  KPI numbers 32/36 600 -1.28px tabular-nums (amounts in tables: 14px 500 tabular-nums) ·
  Geist Mono 12px/16 500 uppercase .04em for: column headers, eyebrows/surtitres, IDs (DEM-2026-0412),
  dates/meta lines, keyboard hints. Poppins only in the Lease Lane logo/wordmark.
Spacing: 4 px base; card padding 24 desktop / 16 phone; grid gaps 16/24; page gutter 32 desktop / 16 phone.
Controls: height 36 desktop / 44 phone (≤760px), button 14px/500, primary = marine solid, secondary = white + ring
  (hover border-strong + surface-2), ghost = text #171717 hover surface-2, destructive = error tint.
Inputs: white, ring, radius 6, hover border-strong, focus = focus ring; placeholder #8F8F8F.
Tabs: underline style, 14px #666, active #171717 500 with 2px marine underline. Segmented: surface-2 track,
  white thumb with ring.
Tables: header Geist Mono 12px uppercase #666 + bottom hairline; rows 48 desktop; hairline separators; hover #FAFAFA;
  selected #EEF2F8 with 2px marine left indicator.
Navigation:
  - Sidebar/rail: WHITE (#FFF) with right hairline; items icon 16–18 + label, #666, hover surface-2, active
    #171717 500 + surface-2 bg + 2px marine indicator; logo block uses logo-sur-blanc.svg (marine logo on white);
    width may grow to 220–240 px on desktop if the grid allows it (CSS only); badges marine.
  - Top bars (admin BarreHaut etc.): white, bottom hairline, 56–64 px.
  - Phone bottom nav: white, flat, full width attached to bottom, top hairline, env(safe-area-inset-bottom) padding,
    active = marine icon + #171717 label; Plus menu = popover style.
  - Page header: NO marine banner. Title/subtitle on the page background, actions (search with ring + ⌘K hint
    look, bell icon-button with ring, urgency tinted) aligned right; header separated by spacing, not colour.
    Overlapping "remonte" negative margins removed.
Charts: lines marine 2px, fills marine 8 % opacity, grid #EBEBEB, axis labels Geist Mono 11px #8F8F8F; progress
  bars 4px, track #EBEBEB, fill marine.
Toast: #171717 bg, white text, radius 8, popover shadow. Cléo panel: white drawer, avatar kept, user bubble
  surface-2, Cléo bubble white + ring, send = primary.
Empty states: ring card, gray 20px icon, 14px text-2, one action.
Dark (admin has a dark theme toggle; if [data-theme="dark"] exists): bg #0A0A0A, surface #111, surface-2 #1A1A1A,
  text #EDEDED, text-2 #A1A1A1, border #1F1F1F/#2E2E2E, accent marine lightened #7FA8DB for text/links, primary
  button #EDEDED bg #0A0A0A text (Vercel dark) or marine-light — keep AA.
Motion: 150ms cubic-bezier(.4,0,.2,1) on color/background/box-shadow; menus 200ms; none if prefers-reduced-motion.
A11y: WCAG AA text contrast, visible focus on every interactive element, touch targets ≥ 44 px on phone.

## Files (shared folder scratchpad/theme-vercel/)
- base.css: shared classes (carte-l18, bouton*, puce*, tableau, inputs/select/textarea, onglets/po-onglets,
  segment, jauge, kpi-po/po-kpis, surtitre, toast, bandeau(erreur), tiroir/voile/fenetre, cloche-panneau,
  cleo-panneau, palette, fonts @font-face, tokens as custom properties). OWNER: tenant theme agent.
- locataire.css / proprietaire.css / admin.css: portal-specific chrome & screens. One owner each.
- toggle.ts: the prototype-only "Actuel / Mix Vercel" pill (default vercel, localStorage in try/catch).
- audit.mjs: measurable "perfect" check (see below).
Each proto build.mjs appends base.css + its portal css after globals.css and imports toggle.ts.

## "Very perfect" = audit passes on every route at 390x844 and 1440x900 in mix mode
- no computed font-family with Poppins outside the logo;
- no border-radius > 12 px except pills (≥ 999) and avatars (circles);
- no background-image gradients, no box-shadow blur > 24 px;
- every computed color/background-color/border-color belongs to the token palette (+ status colours, + images);
- no element with text contrast < 4.5:1 (3:1 for ≥ 18.66px bold / 24px);
- no horizontal overflow at 360 px; 0 console/page errors; interaction scripts still pass;
- side-by-side screenshots actuel vs mix looked at by eye.
