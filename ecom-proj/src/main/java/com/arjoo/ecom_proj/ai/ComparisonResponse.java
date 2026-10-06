package com.arjoo.ecom_proj.ai;

import java.util.ArrayList;
import java.util.List;

/** Response returned by the comparison engine. */
public class ComparisonResponse {
    private String category;
    private String summary;
    private String recommendedProduct;
    private String reason;
    private List<String> caveats = new ArrayList<>();
    private List<ComparisonProduct> products = new ArrayList<>();
    private ComparisonCriteria interpreted;

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getRecommendedProduct() { return recommendedProduct; }
    public void setRecommendedProduct(String recommendedProduct) { this.recommendedProduct = recommendedProduct; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public List<String> getCaveats() { return caveats; }
    public void setCaveats(List<String> caveats) { this.caveats = caveats; }
    public List<ComparisonProduct> getProducts() { return products; }
    public void setProducts(List<ComparisonProduct> products) { this.products = products; }
    public ComparisonCriteria getInterpreted() { return interpreted; }
    public void setInterpreted(ComparisonCriteria interpreted) { this.interpreted = interpreted; }
}
