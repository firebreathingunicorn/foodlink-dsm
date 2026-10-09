# Xenia — Devpost submission copy

> Paste-ready for each Devpost field. Matches what the site actually does as of Oct 8.

## Project name
Xenia

## Tagline (short)
Extra food from Des Moines stores, sent to the pantry that can use it tonight.

## Inspiration
Hunger in Iowa is not a food shortage. USDA estimates 30–40% of the US food supply is wasted, while more than 402,000 Iowans (1 in 8, per Feeding America's Map the Meal Gap) are food insecure. ReFED finds only about 2% of surplus food is donated. A grocery store with 40 unsold meals at 5pm has no quick way to know which pantry is open, has a fridge, and is actually short tonight, so the food goes in the dumpster. dsmHack's challenge page names the barrier: "Tech Barriers Delay Hunger Relief."

## What it does
Xenia is a website with four parts.

**Give food.** A store or restaurant types one sentence: "40 vegetarian prepared meals, refrigerated, need gone by 7pm." Xenia reads the food type, amount, storage and deadline out of that sentence. It then checks every pantry in the network. Places that can't take it are ruled out, with the reason shown (no refrigeration, doesn't accept prepared meals, not open before the deadline). The rest are ranked by a score anyone can read: 35% how short the pantry is, 30% how close, 20% whether it has room for all of it, 15% whether there's a way to get it there. The donor sends it with one click and gets a receipt: pounds kept out of the trash, food value at Iowa's $3.52 average meal cost, and an estimated tax deduction under IRC §170(e)(3).

**Find food.** Anyone can see what has been posted and where to pick it up, with no account and no ID. Below that is a map and list of real Des Moines area pantries with their hours, a call button and directions, taken from each pantry's own website. One tap sorts them by distance from where you are.

**What pantries need.** Pantries post what they're short on ("we need 50 meals for Saturday"). When a donation matches a request, the donor sees "they asked for this", and the request shows how much of it is now covered (40 of 50). Most food-rescue tools only let the donor side post.

**Give time.** Food doesn't move itself. Stores, pantries and the city post jobs that need hands (drive a donation across town, sort produce, a neighborhood clean-up followed by a community meal) and anyone can take one. Every donation automatically creates a driving job. Nobody has to work to eat.

Donors can also add a photo of the food, which shows on the posting.

## How we built it
Plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages, so it opens instantly on a laptop or a phone. The matching engine is a set of pure functions with 23 automated tests, plus a headless-browser test that clicks through the whole site at laptop and phone widths. Reading the donor's sentence is done with rules, not a language model, so it works offline and costs nothing to run.

## Challenges we ran into
- Food rescue is a crowded space (MealConnect, Food Rescue Hero, Too Good To Go). We looked at what they don't do: none of them let pantries post needs, and none of the free ones show households what is available.
- A match score nobody can inspect is hard to trust with food safety. So the safety rules are hard pass/fail checks that run before any scoring, and every number in the score is on screen.
- Our first version was shaped like a phone app and tried to do too much. We cut it down to one page that says what it is.

## Accomplishments we're proud of
- You can understand the site in ten seconds and complete a donation in three clicks.
- The pantry list is real and useful today, even though the rest is a prototype.
- Food-safety and legal protection are part of the product: the Bill Emerson Good Samaritan Act and Iowa Code §672.1 protect good-faith donors, and the matching rules enforce storage and timing.

## What we learned
Des Moines already has strong food organizations: DMARC, Food Bank of Iowa, Eat Greater Des Moines. A tool like this should plug into them, not replace them.

## What's next
- A shared database so postings appear for everyone (today they only sync between windows in the same browser).
- A pilot with one real pantry and a handful of Johnston and Urbandale restaurants.
- Spanish, and a text-message version for people without smartphones.
- Small hot-meal donations straight to a household, which the Food Donation Improvement Act of 2023 now protects.

## Built with
HTML, CSS, JavaScript, Leaflet and OpenStreetMap, GitHub Pages, Node test runner, Playwright.

## Disclosure
This is a hackathon prototype. The pantry list, phone numbers and hours are real public information. The stores, the food postings, and the eight pantries in the matching demo are made-up examples; no partnership with any named organization is claimed. The tax figures are estimates, not tax advice.
