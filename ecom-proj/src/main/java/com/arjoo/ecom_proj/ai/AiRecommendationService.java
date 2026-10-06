package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;
import com.arjoo.ecom_proj.repo.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The AI Shopping Assistant's brain: understands the request (via {@link NaturalLanguageQueryParser}),
 * finds candidates from the real product catalogue, scores them by how well they match, and writes a
 * short, honest explanation for each one — using only values that are actually on the product.
 *
 * Category and brand names are read from the database at request time, so this works with whatever
 * you're actually selling (electronics today, something else tomorrow) without code changes.
 */
@Service
public class AiRecommendationService {

    private static final int MAX_RESULTS = 5;
    private static final NumberFormat RUPEES = NumberFormat.getInstance(new Locale("en", "IN"));

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private NaturalLanguageQueryParser parser;

    @Autowired
    private ProductComparisonService comparisonService;

    @Autowired
    private GeminiClient geminiClient;

    public AiChatResponse chat(String message) {
        // If a Gemini API key is configured, let it handle the request first — it understands
        // things like "best camera phone" semantically instead of matching literal words, and
        // it's constrained to only ever recommend products that are actually in our catalogue.
        // Any failure (no key, network error, bad response) falls straight through to the
        // existing rule-based engine below, so the assistant never just breaks.
        if (geminiClient.isEnabled()) {
            try {
                AiChatResponse aiResponse = geminiClient.recommend(message, productRepo.findAll());
                if (aiResponse != null) return aiResponse;
            } catch (Exception e) {
                System.out.println("Gemini request failed, falling back to the rule-based assistant: " + e.getMessage());
            }
        }
        return ruleBasedChat(message);
    }

    private AiChatResponse ruleBasedChat(String message) {
        List<Product> catalogue = productRepo.findAll();

        Set<String> categories = catalogue.stream().map(Product::getCategory)
                .filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> brands = catalogue.stream().map(Product::getBrand)
                .filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        QueryCriteria criteria = parser.parse(message, categories, brands);

        ComparisonCriteria comparisonCriteria = parser.parseComparison(message, categories, brands, catalogue);
        if (comparisonCriteria.isComparisonRequested() || comparisonCriteria.isBestMatchRequested()) {
            ComparisonResponse comparison = comparisonService.compare(message);
            AiChatResponse comparisonResponse = new AiChatResponse();
            comparisonResponse.setInterpreted(criteria);
            comparisonResponse.setComparison(comparison);
            List<ProductMatch> comparisonProducts = comparison.getProducts().stream().map(this::toProductMatch).toList();
            comparisonResponse.setProducts(comparisonProducts);
            comparisonResponse.setReply(comparison.getSummary() + " " + comparison.getReason());
            return comparisonResponse;
        }

        // Hard filter: a stated budget is a real constraint, not a preference.
        List<Product> withinBudget = catalogue.stream()
                .filter(p -> criteria.getCategory() == null || criteria.getCategory().equalsIgnoreCase(safe(p.getCategory())))
                .filter(p -> criteria.getMaxPrice() == null || (p.getPrice() != null && p.getPrice().compareTo(criteria.getMaxPrice()) <= 0))
                .filter(p -> criteria.getMinPrice() == null || (p.getPrice() != null && p.getPrice().compareTo(criteria.getMinPrice()) >= 0))
                .collect(Collectors.toList());

        boolean relaxedAvailability = false;
        List<Product> inStock = withinBudget.stream()
                .filter(p -> Boolean.TRUE.equals(p.getProductAvailable()) && p.getStockQuantity() > 0)
                .collect(Collectors.toList());
        List<Product> pool = inStock;
        if (pool.isEmpty() && !withinBudget.isEmpty()) {
            pool = withinBudget; // nothing in stock in budget — show what exists anyway, and say so
            relaxedAvailability = true;
        }

        List<ProductMatch> ranked = pool.stream()
                .map(p -> score(p, criteria))
                .sorted(Comparator.comparingInt(ProductMatch::getScore).reversed()
                        .thenComparing(m -> nullSafe(m.getProduct().getPrice())))
                .limit(MAX_RESULTS)
                .collect(Collectors.toList());

        // If the shopper clearly asked for something specific (a category, brand, budget or
        // keyword) but nothing in the pool actually matched any of it, everything ties at score
        // 0 and the sort above would just show whatever happens to be cheapest — which looks like
        // a wrong answer, not an honest "we don't have that". Say so instead.
        boolean nothingReallyMatched = !criteria.isEmpty() && !ranked.isEmpty() && ranked.get(0).getScore() <= 0;
        if (nothingReallyMatched) {
            ranked = List.of();
        }

        AiChatResponse response = new AiChatResponse();
        response.setInterpreted(criteria);
        response.setProducts(ranked);
        response.setReply(composeReply(criteria, ranked, catalogue.isEmpty(),
                withinBudget.isEmpty() && criteria.getMaxPrice() != null, relaxedAvailability, nothingReallyMatched));
        return response;
    }

