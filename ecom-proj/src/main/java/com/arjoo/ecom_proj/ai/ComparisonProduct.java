package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;

import java.util.LinkedHashMap;
import java.util.Map;

/** A product plus the evidence-backed comparison score and strengths. */
public class ComparisonProduct {
    private Product product;
    private double score;
    private final Map<String, Double> criterionScores = new LinkedHashMap<>();
    private final Map<String, String> evidence = new LinkedHashMap<>();
    private final java.util.List<String> strengths = new java.util.ArrayList<>();
    private final java.util.List<String> limitations = new java.util.ArrayList<>();

    public ComparisonProduct() {}
    public ComparisonProduct(Product product) { this.product = product; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    public Map<String, Double> getCriterionScores() { return criterionScores; }
    public Map<String, String> getEvidence() { return evidence; }
    public java.util.List<String> getStrengths() { return strengths; }
    public java.util.List<String> getLimitations() { return limitations; }
}
