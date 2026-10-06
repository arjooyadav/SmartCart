# AI assistant fix — unrelated products (e.g. ceiling fans) in comparisons

## The bug

Asking the assistant to compare products, or to recommend the "best" something,
could return completely unrelated products — a ceiling fan showing up when you
asked about phones, with no phone-specific information at all.

## Root cause

`ProductComparisonService.compare()` scopes its candidate pool using
`matchesCategoryScope()`, which restricts the pool by category **only when**
it could detect a category family (phone/laptop/audio/tv/watch), an exact
category, or specific product names mentioned in the message.

When none of those could be detected — e.g. the product names you typed
didn't exactly match a name in the catalogue, or the message didn't contain a
recognizable category word — `matchesCategoryScope()` fell through to `return
criteria.getCategory() == null || ...`, which is `true` for *every* product.
The comparison engine then silently scored the **entire catalogue**
(all 32 products across all 8 categories) using the generic fallback weights
(`features`/`performance`/`quality`/`price`, with price weighted at 40%).
Because the fallback weights happen to favor cheap items, a cheap, totally
unrelated product (a ceiling fan) could end up "winning" a phone comparison.

This also explains why comparing two named products sometimes returned what
looked like unrelated "suggestions" instead of an actual head-to-head: once
scope was lost, the result list was effectively just the top of the whole
catalogue by generic score, not a real comparison of the two products asked
about.

## The fix

`ProductComparisonService.java`: before building the candidate pool, the
service now checks whether it actually has *any* scope — a category family,
a category, or at least one matched product name. If it has none, it returns
an honest response instead of silently comparing the whole catalogue:

> "I couldn't tell which products or category you want compared. Try naming
> the exact products (e.g. "compare iPhone 15 and Galaxy S24") or a category
> (e.g. "compare laptops under 70000")."

This is the same "say so honestly instead of guessing" pattern already used
elsewhere in the AI assistant (`AiRecommendationService`'s "nothing really
matched" fix), applied to the comparison engine.

## What this does not change

- Comparisons that *do* resolve to a category or named products behave exactly
  as before — same scoring, same weights, same explanations.
- Gemini integration, the rule-based recommendation path, reviews, related
  products, and everything else in the project is untouched.

## Verification

Reviewed by hand (no Maven Central access in this sandbox, so the backend
cannot be compiled/run here) — brace/paren balance checked, and the logic was
traced for: a scoped phone comparison, a scoped laptop comparison, an
unscoped "compare these" with no recognizable category or product names, and
a single-product match. Please rebuild and re-test
`POST /api/ai/chat` with:
- "compare iPhone 15 and Galaxy S24" (or whichever two phone names exist in
  your catalogue) — should return a real two-way comparison, no fans.
- a vague "compare these two" with no names/category — should now return the
  honest "couldn't tell which products" message instead of random items.
- "best phone under 50000" — should stay scoped to Mobile products only.
