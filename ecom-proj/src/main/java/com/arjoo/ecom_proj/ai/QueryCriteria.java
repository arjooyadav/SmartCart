package com.arjoo.ecom_proj.ai;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * What we understood from the shopper's sentence, e.g.
 * "I need a laptop under 70000 for java development and gaming"
 *   -> category="Laptop", maxPrice=70000, keywords=["java","development","gaming"]
 *
 * Nothing here is guessed from thin air — every field is either null/empty
 * (meaning "the shopper didn't say") or copied straight from their words.
 */
public class QueryCriteria {

    private BigDecimal maxPrice;
    private BigDecimal minPrice;
    private String category;   // must exactly match a category that exists in the database
    private String brand;      // must exactly match a brand that exists in the database
    private final List<String> keywords = new ArrayList<>(); // free-text signals, e.g. "gaming", "java"

    public BigDecimal getMaxPrice() { return maxPrice; }
    public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public List<String> getKeywords() { return keywords; }

    public boolean isEmpty() {
        return maxPrice == null && minPrice == null && category == null && brand == null && keywords.isEmpty();
    }
}
