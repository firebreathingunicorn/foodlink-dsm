# FoodLink AI prompts — engineering notes (prompt pack v1.1.0)

The prompts live in code at [`app/js/prompts.js`](app/js/prompts.js) and are **viewable inside the app itself** at `#how` ("See the exact AI prompt & context" from the assistant). This doc explains the design decisions.

## Design principles

1. **Grounding over vibes.** The assistant receives today's *live inventory as JSON* (surplus cards, posted needs, org profiles with hours and languages) and is hard-ruled: *"Only offer food that appears in LIVE INVENTORY. Never invent food, pantries, addresses, hours or quantities."* If nothing matches, it must say so and point to 211. This kills the #1 failure mode of demo-day LLM apps: confident hallucination.
2. **Dignity is a rule, not a vibe.** *"No judgment, no lecturing, no politics. Everyone eats."* And: *"Never promise food, eligibility, or delivery. FoodLink never asks for ID — pantries use self-attestation."* Written into the prompt because real food-access orgs told the world this is what matters (and a DMARC leader may be in the judging room).
3. **Safety escalation.** Food logistics only; medical/safety → 911; *"if someone says children have not eaten today, lead with the fastest same-day item in inventory and include 211."*
4. **Language mirroring.** *"Reply in the same language the person wrote in"* — Des Moines schools serve families speaking 100+ languages; Spanish is the demo pair, the pattern extends.
5. **Machine outputs are contracts.** The parser must return strict JSON (`type/qty/diet/storage/deadlineMinFromNow`) with few-shot examples in the prompt. Every returned object is validated in code (type enum check, qty bounds, storage enum, deadline sanity) and **falls back to FoodLink's offline template parser on any drift** — the demo cannot die offline.
6. **The AI never computes the match.** Scores, gates, and the Monte Carlo robustness are engine math (tested). The AI's only explanatory job is rephrasing the top-match "why" *from engine-computed facts* (JSON of factors, capacity, distance, deadline), max 22 words, with the template sentence as fallback — labeled in the UI as **"AI-phrased · engine-computed."**
7. **Transparency as a feature.** The full assistant prompt with live context is one tap away in the app. Judges shouldn't have to trust a slide.

## The three prompts

| Prompt | Role | Output contract | Fallback |
|---|---|---|---|
| `PARSE_SYSTEM` | Turn a one-sentence donation note into structured fields | Strict JSON, validated | Offline template parser |
| `assistantSystem(snapshot)` | The any-phone food-access brain (chat/SMS) | <45 words, mirrored language, grounded in inventory | Canned demo script, labeled offline |
| `EXPLAIN_SYSTEM` + `explainUser(match)` | Rephrase the top match's "why" | ≤22 words, cites only provided facts | Template why (always rendered first) |

## Providers

Bring-your-own, all free: **Ollama** (local open-source models, e.g. gemma3/llama3.2 — zero cost, on-device), **Groq**, **Google Gemini**, **OpenRouter** free tiers. The provider layer (`app/js/ai.js`) speaks each API shape and degrades gracefully: no key → template mode, and the settings drawer's *Save & test connection* does a live round-trip before you trust it in front of judges.

## Why this wins the Technical Execution criterion

- Effective use of AI (rubric language): real LLM calls doing real work — parsing, explaining, multilingual assistance.
- Reliability engineering: validated outputs, template fallback, connection testing, offline mode.
- Honest labeling: users can always see whether they're talking to a model or a template.
