# FOODLINK v2 — The Real-Time Food Grid for Greater Des Moines

> **Submission target:** [Hack Away Hunger: Food Insecurity Challenge](https://hack-away-hunger.devpost.com/) (dsmHack, presented by Corteva Agriscience)
> **Deadline:** Oct 8, 2026, 11:45 PM EDT · **Final showcase (in-person judging):** Oct 10, Corteva campus, Johnston IA
> **Rubric:** Community Impact 30 · Innovation 20 · Technical Execution 20 · Feasibility & Sustainability 15 · UX 10 · Presentation 5

**The one-sentence idea.** FoodLink is a real-time food-access grid where Greater Des Moines businesses, pantries, community organizations, volunteers, and households can all see — and act on — both sides of the equation at once: what surplus food exists right now, and what need exists right now, matched with an explainable score and reachable from any phone, even without an app.

**The thesis (keep this line):** *FoodLink doesn't create more food. It makes the food that already exists easier to reach.*

**We are not another food bank. We are the connector — and we are the only product in this landscape that connects all five sides in real time.**

---

## 0. What changed in v2 and why

v1 was the right idea with holes. This version:

1. **Grounds every claim in verified data** (Feeding America, ReFED, EPA, USDA, Pew, Census, DMARC, Food Bank of Iowa — sources in §17).
2. **Adds the competitive landscape** and an honest, evidence-backed novelty claim — the #1 thing v1 was missing.
3. **Upgrades the matching engine** from "AI-flavored weighted sum" to **hard safety gates + explainable soft score**, with a worked example and a Monte Carlo robustness test (§7).
4. **Adds three creative features that no existing platform has in combination**: the **Needs Board** (demand-side posting), the **Any-Phone Lane** (SMS-first access, multilingual), and **Direct-to-Household routing** (newly practical because of the 2023 federal Food Donation Improvement Act) (§6).
5. **Fixes the recipient over-promise** with honest availability cards (§9).
6. **Adds a food-safety & legal shield section** (§10), a real sustainability budget (§11), and a judge-proofing Q&A (§15).
7. Keeps everything that was already right: two-button UX, business-first onboarding, ruthless MVP scope, the 8-beat demo story.

---

## 1. Why now — three verified hooks

**1. The need is rising, fast.** Feeding America's Map the Meal Gap (2025 release, 2023 data): **402,000+ Iowans — 1 in 8 — are food insecure, including 129,000 children (1 in 6)**, and the rate rose in **all 99 counties**. Polk County: **60,300 people (12%)**, up from 10.2% (2022) → 11.5% (2023) → 12% (2023–24 trend). Statewide meal gap: **76+ million meals ≈ $269M/year**; Polk County's share ≈ **11.4M meals ≈ $40.1M/year** (computed from the statewide per-person gap of 189 meals/yr — see §7 math).

**2. SNAP just went through whiplash, and pantries absorbed it.** Iowa's "Healthy SNAP" waiver took effect Jan 1, 2026 (restricting purchases), then was **vacated July 2, 2026** — in between, Iowa SNAP recipients fell from **272,747 (June 2025) to 247,907 (May 2026): −24,840 people, −9.1%**. Every rule change pushes newly-hungry families toward pantries with zero new pipeline. (dsmHack's own page notes $1 SNAP → $1.54 of local economic activity.)

**3. The law changed in our favor.** The **Food Donation Improvement Act of 2023** expanded Bill Emerson Act protection to "qualified direct donors" — restaurants, grocers, wholesalers, caterers, schools — donating **directly to needy individuals at zero cost**, not only via charities. Real-time matching technology is what makes direct donation logistically possible at scale. Nobody in the landscape (§3) has built for this.

Also: money is on the table — IEDA's 2026 CDBG **Public Services Food Pantries Program** ($1.21M allocated, up to $100K/project) and the **$5M Iowa Food Insecurity Infrastructure Fund** — a funded runway for exactly this kind of tool. And the metro is the fastest-growing major Midwest metro (**758,539 people, 2025**), which means the surplus and the need are both concentrating in the same place.

