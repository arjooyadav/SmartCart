package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;
import com.arjoo.ecom_proj.repo.ProductRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Category-aware, evidence-based comparison engine.
 * The database is the source of truth. AI/rule parsing only describes the user's intent.
 */
@Service
public class ProductComparisonService {
    private static final NumberFormat RUPEES = NumberFormat.getInstance(new Locale("en", "IN"));
    private final ProductRepo productRepo;
    private final NaturalLanguageQueryParser parser;

    public ProductComparisonService(ProductRepo productRepo, NaturalLanguageQueryParser parser) {
        this.productRepo = productRepo;
        this.parser = parser;
    }

    public ComparisonResponse compare(String message) {
        List<Product> catalogue = productRepo.findAll();
        Set<String> categories = catalogue.stream().map(Product::getCategory).filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> brands = catalogue.stream().map(Product::getBrand).filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));
        ComparisonCriteria criteria = parser.parseComparison(message, categories, brands, catalogue);

        // Without a category, a category family ("phone", "laptop", ...), or specific product
        // names, there is nothing to scope the comparison to — matchesCategoryScope() would let
        // every product through, including completely unrelated ones (a ceiling fan showing up
        // in a phone comparison). Say so honestly instead of comparing the whole catalogue.
        boolean hasScope = criteria.getCategoryFamily() != null
                || criteria.getCategory() != null
                || !criteria.getProductNames().isEmpty();
        if (!hasScope) {
            ComparisonResponse unscoped = new ComparisonResponse();
            unscoped.setInterpreted(criteria);
            unscoped.setProducts(List.of());
            unscoped.setSummary("I couldn't tell which products or category you want compared.");
            unscoped.setReason("Try naming the exact products (e.g. \"compare iPhone 15 and Galaxy S24\") "
                    + "or a category (e.g. \"compare laptops under 70000\").");
            return unscoped;
        }

        List<Product> pool = catalogue.stream()
                .filter(p -> matchesCategoryScope(p, criteria))
                .filter(p -> criteria.getMaxPrice() == null || (p.getPrice() != null && p.getPrice().compareTo(criteria.getMaxPrice()) <= 0))
                .filter(p -> criteria.getMinPrice() == null || (p.getPrice() != null && p.getPrice().compareTo(criteria.getMinPrice()) >= 0))
                .filter(p -> criteria.getBrand() == null || criteria.getBrand().equalsIgnoreCase(safe(p.getBrand())))
                .filter(p -> criteria.getProductNames().isEmpty() || criteria.getProductNames().stream().anyMatch(n -> sameProductName(p.getName(), n)))
                .collect(Collectors.toList());

        // Prefer available products, but don't hide real catalogue data when none are available.
//        List<Product> available = pool.stream().filter(this::available).collect(Collectors.toList());
//        if (!available.isEmpty()) pool = available;
//
//        List<ComparisonProduct> results = pool.stream()
//                .map(p -> score(p, criteria, pool))
//                .sorted(Comparator.comparingDouble(ComparisonProduct::getScore).reversed()
//                        .thenComparing(cp -> price(cp.getProduct())))
//                .limit(10)
//                .collect(Collectors.toList());
        // Prefer available products, but don't hide real catalogue data when none are available.
        List<Product> available = pool.stream()
                .filter(this::available)
                .collect(Collectors.toList());

        if (!available.isEmpty()) {
            pool = available;
        }

