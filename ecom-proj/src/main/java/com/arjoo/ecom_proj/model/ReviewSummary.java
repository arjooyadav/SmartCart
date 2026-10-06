package com.arjoo.ecom_proj.model;

import java.util.List;

/** What GET /api/reviews/product/{id} returns: the average rating, how many reviews, and the reviews themselves. */
public class ReviewSummary {
    private double average;
    private int count;
    private List<Review> reviews;

    public ReviewSummary(double average, int count, List<Review> reviews) {
        this.average = average;
        this.count = count;
        this.reviews = reviews;
    }

    public double getAverage() { return average; }
    public int getCount() { return count; }
    public List<Review> getReviews() { return reviews; }
}
