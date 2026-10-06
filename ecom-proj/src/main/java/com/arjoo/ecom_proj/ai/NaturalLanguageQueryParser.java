package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Converts natural shopping language into database-safe structured intent. */
@Component
public class NaturalLanguageQueryParser {
    private static final Pattern PRICE_CAP = Pattern.compile("(?:under|below|less than|within|up ?to|max(?:imum)?|budget(?: of)?|around|about)\\s*(?:rs\\.?|inr|₹)?\\s*([\\d][\\d,]*(?:\\.\\d+)?)\\s*(lakhs?|l\\b|k\\b|thousand)?", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_FLOOR = Pattern.compile("(?:above|over|more than|minimum|at least)\\s*(?:rs\\.?|inr|₹)?\\s*([\\d][\\d,]*(?:\\.\\d+)?)\\s*(lakhs?|l\\b|k\\b|thousand)?", Pattern.CASE_INSENSITIVE);
    private static final Set<String> STOPWORDS = Set.of("the","a","an","i","need","want","for","with","and","or","to","of","in","on","is","my","me","please","looking","look","find","show","recommend","suggest","under","below","budget","rs","inr","rupees","rupee","within","up","about","that","this","can","you","some","good","best","which","ok","okay","get","buy","have","any","are","there","would","like","im","i'm","also","just","one","around","over","above","more","less","than","at","least","max","maximum","lakh","lakhs","thousand","k","compare","comparison","versus","vs","between","option","options","product","products","phone","phones","mobile","mobiles");

    public QueryCriteria parse(String message, Collection<String> knownCategories, Collection<String> knownBrands) {
        QueryCriteria criteria = new QueryCriteria();
        if (message == null || message.isBlank()) return criteria;
        String text = message.toLowerCase(Locale.ROOT).trim();
        criteria.setMaxPrice(findPrice(text, PRICE_CAP));
        criteria.setMinPrice(findPrice(text, PRICE_FLOOR));
        criteria.setCategory(findCategory(text, knownCategories));
        criteria.setBrand(findBrand(text, knownBrands));
        addKeywords(criteria, text);
        return criteria;
    }

    /** Comparison-specific parser: identifies category first and, when named, the exact products. */
    public ComparisonCriteria parseComparison(String message, Collection<String> knownCategories,
                                              Collection<String> knownBrands, Collection<Product> catalogue) {
        ComparisonCriteria c = new ComparisonCriteria();
        if (message == null || message.isBlank()) return c;
        String text = message.toLowerCase(Locale.ROOT).trim();
        String compact = text.replaceAll("[^a-z0-9]+", " ").trim();
        c.setComparisonRequested(text.matches(".*\\b(compare|comparison|versus|vs|difference|better than)\\b.*") || text.contains("which is better"));
        c.setBestMatchRequested(text.matches(".*\\b(best|top|most suitable|recommend|recommended)\\b.*"));
        c.setMaxPrice(findPrice(text, PRICE_CAP));
        c.setMinPrice(findPrice(text, PRICE_FLOOR));
        c.setBrand(findBrand(text, knownBrands));

        List<Product> nameMatches = catalogue.stream()
                .filter(p -> p.getName() != null && !p.getName().isBlank())
                .sorted(Comparator.comparingInt((Product p) -> p.getName().length()).reversed())
                .filter(p -> containsPhrase(compact, normalize(p.getName())))
                .toList();
        for (Product p : nameMatches) {
            if (!c.getProductNames().contains(p.getName())) c.getProductNames().add(p.getName());
            if (c.getProductNames().size() >= 5) break;
        }

        String category = findCategory(text, knownCategories);
        c.setCategoryFamily(detectCategoryFamily(text));
        if (category == null && !nameMatches.isEmpty()) {
            String firstCategory = nameMatches.get(0).getCategory();
            boolean same = nameMatches.stream().allMatch(p -> Objects.equals(normalize(firstCategory), normalize(p.getCategory())));
            if (same) category = firstCategory;
        }
        c.setCategory(category);
        addPriorities(c, text);
        return c;
    }

    private void addKeywords(QueryCriteria c, String text) {
        String withoutNumbers = text.replaceAll("[\\d,.]+", " ");
        for (String token : withoutNumbers.split("[^a-zA-Z']+")) {
            String word = token.trim().toLowerCase(Locale.ROOT);
            if (word.length() < 3 || STOPWORDS.contains(word)) continue;
            if (c.getCategory() != null && c.getCategory().equalsIgnoreCase(word)) continue;
            if (c.getBrand() != null && c.getBrand().equalsIgnoreCase(word)) continue;
            if (!c.getKeywords().contains(word)) c.getKeywords().add(word);
        }
    }

    private void addPriorities(ComparisonCriteria c, String text) {
        if (containsAny(text, "camera", "photography", "photo", "photos")) c.getPriorities().put("camera", 0.45);
        if (containsAny(text, "battery", "battery life", "backup")) c.getPriorities().put("battery", 0.35);
        if (containsAny(text, "gaming", "game", "games", "gpu", "graphics")) {
            c.getPriorities().put("gpu", 0.35);
            c.getPriorities().put("performance", 0.35);
        }
        if (containsAny(text, "performance", "fast", "speed", "processor", "cpu")) c.getPriorities().put("performance", 0.35);
        if (containsAny(text, "display", "screen", "refresh rate", "amoled", "oled")) c.getPriorities().put("display", 0.20);
        if (containsAny(text, "storage", "space", "ssd", "memory")) c.getPriorities().put("storage", 0.20);
        if (containsAny(text, "ram")) c.getPriorities().put("ram", 0.20);
        if (containsAny(text, "sound", "audio", "bass", "music")) c.getPriorities().put("sound", 0.30);
        if (containsAny(text, "noise cancellation", "anc")) c.getPriorities().put("anc", 0.25);
        if (containsAny(text, "cheap", "cheapest", "value", "affordable", "budget")) c.getPriorities().put("price", 0.40);
    }

    private String detectCategoryFamily(String text) {
        if (containsAny(text, "phone", "phones", "mobile", "mobiles", "smartphone", "smartphones", "cell phone")) return "phone";
        if (containsAny(text, "laptop", "laptops", "notebook", "notebooks")) return "laptop";
        if (containsAny(text, "headphone", "headphones", "earphone", "earphones", "earbuds", "headset")) return "audio";
        if (containsAny(text, "tv", "television")) return "tv";
        if (containsAny(text, "watch", "smartwatch", "smart watch")) return "watch";
        return null;
    }

    private String findCategory(String text, Collection<String> knownCategories) {
        if (knownCategories == null) return null;
        return knownCategories.stream()
                .filter(Objects::nonNull).filter(s -> !s.isBlank())
                .max(Comparator.comparingInt(cat -> categoryMatchScore(text, cat)))
                .filter(cat -> categoryMatchScore(text, cat) > 0)
                .orElse(null);
    }

    private int categoryMatchScore(String text, String category) {
        String c = normalize(category);
        if (containsPhrase(text, c)) return 1000 + c.length();
        String[] tokens = c.split(" ");
        int score = 0;
        for (String token : tokens) {
            if (token.length() >= 3 && containsWord(text, token)) score += 100;
        }
        if (isAlias(text, c, "phone", "mobile", "smartphone", "cell")) score += 300;
        if (isAlias(text, c, "laptop", "notebook", "computer")) score += 300;
        if (isAlias(text, c, "headphone", "headphones", "earphone", "earbuds", "headset")) score += 300;
        if (isAlias(text, c, "tv", "television")) score += 300;
        if (isAlias(text, c, "watch", "smartwatch")) score += 300;
        return score;
    }

    private boolean isAlias(String text, String category, String... aliases) {
        boolean userUsedAlias = Arrays.stream(aliases).anyMatch(a -> containsWord(text, a));
        if (!userUsedAlias) return false;
        return Arrays.stream(aliases).anyMatch(a -> category.contains(a));
    }

    private String findBrand(String text, Collection<String> knownBrands) {
        if (knownBrands == null) return null;
        return knownBrands.stream().filter(Objects::nonNull).filter(s -> !s.isBlank())
                .sorted((a,b) -> Integer.compare(b.length(), a.length()))
                .filter(b -> containsPhrase(text, normalize(b))).findFirst().orElse(null);
    }

    private boolean containsPhrase(String text, String phrase) {
        if (phrase.isBlank()) return false;
        return Pattern.compile("(?<![a-z0-9])" + Pattern.quote(phrase) + "(?![a-z0-9])", Pattern.CASE_INSENSITIVE).matcher(normalize(text)).find();
    }

    private boolean containsWord(String text, String word) {
        return Pattern.compile("(?<![a-z0-9])" + Pattern.quote(word) + "(?![a-z0-9])", Pattern.CASE_INSENSITIVE).matcher(normalize(text)).find();
    }

    private boolean containsAny(String text, String... values) { return Arrays.stream(values).anyMatch(v -> containsPhrase(text, normalize(v))); }
    private String normalize(String s) { return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim(); }

    private BigDecimal findPrice(String text, Pattern pattern) {
        Matcher m = pattern.matcher(text);
        return m.find() ? toAmount(m.group(1), m.group(2)) : null;
    }

    private BigDecimal toAmount(String number, String suffix) {
        BigDecimal amount = new BigDecimal(number.replace(",", ""));
        if (suffix == null) return amount;
        String s = suffix.trim().toLowerCase(Locale.ROOT);
        if (s.startsWith("lakh") || s.equals("l")) return amount.multiply(BigDecimal.valueOf(100_000));
        if (s.equals("k") || s.equals("thousand")) return amount.multiply(BigDecimal.valueOf(1_000));
        return amount;
    }
}