// Create an effectively-final reference for use inside the lambda.
        final List<Product> scoringPool = pool;

        List<ComparisonProduct> results = scoringPool.stream()
                .map(p -> score(p, criteria, scoringPool))
                .sorted(
                        Comparator.comparingDouble(ComparisonProduct::getScore)
                                .reversed()
                                .thenComparing(cp -> price(cp.getProduct()))
                )
                .limit(10)
                .collect(Collectors.toList());

        ComparisonResponse response = new ComparisonResponse();
        response.setInterpreted(criteria);
        response.setCategory(criteria.getCategoryFamily() != null ? criteria.getCategoryFamily() : criteria.getCategory());
        response.setProducts(results);

        if (results.isEmpty()) {
            response.setSummary("I couldn't find comparable products in the requested category in the current catalogue.");
            response.setReason("No products matched the category, budget, brand or product names in the request.");
            return response;
        }

        ComparisonProduct winner = results.get(0);
        response.setRecommendedProduct(winner.getProduct().getName());
        response.setSummary(buildSummary(criteria, results));
        response.setReason(buildReason(criteria, winner));

        if (results.size() < 2) {
            response.getCaveats().add("Only one matching product is available, so there is no meaningful head-to-head comparison yet.");
        }
        if (results.stream().anyMatch(r -> r.getProduct().getSpecifications() == null || r.getProduct().getSpecifications().isEmpty())) {
            response.getCaveats().add("Some product specifications are missing from the catalogue. Missing data is not treated as a positive score.");
        }
        return response;
    }

    private ComparisonProduct score(Product product, ComparisonCriteria criteria, List<Product> pool) {
        ComparisonProduct result = new ComparisonProduct(product);
        Map<String, Double> weights = weightsFor(criteria.getCategory(), criteria.getPriorities());
        double weighted = 0;
        double totalWeight = 0;

        for (Map.Entry<String, Double> entry : weights.entrySet()) {
            String criterion = entry.getKey();
            Double value = criterionScore(product, criterion, pool, criteria);
            if (value == null) continue;
            double w = entry.getValue();
            weighted += value * w;
            totalWeight += w;
            result.getCriterionScores().put(criterion, round(value * 100));
            String evidence = evidence(product, criterion);
            if (evidence != null) result.getEvidence().put(criterion, evidence);
            if (value >= 0.80) result.getStrengths().add(label(criterion));
            if (value <= 0.35) result.getLimitations().add(label(criterion));
        }

        double finalScore = totalWeight == 0 ? 0 : (weighted / totalWeight) * 100;
        result.setScore(round(finalScore));
        return result;
    }

    private Map<String, Double> weightsFor(String category, Map<String, Double> userPriorities) {
        Map<String, Double> base = new LinkedHashMap<>();
        String c = safe(category).toLowerCase(Locale.ROOT);
        if (c.contains("phone") || c.contains("mobile")) {
            base.put("camera", 0.20); base.put("battery", 0.18); base.put("performance", 0.16);
            base.put("display", 0.10); base.put("storage", 0.10); base.put("price", 0.26);
        } else if (c.contains("laptop") || c.contains("computer")) {
            base.put("performance", 0.22); base.put("gpu", 0.16); base.put("ram", 0.14);
            base.put("storage", 0.12); base.put("display", 0.10); base.put("battery", 0.06); base.put("price", 0.20);
        } else if (c.contains("headphone") || c.contains("earbud")) {
            base.put("sound", 0.25); base.put("battery", 0.18); base.put("anc", 0.12); base.put("comfort", 0.10); base.put("price", 0.35);
        } else {
            base.put("features", 0.25); base.put("performance", 0.20); base.put("quality", 0.15); base.put("price", 0.40);
        }

        // User-mentioned priorities override the default weights, then normalize at scoring time.
        for (Map.Entry<String, Double> e : userPriorities.entrySet()) {
            if (base.containsKey(e.getKey())) base.put(e.getKey(), Math.max(0.01, e.getValue()));
        }
        return base;
    }

    private Double criterionScore(Product p, String criterion, List<Product> pool, ComparisonCriteria criteria) {
        String value = spec(p, criterion);
        if (value == null) value = fallbackText(p, criterion);

        if ("price".equals(criterion)) {
            if (p.getPrice() == null) return null;
            BigDecimal min = pool.stream().map(Product::getPrice).filter(Objects::nonNull).min(BigDecimal::compareTo).orElse(p.getPrice());
            BigDecimal max = pool.stream().map(Product::getPrice).filter(Objects::nonNull).max(BigDecimal::compareTo).orElse(p.getPrice());
            if (max.compareTo(min) == 0) return 1.0;
            double normalized = max.subtract(p.getPrice()).doubleValue() / max.subtract(min).doubleValue();
            return clamp(normalized);
        }
        if (value == null || value.isBlank()) return null;

        Double number = firstNumber(value);
        if (number != null) {
            List<Double> nums = pool.stream().map(x -> {
                String v = spec(x, criterion); if (v == null) v = fallbackText(x, criterion); return firstNumber(v);
            }).filter(Objects::nonNull).toList();
            if (nums.size() >= 2) {
                double min = nums.stream().min(Double::compareTo).orElse(number);
                double max = nums.stream().max(Double::compareTo).orElse(number);
                if (max > min) return clamp((number - min) / (max - min));
            }
            return 0.5;
        }
        return 0.5;
    }

    private String spec(Product p, String criterion) {
        if (p.getSpecifications() == null) return null;
        for (Map.Entry<String,String> e : p.getSpecifications().entrySet()) {
            if (normalize(e.getKey()).contains(normalize(criterion))) return e.getValue();
        }
        return null;
    }

    private String fallbackText(Product p, String criterion) {
        String hay = (safe(p.getName()) + " " + safe(p.getDescription())).toLowerCase(Locale.ROOT);
        return switch (criterion) {
            case "camera" -> hay.contains("camera") || hay.contains("mp") ? p.getDescription() : null;
            case "battery" -> hay.contains("battery") || hay.contains("mah") ? p.getDescription() : null;
            case "performance", "gpu" -> hay.contains("processor") || hay.contains("snapdragon") || hay.contains("ryzen") || hay.contains("intel") || hay.contains("gaming") ? p.getDescription() : null;
            case "display" -> hay.contains("display") || hay.contains("amoled") || hay.contains("oled") || hay.contains("120hz") ? p.getDescription() : null;
            case "storage" -> hay.contains("gb") || hay.contains("tb") ? p.getDescription() : null;
            case "ram" -> hay.contains("ram") ? p.getDescription() : null;
            case "sound" -> hay.contains("audio") || hay.contains("sound") || hay.contains("bass") ? p.getDescription() : null;
            case "anc" -> hay.contains("anc") || hay.contains("noise cancellation") ? p.getDescription() : null;
            default -> safe(p.getDescription()).isBlank() ? null : p.getDescription();
        };
    }

    private String evidence(Product p, String criterion) {
        String v = spec(p, criterion);
        if (v != null) return v;
        if ("price".equals(criterion) && p.getPrice() != null) return "₹" + RUPEES.format(p.getPrice());
        return null;
    }

    private String buildSummary(ComparisonCriteria c, List<ComparisonProduct> results) {
        String categoryLabel = c.getCategoryFamily() != null ? c.getCategoryFamily() : c.getCategory();
        String scope = c.getProductNames().isEmpty() ? "available " + safe(categoryLabel) + " products" : "the requested products";
        return "Compared " + results.size() + " " + scope + " using the requirements in the request and only catalogue data that is available.";
    }

    private String buildReason(ComparisonCriteria c, ComparisonProduct winner) {
        StringBuilder s = new StringBuilder(winner.getProduct().getName()).append(" scores highest for this request");
        if (!c.getPriorities().isEmpty()) s.append(" because it matches your priorities for ").append(String.join(", ", c.getPriorities().keySet()));
        else if (!winner.getStrengths().isEmpty()) s.append(" because it is strongest on ").append(String.join(", ", winner.getStrengths()));
        else s.append(" based on the comparable data available in the catalogue");
        s.append(".");
        return s.toString();
    }

    private boolean matchesCategoryScope(Product p, ComparisonCriteria criteria) {
        if (criteria.getCategoryFamily() != null) {
            String c = normalize(safe(p.getCategory()));
            return switch (criteria.getCategoryFamily()) {
                case "phone" -> c.contains("phone") || c.contains("mobile") || c.contains("smartphone");
                case "laptop" -> c.contains("laptop") || c.contains("notebook") || c.contains("computer");
                case "audio" -> c.contains("headphone") || c.contains("earphone") || c.contains("earbud") || c.contains("headset");
                case "tv" -> c.contains("tv") || c.contains("television");
                case "watch" -> c.contains("watch");
                default -> criteria.getCategory() == null || sameCategory(p, criteria.getCategory());
            };
        }
        return criteria.getCategory() == null || sameCategory(p, criteria.getCategory());
    }

    private boolean sameCategory(Product p, String category) { return normalize(safe(p.getCategory())).equals(normalize(safe(category))); }
    private boolean sameProductName(String actual, String requested) { return normalize(safe(actual)).equals(normalize(safe(requested))) || normalize(safe(actual)).contains(normalize(safe(requested))) || normalize(safe(requested)).contains(normalize(safe(actual))); }
    private boolean available(Product p) { return Boolean.TRUE.equals(p.getProductAvailable()) && p.getStockQuantity() > 0; }
    private BigDecimal price(Product p) { return p.getPrice() == null ? BigDecimal.valueOf(Long.MAX_VALUE) : p.getPrice(); }
    private String safe(String s) { return s == null ? "" : s; }
    private String normalize(String s) { return safe(s).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim(); }
    private Double firstNumber(String s) { if (s == null) return null; java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)").matcher(s.replace(",", "")); return m.find() ? Double.valueOf(m.group(1)) : null; }
    private double clamp(double v) { return Math.max(0, Math.min(1, v)); }
    private double round(double v) { return Math.round(v * 100.0) / 100.0; }
    private String label(String s) { return switch (s) { case "price" -> "price/value"; case "gpu" -> "graphics performance"; default -> s; }; }
}
