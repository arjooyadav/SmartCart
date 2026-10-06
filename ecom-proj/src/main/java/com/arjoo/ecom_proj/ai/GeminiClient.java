package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Talks to Google's Gemini API (free tier) to understand a shopper's request and pick the best
 * matching products — using real semantic understanding instead of regex/keyword matching, which
 * is what lets "best camera phone" correctly mean "a phone with a good camera" rather than
 * matching on the literal word "phone" or falling back to whatever happens to be cheapest.
 *
 * Get a free key at https://aistudio.google.com/apikey and put it in application.properties as
 * gemini.api.key=... — leave it blank and this client quietly does nothing, so
 * AiRecommendationService falls back to its built-in rule-based engine. No key, no dependency,
 * no library beyond what Spring Boot already ships with (java.net.http + Jackson).
 *
 * Gemini is NEVER allowed to invent a product: we hand it the actual catalogue (id, name, brand,
 * category, price, stock, description) and tell it to choose only from those ids. Any id it
 * returns that isn't a real product in the catalogue is silently discarded.
 */
@Component
public class GeminiClient {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public AiChatResponse recommend(String message, List<Product> catalogue) throws Exception {
        // Keep the prompt a reasonable size even if the catalogue grows large.
        List<Product> candidates = catalogue.size() > 80 ? catalogue.subList(0, 80) : catalogue;

        List<Map<String, Object>> catalogueForPrompt = new ArrayList<>();
        for (Product p : candidates) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", p.getId());
            entry.put("name", safe(p.getName()));
            entry.put("brand", safe(p.getBrand()));
            entry.put("category", safe(p.getCategory()));
            entry.put("price", p.getPrice() == null ? 0 : p.getPrice());
            entry.put("inStock", Boolean.TRUE.equals(p.getProductAvailable()) && p.getStockQuantity() > 0);
            entry.put("description", truncate(safe(p.getDescription()), 200));
            catalogueForPrompt.add(entry);
        }

        String prompt = "You are SmartCart AI, a shopping assistant for an online store.\n\n" +
                "A shopper asked: \"" + message.replace("\"", "'") + "\"\n\n" +
                "Here is the ENTIRE real product catalogue available right now, as JSON " +
                "(id, name, brand, category, price in INR, inStock, description):\n" +
                mapper.writeValueAsString(catalogueForPrompt) + "\n\n" +
                "Pick the best-matching products for the shopper's request, using ONLY products from the " +
                "catalogue above. Never invent a product, brand, spec or price that isn't in that list. " +
                "Prefer products where inStock is true; only suggest an out-of-stock product if nothing " +
                "in-stock is relevant, and say so. If genuinely nothing in the catalogue fits the request " +
                "well, return an empty productIds array and say so honestly and kindly in \"reply\" — do not " +
                "pick an unrelated product just to have something to show. Order productIds best match " +
                "first, at most 5 items.\n\n" +
                "Respond with ONLY raw JSON (no markdown code fences, no commentary before or after), in " +
                "exactly this shape:\n" +
                "{\"reply\": \"<one short, friendly sentence>\", \"productIds\": [<id>, <id>], " +
                "\"reasons\": {\"<id>\": \"<short reason citing real catalogue data, e.g. price or a spec in the description>\"}}";

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0.2)
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                + ":generateContent?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> httpResponse = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (httpResponse.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned HTTP " + httpResponse.statusCode() + ": " + httpResponse.body());
        }

        JsonNode root = mapper.readTree(httpResponse.body());
        String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
        JsonNode parsed = mapper.readTree(stripCodeFences(text));

        Map<Integer, Product> byId = new HashMap<>();
        for (Product p : catalogue) byId.put(p.getId(), p);

        List<ProductMatch> matches = new ArrayList<>();
        JsonNode reasons = parsed.path("reasons");
        for (JsonNode idNode : parsed.path("productIds")) {
            int id = idNode.asInt();
            Product product = byId.get(id);
            if (product == null) continue; // Gemini named something not in our catalogue — ignore it
            ProductMatch match = new ProductMatch(product);
            String reason = reasons.has(String.valueOf(id))
                    ? reasons.get(String.valueOf(id)).asText()
                    : "recommended by SmartCart AI for this request";
            match.addReason(reason, 1);
            matches.add(match);
            if (matches.size() >= 5) break;
        }

        AiChatResponse response = new AiChatResponse();
        response.setReply(parsed.path("reply").asText("Here's what I found in our catalogue."));
        response.setProducts(matches);
        return response;
    }

    private String stripCodeFences(String s) {
        String t = s.trim();
        if (t.startsWith("```")) {
            t = t.replaceFirst("^```[a-zA-Z]*\\s*", "");
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    private String safe(String s) { return s == null ? "" : s; }

    private String truncate(String s, int max) { return s.length() <= max ? s : s.substring(0, max) + "..."; }
}
