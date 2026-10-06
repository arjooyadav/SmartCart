package com.arjoo.ecom_proj.controller;

import com.arjoo.ecom_proj.model.Order;
import com.arjoo.ecom_proj.repo.OrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class OrderController {

    @Autowired
    private OrderRepo repo;

    // POST /api/orders — the frontend calls this once, right after checkout.
    @PostMapping("/orders")
    public Order create(@RequestBody Order order) {
        order.setId(null);                                  // always insert a new order, never overwrite one
        order.getItems().forEach(item -> item.setId(null));
        order.setItems(order.getItems());                   // re-links each item back to this order
        return repo.save(order);
    }

    // GET /api/orders — admin dashboard: every order from every shopper, newest first.
    @GetMapping("/orders")
    public List<Order> all() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    // GET /api/orders/mine?email=someone@example.com — optional: a shopper's own past orders.
    @GetMapping("/orders/mine")
    public List<Order> mine(@RequestParam String email) {
        return repo.findByUserEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
    }
}
