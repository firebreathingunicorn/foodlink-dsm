# Xenia — the real-time food grid for Greater Des Moines

**Hack Away Hunger: Food Insecurity Challenge** (dsmHack × Corteva, on Devpost). Deadline Oct 8, 2026, 11:45 PM EDT; in-person judging Oct 10 in Johnston, IA.

**All demo data is simulated. No real partnership with any named organization is claimed.**

## Run it

No build step. Either:

```bash
cd app && python3 -m http.server 8123 # → http://localhost:8123
```

…or just open `app/index.html` in a browser.

## Test it

```bash
node test/engine.test.mjs # 22 assertions: gates, scores, tax math, parser, explanations
node test/smoke.mjs # headless-browser click-through (needs `python3 -m http.server 8123` first)
```

## Structure

```
app/ the product (static, mobile-first, installable web app)
 js/engine.js matching engine — hard gates + explainable score (pure, Node-loadable)
 js/prompts.js versioned AI prompts (grounded context, JSON contracts, safety rules)
 js/data.js simulated orgs/listings/needs seed
 js/ai.js multi-provider LLM layer (Ollama/Groq/Gemini/OpenRouter + offline fallback)
 js/i18n.js EN/ES household strings
 js/app.js hash-routed views incl. prompt-transparency screen
designs/ approved HTML mockup + rendered screens + scoring runs
test/ engine, prompt-layer, and end-to-end tests
PLAN-v2.md the full researched plan (data sources, landscape analysis, math)
PROMPTS.md AI prompt engineering notes
VIDEO.md 3-minute demo script (rubric-mapped)
DEVPOST.md submission copy
```

## The matching math

Hard gates (food-type compatibility, storage, deadline feasibility, safe-handling attestation) filter first — gated-out orgs stay visible with reasons. Then: `score = 0.35·urgency + 0.30·e^(−miles/5) + 0.20·min(capacity/qty,1) + 0.15·transport`, displayed factor-by-factor with a plain-English explanation. Ranking robustness is Monte-Carlo-tested, not assumed.

Conversions: 1 meal = 1.2 lbs (Feeding America); meal value $3.52 (Iowa, Map the Meal Gap 2025); tax estimate per IRC §170(e)(3) with the 25%-of-FMV basis election — informational only, not tax advice.