    private BigDecimal nullSafe(BigDecimal price) {
        return price == null ? BigDecimal.ZERO : price;
    }

    private ProductMatch score(Product product, QueryCriteria criteria) {
        ProductMatch match = new ProductMatch(product);
        String haystack = String.join(" ",
                safe(product.getName()), safe(product.getDescription()), safe(product.getCategory()), safe(product.getBrand())
        ).toLowerCase(Locale.ROOT);

        if (criteria.getCategory() != null && criteria.getCategory().equalsIgnoreCase(safe(product.getCategory()))) {
            match.addReason("in the " + product.getCategory() + " category you asked about", 3);
        }
        if (criteria.getBrand() != null && criteria.getBrand().equalsIgnoreCase(safe(product.getBrand()))) {
            match.addReason("made by " + product.getBrand() + ", which you mentioned", 2);
        }
        for (String keyword : criteria.getKeywords()) {
            if (haystack.contains(keyword)) {
                match.addReason("mentions \"" + keyword + "\" in its details", 1);
            }
        }
        if (criteria.getMaxPrice() != null && product.getPrice() != null) {
            match.addReason("fits your budget at " + formatRupees(product.getPrice()), 1);
        }
        if (product.getDiscountPercent() != null && product.getDiscountPercent() > 0) {
            match.addReason("currently " + stripDecimal(product.getDiscountPercent()) + "% off", 1);
        }
        if (match.getReasons().isEmpty()) {
            match.addReason("a popular option in our catalogue", 0);
        }
        return match;
    }

    private ProductMatch toProductMatch(ComparisonProduct comparison) {
        ProductMatch match = new ProductMatch(comparison.getProduct());
        for (String strength : comparison.getStrengths()) match.addReason("strong " + strength + " match", 1);
        if (comparison.getProduct().getPrice() != null) match.addReason("price: ₹" + RUPEES.format(comparison.getProduct().getPrice()), 0);
        if (match.getReasons().isEmpty()) match.addReason("matched the comparison criteria", 0);
        return match;
    }

    private String composeReply(QueryCriteria criteria, List<ProductMatch> results, boolean catalogueEmpty,
                                 boolean nothingInBudget, boolean relaxedAvailability, boolean nothingReallyMatched) {
        if (catalogueEmpty) {
            return "The store doesn't have any products yet, so I've got nothing to recommend just yet — check back once the catalogue has been stocked.";
        }
        if (nothingReallyMatched) {
            String what = criteria.getKeywords().isEmpty() ? "that" : String.join(" ", criteria.getKeywords());
            return "I couldn't find anything in our current catalogue that genuinely matches \"" + what
                    + "\". Try a different category or brand, or ask me what we do have.";
        }

        StringBuilder understood = new StringBuilder();
        if (criteria.getCategory() != null) understood.append("category: ").append(criteria.getCategory()).append(" · ");
        if (criteria.getBrand() != null) understood.append("brand: ").append(criteria.getBrand()).append(" · ");
        if (criteria.getMaxPrice() != null) understood.append("budget: up to ").append(formatRupees(criteria.getMaxPrice())).append(" · ");
        if (criteria.getMinPrice() != null) understood.append("budget: at least ").append(formatRupees(criteria.getMinPrice())).append(" · ");
        if (!criteria.getKeywords().isEmpty()) understood.append("use case: ").append(String.join(", ", criteria.getKeywords())).append(" · ");
        String summary = understood.length() > 0 ? understood.substring(0, understood.length() - 3) : "";

        if (nothingInBudget) {
            return "I couldn't find anything at or under " + formatRupees(criteria.getMaxPrice())
                    + (criteria.getCategory() != null ? " in " + criteria.getCategory() : "")
                    + " right now. You could try a slightly higher budget, or ask me about a different category.";
        }

        if (results.isEmpty()) {
            return "Tell me a bit more — a budget, a category, or what you'll use it for — and I'll pull the best matches from our catalogue.";
        }

        StringBuilder reply = new StringBuilder();
        if (!summary.isEmpty()) {
            reply.append("Here's what I understood — ").append(summary).append(". ");
        }
        reply.append("I found ").append(results.size()).append(results.size() == 1 ? " match" : " matches")
                .append(" from our actual stock, ranked by fit:");
        if (relaxedAvailability) {
            reply.append(" (note: nothing matching is currently in stock, so these are shown for reference.)");
        }
        return reply.toString();
    }

    private String safe(String s) { return s == null ? "" : s; }

    private String formatRupees(BigDecimal amount) {
        return "₹" + RUPEES.format(amount);
    }

    private String stripDecimal(double d) {
        return d == Math.floor(d) ? String.valueOf((int) d) : String.valueOf(d);
    }
}
