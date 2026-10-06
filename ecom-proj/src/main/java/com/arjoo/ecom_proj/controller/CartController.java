package com.arjoo.ecom_proj.controller;

import com.arjoo.ecom_proj.model.CartItem;
import com.arjoo.ecom_proj.repo.CartItemRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class CartController {

    @Autowired
    private CartItemRepo repo;

    public record CartLine(Long productId, int quantity) {}   // needs Java 16+ (Spring Boot 3 = Java 17)

    // GET /api/cart?email=someone@example.com
    @GetMapping("/cart")
    public List<CartLine> getCart(@RequestParam String email) {
        return repo.findByUserEmail(email.trim().toLowerCase()).stream()
                .map(i -> new CartLine(i.getProductId(), i.getQuantity()))
                .toList();
    }

    // PUT /api/cart?email=...   body: [{"productId":1,"quantity":2}, ...]   (replaces that user's whole cart)
    @PutMapping("/cart")
    @Transactional
    public ResponseEntity<Void> saveCart(@RequestParam String email, @RequestBody List<CartLine> lines) {
        String owner = email.trim().toLowerCase();
        repo.deleteByUserEmail(owner);
        repo.flush();
        for (CartLine line : lines) {
            if (line.quantity() <= 0) continue;
            CartItem item = new CartItem();
            item.setUserEmail(owner);
            item.setProductId(line.productId());
            item.setQuantity(line.quantity());
            repo.save(item);
        }
        return ResponseEntity.ok().build();
    }
}
