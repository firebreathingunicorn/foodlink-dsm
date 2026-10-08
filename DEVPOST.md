# FoodLink — Devpost submission copy

> Paste-ready for each Devpost field. Keep the simulation disclosure everywhere.

## Project name
FoodLink — the real-time food grid for Greater Des Moines

## Tagline (short)
FoodLink doesn't create more food. It makes the food that already exists easier to reach.

## Inspiration
Food insecurity in Iowa isn't a food shortage — it's a coordination failure. USDA estimates 30–40% of the US food supply is wasted while 402,000+ Iowans (1 in 8, per Feeding America's Map the Meal Gap) are food insecure; ReFED finds only ~2% of US surplus food is donated. The EPA counts ~960,000 potential surplus-food generators versus ~15,000 recipients. Food exists on one side of the metro and need on the other, and the connection layer is phone calls, luck, and waste. dsmHack's own challenge page names the barrier: "Tech Barriers Delay Hunger Relief" — DMARC still schedules home food delivery by phone, Mondays–Wednesdays 9am–noon.

## What it does
FoodLink is a real-time food-access grid with five sides: businesses post surplus in one sentence ("40 vegetarian prepared meals, refrigerated, need gone by 7pm" — parsed into structured fields by the assistant); organizations post both capacity and *needs* ("we need 50 meals Saturday"); households see honest, auto-expiring availability cards with no login and no means-test to browse; everything is reachable from any phone via an SMS lane (demo shows English/Spanish).

The matching engine applies **hard safety gates first** (food-type compatibility, storage, deadline feasibility, safe-handling attestation — gated-out organizations stay visible with their reason), then an **explainable soft score**: 35% urgency, 30% distance (e^(−miles/5)), 20% capacity fit, 15% transport — every factor shown as a bar on screen, with a plain-English "why." Each completed match produces an impact receipt: meals, pounds (×1.2, Feeding America's conversion), value (×$3.52, Iowa's average meal cost), and a potential enhanced-tax-deduction estimate (IRC §170(e)(3) math — $3,660.80/yr for a weekly 40-meal donor).

Because the 2023 Food Donation Improvement Act protects donors giving **directly to households**, small prepared-food surpluses can take the direct route — warm shelf to warm table, no cooling-window risk — shown as its own match candidate with an FDIA-2023 badge. And the Needs Board ships with a **live Network Pulse** panel plus one-tap **open JSON export**, so the network reports on itself — the challenge's "data collection, reporting, and collaboration" bullet, working in the demo.

## AI that shows its work
FoodLink's AI layer is bring-your-own free/open-source: a **local Ollama model** (open-source weights, on-device, $0) or free-tier keys for Groq / Gemini / OpenRouter. The prompts are **versioned, documented (PROMPTS.md), and viewable inside the app** — grounded in live inventory JSON, hard-ruled against hallucination ("only offer food that appears in LIVE INVENTORY"), dignity-first, with crisis escalation to 211. Machine outputs are strict validated JSON with an offline template fallback, and the AI never computes matches — scores are engine math (tested); the AI only rephrases explanations from engine-computed facts, labeled "AI-phrased · engine-computed" on screen.

## Rubric mapping
| Criterion | Evidence in the product |
|---|---|
| Community impact (30%) | 7.4% of Polk County's entire meal gap from a 200-business slice at 10% capture (Wolfram-verified model); 9 of dsmHack's 28 factors addressed; household-facing + SMS reach |
| Innovation (20%) | Only product combining real-time matching + demand-side needs board + any-phone multilingual assistant + FDIA-2023 direct-to-household routing |
| Technical execution (20%) | 22 automated engine tests; gates + explainable scoring; 100k-draw Monte Carlo robustness; validated AI with offline fallback; headless end-to-end tests |
| Feasibility (15%) | $1,300/yr operating budget; prize funds ~3.8 years; integration-first posture with DMARC / Supply Hive / Food Bank of Iowa; IEDA funding runway |
| UX (10%) | Two buttons; one-sentence posting; honest auto-expiring cards; Spanish; installable web app |
| Presentation (5%) | The app is the storyboard — every screen demos one beat |

## How we built it
Static, mobile-first web app (HTML/CSS/vanilla JS — no build step), so judges click a link and it just works. The matching engine, parser, and explanation generator are pure functions with **22 automated tests** (`test/engine.test.mjs`). The ranking is stress-tested: the #1 match *dominates* the runner-up on every factor (so it wins under 100% of possible weightings) and holds ~97% against the third candidate in a 100,000-draw Monte Carlo over random weight vectors — we didn't just tune weights, we proved the ranking is robust to them. Design iterated through screen renders scored by a local vision-based taste model.

## Challenges we ran into
- The landscape is crowded (MealConnect, Copia, Food Rescue Hero, Too Good To Go…) — so we mapped all of them and built only in the two structural gaps nobody fills: **demand-side posting** and **household-facing real-time visibility**.
- "AI-washing" a weighted sum would die under one technical judge's question — so we made the score transparent, gated it with food-safety rules, and validated it statistically instead.
- Real-time for people without smartphones is unsolved (34% of low-income adults are smartphone-only; ~1 in 5 seniors own no smartphone) — hence the any-phone SMS lane as a first-class persona, not a footnote.

## Accomplishments we're proud of
- Honest recipient cards that route to an organization's *actual* distribution reality instead of promising food the app can't guarantee.
- A legal layer baked into the product: Bill Emerson Act + the 2023 Food Donation Improvement Act (which newly protects *direct-to-household* donation) + Iowa Code §672.1, encoded as matching gates and hold-time expirations.
- Every number in the pitch is verified and reproducible.

## What we learned
Iowa's emergency food system is already strong — DMARC (14 partner pantries, ~80,000 people/year), Food Bank of Iowa (700 agencies, 55 counties), Supply Hive's volunteer rescue. Software that tries to replace it will fail; software that adds the missing layer — demand signals, household visibility, SMS reach, open data — can plug straight in.

## What's next
Pilot with a real pantry partner; multilingual SMS beyond the demo's EN/ES (Des Moines Public Schools serves families speaking 100+ languages); direct-to-household routing for small hot-meal surpluses under the FDIA 2023; a monthly open "Polk Food Access Index" from aggregated supply/need data.

## Built with
HTML, CSS, vanilla JavaScript, localStorage; Node test runner; headless-browser end-to-end tests; Wolfram-verified math. The AI layer is bring-your-own free/open-source: a local **Ollama** model (open-source, 100% on-device), or a free-tier key for Groq / Google Gemini / OpenRouter — with a built-in template fallback so every feature survives offline.

## Disclosure
**All organizations, listings, and data in this demo are simulated.** Real organization names appear only as examples of participant types; no partnership is claimed. The tax estimator is informational only, not tax advice.
