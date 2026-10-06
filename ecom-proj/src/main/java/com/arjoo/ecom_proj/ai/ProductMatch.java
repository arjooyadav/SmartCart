package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;

import java.util.ArrayList;
import java.util.List;

/** A product the assistant is recommending, plus the plain-language reasons why. */
public class ProductMatch {

    private final Product product;
    private final List<String> reasons = new ArrayList<>();
    private int score;

    public ProductMatch(Product product) {
        this.product = product;
    }

    public Product getProduct() { return product; }
    public List<String> getReasons() { return reasons; }
    public int getScore() { return score; }

    public void addReason(String reason, int points) {
        reasons.add(reason);
        score += points;
    }
}
