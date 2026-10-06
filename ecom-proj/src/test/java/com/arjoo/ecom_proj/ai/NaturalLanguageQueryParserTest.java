package com.arjoo.ecom_proj.ai;

import com.arjoo.ecom_proj.model.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class NaturalLanguageQueryParserTest {
    private final NaturalLanguageQueryParser parser = new NaturalLanguageQueryParser();

    @Test
    void phoneAliasResolvesToPhoneCategory() {
        ComparisonCriteria c = parser.parseComparison("best phone under 40000", List.of("Smartphones", "Laptops"), List.of(), List.of());
        assertEquals("Smartphones", c.getCategory());
        assertTrue(c.isBestMatchRequested());
        assertEquals(new BigDecimal("40000"), c.getMaxPrice());
    }

    @Test
    void namedProductsBecomeComparisonScope() {
        Product a = new Product(); a.setName("Phone A"); a.setCategory("Phones");
        Product b = new Product(); b.setName("Phone B"); b.setCategory("Phones");
        ComparisonCriteria c = parser.parseComparison("compare Phone A vs Phone B", List.of("Phones"), List.of(), List.of(a,b));
        assertTrue(c.isComparisonRequested());
        assertEquals("Phones", c.getCategory());
        assertEquals(2, c.getProductNames().size());
    }
}
