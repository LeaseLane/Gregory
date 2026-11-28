# Design Project Checklist

**Project:** Portails Lease Lane (locataire, propriétaire, admin « Lanceur »)  **Client:** Lease Lane  **Start:** 2026-11-27 (mandat existant)  **Target launch:** à fixer
**Languages:** fr-CA, en  **Mockups:** prototype vivant en artefacts, depuis les vrais composants (décision du 2026-11-27, `decisions.md`; liste dans `design/index.html`)
**Data sensitivity:** sensitive (personnelles et financières, Loi 25)  **Privacy assessment needed:** yes
**Entry:** existing design (REFINE; resume at phase 9, écrans et finition, avec rattrapage des phases 1 et 7)  **Path:** retouche des 3 portails, écran par écran — effort `high`
**Surface modes:** Operate : 3 portails, connexion, Cléo · Persuade : — · Read : pages d'aide · Experience : —  **Taste profile version:** 1.7 (carte du goût du 2026-10-28)

Legend — **AI**: AI produces, designer reviews · **H**: human-led · **H+AI**: human leads with AI support · effort in `code`.

## Setup
- [ ] Project space created with brief, brand assets, constraints as context — H
- [ ] Client agreement checked for AI use and data location — H
- [x] Data-location constraints recorded (Loi 25: no personal data in mockups or prompts) — H
- [ ] Anonymization and retention rules set for research data — H+AI `medium`
- [ ] The standalone `twim-…` skills available in Claude chat and Cowork if they will be used — H
- [x] Claude Code configured (`surfaces.md` §4): twim-design plugin, Playwright renders, Node present, build-time skills installed — H
- [ ] Default effort agreed (`medium` = Opus 5.5 default; switch per task) — H

## Entry from an existing design (skip for a new project — `existing-design.md`)
- [x] Intake: brief, research, IA, existing mockups or exports, live product, codebase collected — AI `medium`
- [x] What triggered the improvement is stated — H
- [ ] Stage diagnosis per phase, with evidence (done verified / done unverified / partial / missing / n.a.) — AI `high`
- [ ] Current product measured before any change (baseline) — AI `medium` → H
- [ ] Quality audit of existing work: `ux-heuristics`, `twim-design-critic`, `lenses/rams-design-is`, craft gate, responsive, accessibility, motion — AI `high` / `xhigh` (**Cowork** for many screens; **Claude Code** for a codebase)
- [ ] Ranked gap report with lightweight catch-ups — AI `high`
- [ ] Gaps to fill decided (fill now / later / skip with risk accepted) — H
- [ ] Improvement plan: quick wins, catch-up, resume phase — AI `high` → H
- [ ] Existing work pre-marked below: `[x]` (existing — verified) or `[ ]` (existing — unverified) — AI `low`

## 1. Framing & Discovery
- [ ] If `cadrage/` exists (`twim-kickoff`): `06-passation-design.md` read, the items it covers ticked from it, not redone — AI `low`
- [ ] Kickoff held — AI `medium` → H
- [ ] Stakeholder map — AI `medium`
- [ ] Stakeholder interview guides — AI `medium`
- [ ] Stakeholder interviews conducted — H
- [ ] Transcripts cleaned — AI `low`
- [ ] Stakeholder synthesis, contradictions flagged — AI `high`
- [ ] Technical constraints confirmed — AI `high` → H
- [ ] Legal / compliance constraints confirmed — AI `high` → H
- [x] Problem statement approved in writing — AI `high` → H
- [x] KPIs with tracking method and baselines (remplacés par la barre de qualité 4–5/5, décision du 27 nov.) (`ux-strategy`) — AI `high` → H
- [ ] 1–2 product outcomes agreed (not features) — AI `high` → H
- [ ] Assumptions and risks log — AI `medium`
- [ ] Heuristic evaluation — AI `high`
- [ ] Visual audit of existing UI with phased plan (`twim-design-critic`) — AI `high`
- [ ] Refine or redesign verdict (`lenses/rams-design-is`) — AI `high` → H decides with client
- [ ] Accessibility baseline (contrast via script) — AI `medium`
- [x] Existing design system audited (if the client has one) — AI `high` → H
- [ ] Analytics review — AI `high`
- [ ] Content inventory — AI `xhigh` (large crawl, **Cowork**) / `low` (provided list)
- [ ] Competitive & comparative research, sourced and dated — AI `xhigh` (**Cowork**) / `high`
- [ ] Scope, out-of-scope, plan, RACI, estimate signed off — AI `medium`/`high` → H

