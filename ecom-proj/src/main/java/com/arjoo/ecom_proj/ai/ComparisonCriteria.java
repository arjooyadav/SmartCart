package com.arjoo.ecom_proj.ai;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Structured comparison intent extracted from a shopper's request. */
public class ComparisonCriteria {
    private boolean comparisonRequested;
    private boolean bestMatchRequested;
    private String category;
    private String categoryFamily;
    private BigDecimal maxPrice;
    private BigDecimal minPrice;
    private String brand;
    private final List<String> productNames = new ArrayList<>();
    private final Map<String, Double> priorities = new LinkedHashMap<>();

    public boolean isComparisonRequested() { return comparisonRequested; }
    public void setComparisonRequested(boolean comparisonRequested) { this.comparisonRequested = comparisonRequested; }
    public boolean isBestMatchRequested() { return bestMatchRequested; }
    public void setBestMatchRequested(boolean bestMatchRequested) { this.bestMatchRequested = bestMatchRequested; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCategoryFamily() { return categoryFamily; }
    public void setCategoryFamily(String categoryFamily) { this.categoryFamily = categoryFamily; }
    public BigDecimal getMaxPrice() { return maxPrice; }
    public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public List<String> getProductNames() { return productNames; }
    public Map<String, Double> getPriorities() { return priorities; }
}
