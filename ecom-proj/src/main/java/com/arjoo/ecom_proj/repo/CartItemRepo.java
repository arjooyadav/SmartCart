package com.arjoo.ecom_proj.repo;

import com.arjoo.ecom_proj.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemRepo extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserEmail(String userEmail);
    void deleteByUserEmail(String userEmail);
}