## 2. User Research
- [ ] Research questions and plan — AI `high` → H
- [ ] Inclusive recruiting criteria (disabilities, ages, both languages) — AI `medium`
- [ ] Screener, consent (incl. AI analysis), retention period — AI `medium` → H
- [ ] Recruiting messages and incentives — AI `low` → H
- [ ] Interview guide — AI `medium`
- [ ] Pilot session run and guide adjusted — H + AI `medium`
- [ ] Interviews conducted with real users — H
- [ ] Data anonymized before AI processing — AI `low`
- [ ] Transcripts cleaned — AI `low`
- [ ] Codebook approved — AI `high` → H
- [ ] Transcripts coded — AI `low`; sample spot-checked — H
- [ ] Synthesis with participants per theme and confidence labels — AI `high` / `xhigh` (large set, **Cowork**)
- [ ] Quote, coverage and counter-evidence checks passed — AI `high`
- [ ] Designer read ≥2 full transcripts vs. synthesis — H
- [ ] Survey designed — AI `medium`; analyzed — AI `high`
- [ ] Tickets / reviews mined — AI `low` → `high`
- [ ] Research repository structured — AI `medium`
- [ ] Insights report presented — AI `high` → H
- [ ] Each Phase 1 assumption marked validated / invalidated / open — H

## 3. Definition
- [ ] Design principles agreed — AI `high` → H
- [ ] Experience vision — AI `high` → H
- [ ] Personas from evidence only — AI `high`
- [ ] JTBD — AI `high`
- [ ] Current-state journey — AI `high`
- [ ] Future-state journey — AI `high`
- [ ] Service blueprint (if needed) — AI `high`
- [ ] HMW statements — AI `medium`
- [ ] Opportunities prioritized and linked to KPIs (opportunity solution tree) — AI `high` → H decides
- [ ] Value proposition stated — AI `high` → H
- [ ] Success criteria per feature — AI `high`
- [ ] User stories with testable acceptance criteria — AI `medium`

## 4. IA & Flows
- [ ] Content strategy and requirements — AI `high`
- [ ] Content model — AI `high`
- [ ] Taxonomy and labels in users' words — AI `high`
- [ ] Roles and permissions matrix approved — AI `high` (`max` if very large) → H
- [ ] i18n plan: languages, defaults, Bill 96 (Quebec), text expansion, formats — AI `high` → H
- [ ] Sitemap / app map — AI `high`
- [ ] Search design — AI `high`
- [ ] Navigation model chosen — AI `high` → H
- [ ] Card sort run with users — H (setup AI `low`)
- [ ] Card sort / tree test analyzed; target met — AI `high`
- [ ] Happy-path flows — AI `medium`
- [ ] Error, empty, first-use, permission states for every flow — AI `high`

## 5. Ideation & Concept
- [ ] Workshop materials — AI `medium`
- [ ] Multiple distinct concepts — AI `low`–`medium`
- [ ] Storyboards — AI `medium`
- [ ] Vision prototype (optional) — AI `medium`
- [ ] Lo-fi wireframes — AI `medium`
- [ ] Concepts critiqued against principles and research — AI `high`
- [ ] Feasibility confirmed by developers — AI `high` → H
- [ ] Direction selected with rationale — H

## 6. Testing, Round 1 (lo-fi)
- [ ] Test method chosen per question — AI `medium`
- [ ] Prototype built from the linked HTML wireframes — AI `medium` / `xhigh` with real data volumes (**Claude Code**)
- [ ] Test plan with success criteria — AI `medium`
- [ ] Session with assistive-technology user planned — AI `medium` → H
- [ ] Sessions run with real users — H
- [ ] Sessions analyzed — AI `medium`; key moments watched on video — H
- [ ] Findings severity-rated — AI `high`
- [ ] Design iterated — AI `medium`
- [ ] Retest shows key tasks meet target — H + AI `medium`
- [ ] A/B test designed (if traffic allows) — AI `high`
- [ ] No open Critical issues — H

