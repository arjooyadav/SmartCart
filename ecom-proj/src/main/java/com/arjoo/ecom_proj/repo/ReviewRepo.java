package com.arjoo.ecom_proj.repo;

import com.arjoo.ecom_proj.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepo extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByCreatedAtDesc(int productId);
}
