package com.arjoo.ecom_proj.controller;

import com.arjoo.ecom_proj.model.Review;
import com.arjoo.ecom_proj.model.ReviewSummary;
import com.arjoo.ecom_proj.repo.ReviewRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepo reviewRepo;

    // GET /api/reviews/product/5 — every review for a product, newest first, plus the average rating.
    @GetMapping("/product/{productId}")
    public ReviewSummary getForProduct(@PathVariable int productId) {
        List<Review> reviews = reviewRepo.findByProductIdOrderByCreatedAtDesc(productId);
        double average = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        return new ReviewSummary(Math.round(average * 10) / 10.0, reviews.size(), reviews);
    }

    // POST /api/reviews — body: { productId, userName, userEmail, rating (1-5), comment }
    @PostMapping
    public ResponseEntity<?> add(@RequestBody Review review) {
        if (review.getRating() < 1 || review.getRating() > 5) {
            return new ResponseEntity<>("Rating must be between 1 and 5", HttpStatus.BAD_REQUEST);
        }
        if (review.getUserName() == null || review.getUserName().isBlank()) {
            return new ResponseEntity<>("A name is required", HttpStatus.BAD_REQUEST);
        }
        review.setId(null);
        Review saved = reviewRepo.save(review);
        return new ResponseEntity<>(saved, HttpStatus.OK);
    }

    // DELETE /api/reviews/9 — lets an admin remove an inappropriate review.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reviewRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