## 7. Visual Direction & Foundations
- [ ] Taste profile loaded (still a draft: validate it with this project's three directions) — AI `low`
- [ ] Each surface classified: Operate / Persuade / Read / Experience — AI `medium` → H
- [ ] Client direction brief approved — AI `high` → H
- [ ] Client reference board analyzed (layouts, components, placement) — AI `high`
- [ ] Three distinct directions (two fitting layout styles + one unexpected); one chosen — AI `medium` → H
- [ ] Direction critique against brief, taste and anti-slop — AI `high`
- [ ] Typography (licensing and French glyphs checked) — AI `medium`
- [ ] Color system, light and dark, contrast via script — AI `high`
- [ ] Spacing, grids, radius, elevation tokens — AI `low`
- [ ] Icon library and imagery rules — AI `medium`
- [ ] Motion language per surface mode (`twim-impeccable` / VectorLab tokens) — AI `medium`
- [ ] Platform guidelines checked (native) — AI `high`

## 8. Design System Core
- [ ] Component inventory from wireframes and flows (reuse flagged) — AI `high` → H
- [ ] Token architecture (primitive + semantic, modes) — AI `high`
- [ ] Theming / multi-brand (if needed) — AI `high`
- [ ] `tokens.css` and `base.css` written, light and dark — AI `medium`
- [ ] Component sheet `design/system/composants.html`: every core component, every variant and state — AI `xhigh` (**Claude Code**)
- [ ] Motion tokens: VectorLab set for product components, `twim-impeccable` set for marketing sections — AI `medium`
- [ ] Core components meet the accessibility floor — AI `high` → H
- [ ] **Moment 1 (if a product codebase exists):** tokens and core components ported to the product's code in **Claude Code**, names identical to `tokens.css` — AI `xhigh`
- [ ] Each coded core component passes `twim-build-verify` against the component sheet (**Claude Code**) — AI `high` → H

## 9. Hi-Fi Screens & Polish
- [ ] Screens built only from library components and variables (missing components added to the library first) — H
- [ ] Hi-fi screens with library components and variables — AI `medium` (5+ screens: **Cowork**) → H art-directs
- [ ] Every key screen at 375 / 768 / 1024 / 1440; tablet portrait and landscape — AI `medium`
- [ ] All states per screen — AI `medium`
- [ ] Language variants, expansion and truncation checked — AI `medium`
- [ ] Forms (mobile keyboard types, inputs ≥16px) — AI `high`
- [ ] Data tables and data viz — AI `high`
- [ ] Emails and notifications templates — AI `medium`
- [ ] AI-feature patterns (if the product has AI) — AI `high`
- [ ] Motion prototypes and specs with reduced-motion alternatives — AI `medium` / `xhigh` (coded, **Claude Code**)
- [ ] Microcopy, verb-first CTAs, errors — AI `medium` / bulk `low`
- [ ] Performance considerations reviewed — AI `medium` → H
- [ ] Polish pass — AI `high`
- [ ] Anti-slop pass — AI `medium`
- [ ] Visual critique incl. Rams principles (`lenses/rams-design-is`); fixes applied — AI `high`
- [ ] `ux-audit` run; quality rules (`craft-standards.md` §7b) hold — AI `high`
- [ ] Craft quality gate + responsive + motion checklists passed — AI `high` → H
- [ ] UI approved for round 2 testing — H

## 10. Testing, Round 2 (hi-fi)
- [ ] Round 2 plan reuses round 1 tasks + visual checks (first-click, 5-second, preference) — AI `medium`
- [ ] Hi-fi prototype from the linked HTML screens, with real motion, data and both languages — AI `medium` / `xhigh` with real data volumes (**Claude Code**)
- [ ] Sessions on real phones and tablets, in French and English — H (plan AI `low`)
- [ ] Assistive-technology session — H (plan AI `medium`)
- [ ] Sessions analyzed; motion issues flagged — AI `medium`; key moments watched — H
- [ ] Findings severity-rated and compared with round 1 — AI `high`
- [ ] Fixes applied in screens and, at the source, in the library — AI `medium`
- [ ] No open Critical issues; key metrics ≥ round 1 — H
- [ ] Final UI approved — H

## 11. Design System Completion (docs in Claude · component map and code audit in Claude Code)
- [ ] Component → code map for core components, in `DESIGN.md` — AI `medium`
- [ ] Documentation — AI `medium`
- [ ] Consistency audit — AI `xhigh` (codebase, **Claude Code**) / `high` (screens, Claude)
- [ ] Governance owner and process — AI `medium` → H
- [ ] Release notes — AI `low`
- [ ] Adoption tracking — AI `medium`
- [ ] Repeated screen patterns promoted to the library — AI `medium` → H

## 12A. Handoff preparation (Claude)
- [ ] Annotated specs (incl. i18n rules) — AI `medium`
- [ ] Acceptance criteria per component — AI `medium`
- [ ] Analytics events named and agreed — AI `medium` → H
- [ ] Assets exported — AI `low`
- [ ] Design file cleaned — AI `low`
- [ ] Handoff walkthrough — H (prep AI `medium`)
- [ ] Pixel-perfect tolerances agreed before build — AI `medium` → H
- [ ] Code profile detected and validated (`twim-code-profile` → `design/code-profile.md`) — AI `medium` → H
- [ ] One contract per screen wired to data (`twim-screen-contract`); `design/zones.md` written if the product has accounts — AI `high` → H
- [ ] Handoff package assembled (`surfaces.md` §6) — AI `medium` → H

## Moment 2 — gate to the build (all must be true)
- [ ] Phase 10 exit met; final UI approved — H
- [ ] All screens in `design/ecrans/`: every state, clean from 320 to 1440 px, both languages, themes — AI `high` check → H
- [ ] `tokens.css` and the component sheet final (and in code if moment 1) — H
- [ ] Pixel-perfect tolerances agreed and handoff package complete (12A done) — H
- [ ] Moved to **Claude Code** with the handoff package; effort `xhigh` for builds — H

## 12B. Build & QA (Claude Code)
- [ ] Each screen passed to code with `/twim-design:twim-code`: profile, contract, code, render gap, access zones, project rules, pass closed — AI `xhigh` → H
- [ ] Implementation support — AI `xhigh` (builds) / `high` (reviews)
- [ ] Design review on pull requests — AI `high`
- [ ] Sprint questions answered — AI `medium` + H
- [ ] Feature flags / beta rollout defined — AI `medium`
- [ ] Design QA: overlay comparison per screen, state, frame, language, theme; run with `twim-build-verify` — AI `high` / `xhigh`
- [ ] Real-device pass (small iPhone, current iPhone, mid-range Android, iPad, desktop browsers) — H (script AI `medium`)
- [ ] Motion QA: each surface matches its motion source, reduced motion works, 60fps on a mid-range phone — AI `medium` → H
- [ ] Critical and Major QA issues fixed and verified — AI `low` → H

## 13. Launch & Post-Launch
- [ ] Tracking verified for every KPI — AI `medium`
- [ ] Release notes (all languages) — AI `low`
- [ ] Onboarding and help content — AI `medium`
- [ ] App store assets (if mobile) — AI `medium`
- [ ] KPIs vs. baseline — AI `high`
- [ ] Behavior review — AI `medium`; key recordings watched — H
- [ ] Surveys analyzed — AI `medium`
- [ ] Feedback triaged — AI `low` → `high`
- [ ] Iteration backlog prioritized — AI `high` → H
- [ ] Continuous research cadence committed — AI `medium` → H
- [ ] Retrospective; effort calibration updated — AI `medium` + H
- [ ] Case study, client approval to publish — AI `medium` → H

## Accessibility (continuous — tick as each phase covers it)
- [ ] All pairings pass contrast (script report attached) — AI `low`
- [ ] WCAG 2.2 AA design audit — AI `high`
- [ ] Cognitive accessibility review — AI `high`
- [ ] Annotations (names, roles, focus order, headings, landmarks) — AI `medium`
- [ ] Built-product audit — AI `high`
- [ ] Keyboard and screen-reader passes on key flows — H
- [ ] Testing with disabled users — H (plan AI `medium`)
- [ ] Legal requirements confirmed — AI `high` → H
- [ ] Remediation plan; no open Critical issues — AI `medium` → H

## Operations (continuous)
- [ ] Estimate vs. actual tracked — AI `low`
- [ ] Change requests assessed before acceptance — AI `high` → H
- [ ] Approval packages prepared for each sign-off — AI `medium`
- [ ] Weekly status sent — AI `medium` → H
- [ ] Decisions and action items logged after meetings — AI `low`

## High-stakes reviews (`max`, only when applicable)
- [ ] Strategic recommendation stress-tested before budget commitment — AI `max` → H
- [ ] Critical flows red-teamed (payments, health data, consent, deletion) — AI `max`
- [ ] Research conclusions stress-tested before a pivot — AI `max`

## Effort calibration (once per project type)
- [ ] 3–5 representative tasks run at two adjacent levels
- [ ] Quality, time and usage compared
- [ ] Levels adjusted and noted here: ____________________

## Sign-off
| Phase | Approved by | Date |
|---|---|---|
| 1 Discovery | | |
| 2–3 Research & Definition | | |
| 4–5 IA & Concept | | |
| 6 Testing round 1 | | |
| 7 Direction & Foundations | | |
| 8 Design System Core | | |
| 9 Hi-Fi Screens | | |
| 10 Testing round 2 | | |
| 11 Design System Completion | | |
| Accessibility | | |
| 12A Handoff preparation | | |
| 12B Build & QA | | |
| 13 Launch | | |