---

## 2. The problem, in numbers

Food exists on one side of the metro; need exists on the other; and the connection layer is phone calls, luck, and waste.

- **USDA: 30–40% of the US food supply is wasted.** ReFED (2023): ~**70M tons of surplus food**, of which only **1.73M tons (≈2.4%) is donated** — and only about **12% of donatable surplus** actually gets donated.
- **EPA's excess-food map finds ~960,000 potential surplus generators vs ~15,000 recipients — a 64:1 ratio.** The bottleneck isn't food or goodwill. It's coordination.
- A typical grocery store generates **~1,000 lbs/week** of surplus; a restaurant **25,000–75,000 lbs/year**.
- Meanwhile DMARC's network serves **~80,000 unique people/year** — roughly **1 in 9 metro residents** — and schedules home delivery **by phone only, Mon–Wed 9am–noon** (deliveries Thursday). That's the coordination layer we're replacing, and it's exactly the "Tech Barriers Delay Hunger Relief" factor dsmHack lists.

**Sizing (all computed, assumptions stated, Wolfram + Node cross-verified):** if just **50 grocery stores + 150 restaurants** (a fraction of the metro's food businesses) joined, and FoodLink captured only **10% of their surplus**, that is **1.01M lbs/year → 841,667 meals → 2,306 meals every day → 7.4% of Polk County's entire meal gap → $2.96M/year in food value at Iowa's $3.52 average meal cost.**

| Capture rate | lbs/yr rescued | meals/yr | meals/day | % of Polk gap | $ value/yr |
|---|---|---|---|---|---|
| 5% | 505,000 | 420,833 | 1,153 | 3.7% | $1.48M |
| **10%** | **1,010,000** | **841,667** | **2,306** | **7.4%** | **$2.96M** |
| 20% | 2,020,000 | 1,683,333 | 4,612 | 14.8% | $5.93M |

(Assumptions: groceries 1,000 lbs/wk each — RecyclingWorks MA estimator guide; restaurants 50,000 lbs/yr each — midpoint of the Green Restaurant Association 25k–75k range; 1 meal = 1.2 lbs — Feeding America's standard conversion; meal value $3.52 — Iowa average, Map the Meal Gap 2025.)

---

## 3. The landscape — and the two structural gaps nobody fills

We are not pretending to be first. We're telling judges exactly where we sit.

| Platform | Users | Cost | Household sees real-time free food? | Demand-side needs posting? | Iowa presence |
|---|---|---|---|---|---|
| **MealConnect** (Feeding America, 8B lbs rescued, 57,538 donor locations) | Donors + food-bank agencies | Free | **No** — households are redirected to a directory | **No** | Via food-bank networks |
| **Copia** | Enterprise donors + nonprofits | Paid SaaS | **No** | **No** | None published |
| **Food Rescue US / Food Rescue Hero** (63,000+ volunteer drivers) | Donors, volunteer drivers, agencies | Free/licensed | **No** | **No** | Powers Supply Hive DSM |
| **Supply Hive DSM** (EGDM-affiliated) | Donors, volunteers | Free | **No** | **No** | Greater Des Moines |
| **Too Good To Go / Flashfood** | Consumers (pay) | Consumer-PAID | Real-time but **paid** | No | Active in Des Moines (TGTG); Hy-Vee piloted Flashfood |
| **Olio** | Neighbors | Free | Yes, where dense | No | Effectively none (UK-centric) |
| **FoodFinder / 211 / foodpantries.org** | Households | Free | **No** — static directories | No | Static Iowa listings |
| **Plentiful** (NYC) | Pantry visitors | Free **SMS** reservations, 9 languages | Reservation only | No | None |
| **Table to Table** (Iowa City) | Donors, ~50 recipients | Free | No | No | Johnson County only |
| **FoodLink (us)** | All five actors | Free | **Yes** | **Yes** | Built for Greater Des Moines |

**The two structural gaps across this entire landscape:**
1. **Every platform is supply-driven.** No tool lets pantries, community orgs, or households post **demand** — what's needed, when, for how many people — and match incoming surplus against it.
2. **No free channel gives the household real-time visibility.** The only real-time consumer apps charge money (Too Good To Go, Flashfood); every free channel is invisible to the end household until distribution.

**Our honest novelty claim** (verified by a prior-art scan): no existing product combines **(a) real-time surplus matching with an explainable score + (b) a household demand/needs board + (c) any-phone SMS access in multiple languages**. Each pillar has a precedent we happily cite — MealConnect's matching, Food Rescue Hero's Community Need Index, Plentiful's multilingual SMS — the **combination, aimed at the household, is the new thing.**

**Positioning: partner, not competitor.** DMARC already runs retail food rescue (since Feb 2023, Walmart/Aldi). Supply Hive already has volunteer drivers. Food Bank of Iowa has 700 partner agencies in 55 counties. We add the layer none of them have: demand-side posting, household-facing real-time visibility, SMS reach, and open data. FoodLink is software *for* Iowa's ecosystem, not a replacement for it.

---

## 4. Who's on FoodLink

1. **🏪 Businesses** — Hy-Vee, Fareway, Pagliai's, Charlotte's Kitchen as *example participant types* (clearly labeled as simulated demo data; no real partnerships claimed).
2. **🏦 Food banks / pantries** — post supply AND needs: "We can accept 200 lbs of produce" / "We need 50 prepared meals Saturday."
3. **🤝 Community organizations** — shelters, churches, community centers as distribution nodes with **capacity profiles** (what they can accept, cold storage, prepared-food capability, hours).
4. **👨‍👩‍👧 Households** — browse anonymously, no login, no means-test to *see* food. Pantries keep their own intake norms (most use self-attestation).
5. **🚗 Rescue volunteers** — stretch goal only (Supply Hive already does this well; we'd integrate, not duplicate).

---

## 5. How it works — the Grid

One live board. Blue dots = surplus (what exists now). Red dots = need (what's requested now). Every card **auto-expires** at its deadline — the board is always honest, never a stale directory. A completed match draws the line between a blue dot and a red dot: **the circuit closes.**

```
Business ──post──▶ ┌──────────────────────┐ ◀──post── Pantry need
Volunteer ──────── │  THE GRID (live)     │ ──────── Household need
(org accepts) ◀─── │  gates → score → why │ ──▶ Direct-to-household
                   └──────────────────────┘
```

**Business flow (ridiculously easy, by design):** open FoodLink → type it like a text: *"40 vegetarian prepared meals, refrigerated, need gone by 7pm"* → the AI parses that into structured fields (quantity, type, storage, deadline) → **Post**. Three taps and one sentence.

---

## 6. The creative core — five things nobody else has

**① The Needs Board (demand-side posting).** The single biggest structural gap in the landscape. Pantries and orgs post what they need; donors browse it. A pantry says "We need 50 prepared meals for Saturday's family night" — and Pagliai's surplus Saturday batch has a destination *before it's cooked*. Surplus stops being a surprise and starts being a supply chain.

**② The Any-Phone Lane (SMS, multilingual).** 34% of low-income adults (<$30k) are smartphone-only and 98% of adults own *some* phone — but only 78% of seniors own a smartphone, so **about 1 in 5 older adults cannot use any app at all** (Pew, 2025). Des Moines schools serve students speaking **100+ languages**; ~11.5% of city residents speak Spanish at home; Iowa resettled ~10,000 Burmese/Karen refugees (EMBARC's community), and DRC families (Swahili) are the largest current refugee group. So: **text "FOOD" to FoodLink** and an AI SMS assistant — modeled on NYC's Plentiful, which proved the pattern with 9-language SMS across ~200 pantries — answers in your language with today's real options and how to reach them. This is also the phone-parity answer for seniors stuck calling DMARC Mon–Wed 9am–noon.

**③ Direct-to-Household routing.** Because the Food Donation Improvement Act of 2023 extended Bill Emerson liability protection to qualified donors giving **directly to individuals at zero cost**, FoodLink can route small hot-meal surpluses straight to a posted household need ("family of 4, tonight, within 3 miles") — no pantry detour, no cooling-window risk. Meal goes from warm shelf to warm table. **No platform in the landscape does this.**

**④ Explainable matching with hard safety gates.** Every match shows its math and its reasons (§7). No black box, no fake "AI magic" — judges can interrogate the number on screen.

**⑤ Honest, auto-expiring cards.** Every listing carries its deadline and dies at deadline. The household card never over-promises (§9). And every completed donation generates a **verifiable public Impact Receipt** — a QR code linking to a page showing the real totals for that business — anti-greenwashing by design.

*(Open-data stretch: a monthly "Polk Food Access Index" — zip-level surplus-vs-need snapshot published openly, directly serving the challenge's data & collaboration bullet.)*

---

## 7. The matching engine v2 — real math, tested

**Stage 1 — Hard gates (pass/fail, shown on screen even when failed):**
- **Food-type & storage compatibility** — a produce-only pantry cannot receive prepared meals, period.
- **Deadline feasibility** — can this org receive before pickup cutoff?
- **Safe-handling attestation** — donor confirmed hold times for prepared food; allergen labels present.

A gated-out org still appears, greyed, with its reason: *"Cannot accept prepared meals — no reheat capacity."* **Transparency is the feature.**

**Stage 2 — Soft score (each factor normalized 0–1, weights configurable per org, always displayed):**

```
Score = 0.35 · Urgency            (org's posted need level / stock deficit)
      + 0.30 · Distance           = e^(−d / 5 mi)
      + 0.20 · Capacity fit       = min(org_capacity / quantity, 1)
      + 0.15 · Transport          (volunteer/route availability)
```

**Worked example** — "40 vegetarian meals, refrigerated, by 7pm, Johnston grocery" (Wolfram-verified):

| Candidate | Distance | Capacity | Urgency | Score | Why |
|---|---|---|---|---|---|
| **A — DMARC partner pantry** | 2.3 mi (0.63) | 60 (1.00) | 0.90 | **82.4%** | "Closest org that can take the full quantity before 7pm, currently low on prepared food" |
| D — shelter kitchen | 1.2 mi (0.79) | 30 (0.75) | 0.50 | 62.1% | "Closer, but can only take 30 of 40 meals and isn't short on prepared food tonight" |
| B — church kitchen | 6.0 mi (0.30) | 25 (0.63) | 0.70 | 55.0% | "Farther, partial capacity only" |
| C — produce pantry | 1.0 mi | — | — | **GATED** | "Cannot accept prepared meals — no reheat capacity" |

**Robustness (tested, not claimed):** we stress-tested the ranking under weight uncertainty with 100,000 Monte Carlo draws from a Dirichlet(1,1,1,1) distribution over the four weights (Wolfram; cross-checked independently in Node):
- A vs B: A **dominates** on all four factors (Δ = +0.20, +0.33, +0.375, +0.20) → A outranks B under **every possible positive weighting — probability 100%**.
- A vs D: factors are mixed (closer but needier) → A stays top in **~97% of random weightings** (Wolfram 97.06%, Node 96.69% — within MC noise).

*Pitch line: "We didn't just tune the weights — we proved the ranking is robust to them."*

**The one real LLM call (honest AI, three uses):** (1) parse the free-text donation into structured fields; (2) generate the plain-English "why this match" explanation from the score components; (3) power the multilingual SMS assistant. Template fallback if the API is unreachable — the demo never dies.

---

## 8. Why a business uses FoodLink (with real math)

1. **Lower disposal costs** — food in a dumpster is a hauling bill; Feeding America documents reduced disposal costs as a donation benefit. (Rule of thumb: ~1 lb of food wasted per $1,000 of grocery sales.)
2. **Potential enhanced tax deduction** (IRC §170(e)(3), permanent for all business types since the PATH Act of 2015; estimator, not tax advice): deduction = **basis + ½(FMV − basis), capped at 2× basis**.
   - *One-time example:* basis $200, FMV $500 → **$350 deduction vs. $200 normally** (Wolfram-verified).
   - *The weekly-40-meals donor:* 2,080 meals/yr = 2,496 lbs, FMV ≈ **$7,321.60/yr** at Iowa's $3.52 meal cost → with the small-taxpayer 25%-of-FMV basis election, the 2×-basis cap binds → deduction = **$3,660.80/yr — 50% of FMV** (Wolfram-verified).
   - FoodLink auto-keeps the audit trail: date, quantity, type, recipient, estimated value, transfer confirmation → **downloadable donation receipt (PDF)**.
3. **Impact dashboard** — meals, lbs, orgs served, waste diverted, estimated value; plus the **QR-verified public partner page** ("Proud FoodLink Community Partner").
4. **Surplus management in one sentence** — no phone-call chain; post it and the destination finds you.

**The economics stay clean:** nobody pays for food. The business gets disposal + tax + documentation + visibility; the household pays $0; the nonprofit pays $0.

---

## 9. What the household sees (dignity-first, honest)

- **No login, no means-test to browse.** Stigma is a listed barrier; we don't add to it. Self-attestation happens at the pantry per their existing norms.
- **Honest availability cards.** Not "40 meals waiting for you" but:

  > **Prepared meals — through a DMARC partner pantry**
  > 📍 1.4 mi · distribution Tue 4–7 PM · no appointment needed
  > *Availability confirmed by the receiving organization*

  The app routes to the org's distribution reality; it never guarantees food it can't deliver. (In Direct-to-Household mode only, a card may say "Reserved for you" — because it actually is.)
- **Filters that matter:** distance, "today," dietary (vegetarian/halal/gluten-free), language.
- **The Any-Phone Lane** (§6②): text FOOD → today's options in your language.
- **Privacy:** no account needed to browse; SMS numbers kept only with opt-in; location used for distance, never sold, no ads ever.

---

## 10. Food safety & the legal shield

- **Federal:** Bill Emerson Good Samaritan Act protects good-faith donors (exceptions: gross negligence/intentional misconduct). The **FDIA 2023** extends protection to qualified direct donors → individuals at zero cost. **Iowa's own shield: Iowa Code §672.1** (good-faith perishable donation immunity).
- **Product layer:** donor safe-handling attestation at post time; **hold-time countdowns** on prepared foods (cards expire at min(pickup deadline, safe-hold window)); allergen flags required for prepared items; org capacity profiles encode storage/prep capability, which the gates enforce.
- **Pitch framing:** "We built the food-safety rules into the matching engine as gates, not guidelines."

---

## 11. Sustainability — a real budget, a real owner

**Cost (verifiable, modest):** Vercel Pro $240/yr + domain $12/yr + SMS (1,000 active texters × 10 msgs/mo × $0.0079) $948/yr + LLM usage ~$100/yr ≈ **$1,300/year total**. The $5,000 challenge prize alone funds **~3.8 years** of operation (Wolfram-verified).

**Who owns it after the hackathon:** this is dsmHack's native model — tech built for nonprofits, adopted by nonprofits. Natural homes: **DMARC** (already runs retail rescue; gains demand-side + household reach), **Eat Greater Des Moines / Supply Hive** (already runs the volunteer app; gains needs board + SMS), or **Food Bank of Iowa** for statewide scale (700 agencies, 55 counties). FoodLink is designed as the missing layer on top of their existing operations — integration, not competition.

**Scale funding:** IEDA CDBG Public Services Food Pantries Program (up to $100K/project, $1.21M in 2026) and the $5M Iowa Food Insecurity Infrastructure Fund — both explicitly fund pantry infrastructure. Business analytics tier (Copia-style) is a future revenue option; never a paywall on food.

---

## 12. Which of dsmHack's 28 factors does FoodLink touch?

Of the [28 contributing factors](https://dsmhack.org/hack-away-hunger) the challenge lists, FoodLink directly attacks nine:

| Factor | FoodLink answer |
|---|---|
| Tech Barriers Delay Hunger Relief | Any-Phone SMS lane; DMARC's phone-only scheduling is the live example |
| Transportation Barriers | Distance-weighted matching; direct-to-household for nearby need |
| Language Barriers | Multilingual UI + SMS (100+ languages in DMPS) |
| Food Deserts | Needs board concentrates demand signals for underserved tracts |
| Rural Isolation | SMS works county-wide; designed to scale past the metro |
| Supply Chain Disruptions | Real-time surplus re-routing |
| Policy Gaps or Changes | SNAP whiplash (−9.1% caseload) → pantry pipeline |
| Stigma and Shame | Anonymous, login-free browsing |
| Utility/Housing Insecurity | Free, immediate, today-focused availability |

---

## 13. What we build tonight (ruthless scope, hour by hour)

**DON'T BUILD:** real tax integration · government verification · GPS logistics · production accounts/payments · 500 orgs · a custom ML model · volunteer dispatch (talk, don't build).

**BUILD — mobile-first responsive web app** (judges click a link; no app store; Vercel deploy; PWA later):

| Hours | Deliverable |
|---|---|
| H0–1 | Scaffold + deploy pipeline + seed data (8 orgs with capacity profiles, real org names **labeled SIMULATED**) |
| H1–3 | Donor flow: free-text post → AI parse (real LLM call, template fallback) → gates + match engine (§7 formulas, client-side) → "why" screen incl. one visible gated-out rejection |
| H3–4 | Needs Board + org accept view |
| H4–5 | Household view: honest cards, filters, auto-expiry, Spanish toggle + static SMS conversation mock |
| H5–6 | Impact Receipt + tax estimator (§8 numbers) + QR placeholder + download receipt |
| H6–7 | LLM wiring hardening, mobile pass, dead-click sweep |
| H7–8+ | **Devpost page + 3-minute video + SUBMIT EARLY (target ≥2h before deadline)** |

---

## 14. The demo story (10 beats)

1. "You're a grocery store in Johnston with 40 prepared meals that won't sell."
2. You type one sentence into FoodLink. The AI parses it. Post.
3. The Grid lights up — eight organizations checked, four pass the safety gates, four gated with visible reasons: *"no reheat capacity."*
4. Top match, **82%**, and the reasons in plain English. The weights are right there on screen.
5. Connect → the org accepts → the card starts its countdown.
6. Impact Receipt: 40 meals · 48 lbs · $141 in value · downloadable PDF · QR.
7. Tax estimator: this week's pattern, all year → **~$3,660 potential deduction** (vs $0 if trashed).
8. **Switch persona.** A household opens FoodLink — no login — sees honest availability, in Spanish, and the SMS conversation on a flip-phone screen.
9. **The Needs Board turn:** a pantry posts "We need 50 meals Saturday." Saturday's surplus now has a destination *before it's cooked*.
10. Close on the thesis: **"FoodLink doesn't create more food. It makes the food that already exists easier to reach."**

---

## 15. Judge-proofing — the questions we will be asked

**Q: How is this different from MealConnect / Supply Hive?**
A: Both are supply-driven and agency-facing — households never see anything, and no platform anywhere lets demand post back. We verified this across 12+ platforms (§3). We're the missing layer, and we'd integrate with them, not compete.

**Q: Cold start?**
A: Seed the demand side first — DMARC's network (13–14 sites, 30+ mobile locations, 80,000 people/year) is concentrated in one organization; then recruit 5–10 Johnston/Urbandale restaurants. The Needs Board works even at 3 orgs.

**Q: Food safety?**
A: Gates, not guidelines (§10) — attestation, hold-time expiry, allergen flags, capacity profiles; Emerson Act + FDIA 2023 + Iowa Code §672.1.

**Q: Why would a business bother?**
A: Disposal costs + enhanced deduction (worked math, §8) + one-sentence surplus management + verifiable community story.

**Q: What's actually AI here?**
A: Exactly one honest LLM with three jobs (parse, explain, SMS chat) — plus a transparent scoring formula we stress-tested with 100k Monte Carlo draws. No black boxes.

**Q: How does this sustain?**
A: $1,300/yr all-in; prize funds ~3.8 years; nonprofit hand-off is the dsmHack model; IEDA/Infrastructure Fund for scale.

**Q: Privacy/dignity?**
A: No login to browse, no tracking, numbers opt-in only, never sold, no ads.

---

## 16. Rubric mapping

| Criterion (wt) | Our answer |
|---|---|
| Community Impact (30%) | 2,306 meals/day at 10% capture of a 200-business slice = 7.4% of Polk's entire meal gap; nine of dsmHack's 28 factors directly addressed |
| Innovation (20%) | Only product combining real-time explainable matching + needs board + any-phone multilingual SMS + FDIA-enabled direct-to-household |
| Technical Execution (20%) | Gated matching engine with tested robustness (dominance proof + 97% MC stability), honest LLM integration, live auto-expiring grid |
| Feasibility & Sustainability (15%) | $1,300/yr budget, prize = 3.8 years, named hand-off owners, integration-first posture |
| UX & Design (10%) | Two buttons; one-sentence posting; honest cards; SMS parity |
| Presentation (5%) | 10-beat demo, interrogable score on screen |

---

## 17. Submission checklist & key sources

**Today, before anything else:** (1) confirm the in-person judging requirement for Oct 10 (message organizers if anyone on the team can't attend); (2) confirm whether a demo video is required and its length; (3) start the Devpost draft now and submit ≥2h early. Disclose all demo data as simulated.

**Primary sources:** [Devpost: Hack Away Hunger](https://hack-away-hunger.devpost.com/) · [dsmHack challenge page](https://dsmhack.org/hack-away-hunger) (28 factors; SNAP multiplier) · Feeding America Map the Meal Gap 2025 via [Food Bank of Iowa](https://foodbankiowa.org/news/latest-map-the-meal-gap-more-than-402000-iowans-experience-food-insecurity) (402K/12.4%; $3.52 meal; 1.2 lbs/meal) · [DMARC](https://dmarcunited.org/about/food) (14 sites, 80K people/yr; [phone-only delivery](https://dmarcunited.org/get-help/delivery/)) · [Iowa HHS SNAP updates](https://hhs.iowa.gov/news-release/2026-07-02/healthy-snap-food-waiver-update) (waiver timeline) · [IEDA CDBG Public Services](https://opportunityiowa.gov/community/community-infrastructure/cdbg-programs/public-services-fund) · [ReFED](https://insights-engine.refed.org/food-waste-monitor?view=overview&year=2023) (surplus/donation rates) · [EPA excess food](https://www.epa.gov/sustainable-management-food) (960K:15K) · [USDA food loss](https://www.usda.gov/about-food/food-safety/food-loss-and-waste) · [42 U.S.C. §1791](https://www.law.cornell.edu/uscode/text/42/1791) (Emerson + FDIA 2023) · [Iowa Code §672.1](https://www.legis.iowa.gov/docs/code/672.1.pdf) · [26 U.S.C. §170(e)(3)](https://www.law.cornell.edu/uscode/text/26/170) · [Pew mobile/broadband 2025-26](https://www.pewresearch.org/internet/fact-sheet/mobile/) · [MealConnect](https://mealconnect.org/) · [Food Rescue Hero](https://foodrescuehero.org/) · [Supply Hive](https://www.thesupplyhivedsm.org/) · [Table to Table](https://table2table.org/) · [Plentiful](https://thespoon.tech/plentiful-is-a-free-sms-based-reservation-system-for-food-pantry-visitors/) · [DMPS ELL](https://www.dmschools.org/academics/programs/english-language-learners/) · [EMBARC Iowa](https://www.embarciowa.org/about) · Census (MSA 758,539).

*All arithmetic (meal-gap, scenario table, tax examples, budget, match scores, Monte Carlo) computed in Wolfram and independently cross-checked in Node; both logs preserved. Numbers with conflicting sources (DMARC pantry count 13 vs 14; lbs 5M vs 7M) are stated as ranges.*
