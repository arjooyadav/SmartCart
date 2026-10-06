package com.arjoo.ecom_proj.model;

import jakarta.persistence.*;   // Spring Boot 2.x: use javax.persistence.*

/** One row per (user, product). Hibernate creates the table automatically. */
@Entity
@Table(name = "cart_item", uniqueConstraints = @UniqueConstraint(columnNames = {"user_email", "product_id"}))
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    private int quantity;

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
