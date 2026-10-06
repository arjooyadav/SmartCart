# Update: Reviews, "You might also like", and image zoom

## 1. Product reviews

**Backend (new):** `Review.java`, `ReviewSummary.java` (models), `ReviewRepo.java`, `ReviewController.java`.
- `GET /api/reviews/product/{id}` — average rating, review count, and every review (newest first).
- `POST /api/reviews` — body `{ productId, userName, userEmail, rating (1-5), comment }`.
- `DELETE /api/reviews/{id}` — for removing an inappropriate review (not wired to a UI button yet — ask if you want a delete button added for admins).

**Frontend (new):** `api/reviews.js`, `components/ReviewSection.jsx` — mounted on the product page.
Shows the average star rating and count, every review with the reviewer's name/initial, star
rating and date, and a form to leave a new review. **Anyone signed in can review** (shoppers and
admins both) — I didn't see a reason to block admins from reviewing like they're blocked from
buying, but say the word if you'd rather restrict it to shoppers only.

Reviews are completely genuine, written by whoever is signed in when they submit — nothing is
pre-filled or invented.

## 2. "You might also like" (cross-sell suggestions)

**Backend (new):** `RelatedProductsController.java` — `GET /api/products/{id}/related`.

This is rule-based, not AI: a small category-adjacency map (e.g. Mobile → Headphone, Electronics)
decides what's a sensible accessory/complement to suggest, same as your iPhone → accessories
example. It prioritises same-brand matches first, then complementary categories, then other
products in the same category — always real, in-stock products, never invented. The whole map is
one small table at the top of the file if you want to adjust which categories suggest which.

**Frontend (new):** `api/related.js`, `components/RelatedProducts.jsx` — mounted on the product
page below reviews, reusing your existing `ProductCard` so it looks and behaves exactly like the
rest of the site (same "Add to cart" behaviour, same admin restrictions, etc).

## 3. Image zoom on hover

**Product detail page:** hovering the main product image now shows a magnified, cursor-following
zoom (like most shopping sites use for closer inspection) — implemented in plain React/CSS, no
new library. A small "Hover to zoom" hint fades in on hover so it's discoverable. On touch devices
(no mouse), this is automatically disabled — there's no hover there, so it just shows the normal
image.

**Product grid cards:** a lighter touch — the thumbnail scales up slightly on hover, consistent
with the existing hover-preview panel that was already there.

## Files touched
**New:** `Review.java`, `ReviewSummary.java`, `ReviewRepo.java`, `ReviewController.java`,
`RelatedProductsController.java`, `api/reviews.js`, `api/related.js`, `ReviewSection.jsx`,
`RelatedProducts.jsx`.
**Edited (additive only):** `Product.jsx` (added the zoom handlers and mounted the two new
sections), `styles.css` (appended new rules, nothing removed).
**Untouched:** everything else, including the AI assistant, comparison engine, cart, orders, and
all other existing components.

## Honest limitations
- I don't have Maven Central access in my environment, so the backend Java wasn't compiled by
  me — I reviewed it carefully by hand. If it fails to start, send me the first error line.
- The frontend (reviews, related products, zoom) was tested end-to-end in a browser against a
  mocked backend and works correctly — but I couldn't test against your real Spring Boot server.
- "Related products" logic is a simple category map, not personalized — it doesn't yet learn from
  what a specific shopper has browsed before. That would be a good fit for a future AI-powered
  increment, reusing the same Gemini integration from the shopping assistant.
