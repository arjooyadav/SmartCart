package com.arjoo.ecom_proj.controller;

import com.arjoo.ecom_proj.model.Product;
import com.arjoo.ecom_proj.repo.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * "You might also like" / cross-sell suggestions for a product page — e.g. viewing a phone
 * suggests headphones and other electronics, the way real stores suggest accessories.
 *
 * This is rule-based (a category adjacency map below), not AI — it's fast, free, and completely
 * predictable, which is exactly what you want for "people who viewed X also looked at Y". Nothing
 * here is invented: every suggestion is a real, existing product from the database.
 */
@RestController
@CrossOrigin
@RequestMapping("/api/products")
public class RelatedProductsController {

    private static final int MAX_RELATED = 6;

    // category -> categories whose products make sense to suggest alongside it (accessories,
    // complements, or just "people shopping for one also look at the other"). Edit freely —
    // this is the only place that needs to change to adjust suggestions.
    private static final Map<String, List<String>> COMPLEMENTS = Map.ofEntries(
            Map.entry("Mobile", List.of("Headphone", "Electronics")),
            Map.entry("Laptop", List.of("Headphone", "Electronics")),
            Map.entry("Headphone", List.of("Mobile", "Electronics")),
            Map.entry("Electronics", List.of("Mobile", "Headphone")),
            Map.entry("Shoes", List.of("Fashion")),
            Map.entry("Fashion", List.of("Shoes")),
            Map.entry("Fans", List.of("Electronics")),
            Map.entry("Toys", List.of("Toys"))
    );

    @Autowired
    private ProductRepo productRepo;

    // GET /api/products/{id}/related
    @GetMapping("/{id}/related")
    public ResponseEntity<?> related(@PathVariable int id) {
        Optional<Product> current = productRepo.findById(id);
        if (current.isEmpty()) return new ResponseEntity<>("Product not found", HttpStatus.NOT_FOUND);

        Product product = current.get();
        List<Product> catalogue = productRepo.findAll();

        List<String> complementCategories = COMPLEMENTS.getOrDefault(safe(product.getCategory()), List.of());

        // 1) same brand, same category — the closest alternative
        // 2) same category, any brand — other options in the same kind of product
        // 3) complementary categories — accessories / things bought alongside this one
        List<Product> sameBrand = filterOut(catalogue, product, p ->
                sameCategory(p, product) && safe(p.getBrand()).equalsIgnoreCase(safe(product.getBrand())));
        List<Product> sameCategory = filterOut(catalogue, product, p -> sameCategory(p, product));
        List<Product> complementary = filterOut(catalogue, product, p ->
                complementCategories.stream().anyMatch(c -> c.equalsIgnoreCase(safe(p.getCategory()))));

        LinkedHashMap<Integer, Product> ordered = new LinkedHashMap<>();
        for (Product p : sameBrand) ordered.putIfAbsent(p.getId(), p);
        for (Product p : complementary) ordered.putIfAbsent(p.getId(), p);
        for (Product p : sameCategory) ordered.putIfAbsent(p.getId(), p);

        List<Product> result = ordered.values().stream().limit(MAX_RELATED).collect(Collectors.toList());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    private List<Product> filterOut(List<Product> catalogue, Product current, java.util.function.Predicate<Product> matcher) {
        return catalogue.stream()
                .filter(p -> p.getId() != current.getId())
                .filter(matcher)
                .filter(p -> Boolean.TRUE.equals(p.getProductAvailable()) && p.getStockQuantity() > 0)
                .collect(Collectors.toList());
    }

    private boolean sameCategory(Product a, Product b) {
        return safe(a.getCategory()).equalsIgnoreCase(safe(b.getCategory()));
    }

    private String safe(String s) { return s == null ? "" : s; }
}
