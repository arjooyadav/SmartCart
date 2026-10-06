package com.arjoo.ecom_proj.config;

import com.arjoo.ecom_proj.model.Product;
import com.arjoo.ecom_proj.repo.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Fills an empty store with a real starter catalogue — several brands in every category — so
 * the AI assistant, search, and comparison features all have something genuine to work with from
 * the first run. Only runs once: if the product table already has anything in it (including
 * products you've added or edited yourself), this does nothing and leaves your data alone.
 *
 * Everything seeded here is a completely normal product: admins can edit, reprice, restock,
 * discount or delete any of it from the existing Admin dashboard exactly like a product added by
 * hand. Nothing about these rows is special or protected.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private ProductRepo productRepo;

    private record Seed(String name, String brand, String category, double price, int stock,
                         String description, double discountPercent, String color,
                         Map<String, String> specs) {
    }

    @Override
    public void run(String... args) {
        if (productRepo.count() > 0) return; // real data already exists — never touch it

        List<Seed> seeds = new ArrayList<>();
        seeds.addAll(mobiles());
        seeds.addAll(headphones());
        seeds.addAll(laptops());
        seeds.addAll(shoes());
        seeds.addAll(fans());
        seeds.addAll(electronics());
        seeds.addAll(fashion());
        seeds.addAll(toys());

        for (Seed s : seeds) {
            Product p = new Product();
            p.setName(s.name());
            p.setBrand(s.brand());
            p.setCategory(s.category());
            p.setPrice(BigDecimal.valueOf(s.price()));
            p.setStockQuantity(s.stock());
            p.setProductAvailable(s.stock() > 0);
            p.setDescription(s.description());
            p.setDiscountPercent(s.discountPercent());
            p.setReleaseDate(new Date());
            p.setSpecifications(s.specs());
            byte[] svg = placeholderImage(s.color(), s.category());
            p.setImageName("placeholder.svg");
            p.setImageType("image/svg+xml");
            p.setImageData(svg);
            productRepo.save(p);
        }

        System.out.println("SmartCart AI: seeded " + seeds.size() + " starter products across "
                + seeds.stream().map(Seed::category).distinct().count() + " categories.");
    }

    private List<Seed> mobiles() {
        String cat = "Mobile";
        return List.of(
                new Seed("Galaxy S24 Ultra", "Samsung", cat, 129999, 14,
                        "Flagship Android phone with a 200MP main camera, 5000mAh battery and a 120Hz AMOLED display.",
                        5, "#1d4ed8", specs("camera", "200MP", "battery", "5000mAh", "performance", "Snapdragon 8 Gen 3",
                                "display", "120Hz AMOLED", "storage", "256GB", "ram", "12GB")),
                new Seed("iPhone 15 Pro", "Apple", cat, 134900, 10,
                        "Premium phone with a 48MP Pro camera system, titanium body and A17 Pro chip for fast performance.",
                        0, "#374151", specs("camera", "48MP Pro", "battery", "3274mAh", "performance", "A17 Pro",
                                "display", "120Hz OLED", "storage", "256GB", "ram", "8GB")),
                new Seed("OnePlus 12", "OnePlus", cat, 64999, 20,
                        "Fast all-rounder with a 50MP Hasselblad camera, 100W charging and a bright 120Hz display.",
                        8, "#b91c1c", specs("camera", "50MP Hasselblad", "battery", "5400mAh", "performance", "Snapdragon 8 Gen 3",
                                "display", "120Hz AMOLED", "storage", "256GB", "ram", "12GB")),
                new Seed("Xiaomi 14", "Xiaomi", cat, 54999, 22,
                        "Compact flagship with a 50MP Leica-tuned camera and strong daily performance at a lower price.",
                        10, "#ea580c", specs("camera", "50MP Leica", "battery", "4610mAh", "performance", "Snapdragon 8 Gen 3",
                                "display", "120Hz AMOLED", "storage", "128GB", "ram", "8GB")),
                new Seed("Galaxy M34 5G", "Samsung", cat, 17999, 35,
                        "Budget 5G phone with a 6000mAh battery for all-day use and a 50MP camera for everyday photos.",
                        12, "#1e3a8a", specs("camera", "50MP", "battery", "6000mAh", "performance", "Exynos 1280",
                                "display", "120Hz AMOLED", "storage", "128GB", "ram", "6GB"))
        );
    }

    private List<Seed> headphones() {
        String cat = "Headphone";
        return List.of(
                new Seed("WH-1000XM5", "Sony", cat, 29990, 18,
                        "Industry-leading active noise cancellation, 30-hour battery and rich, balanced sound.",
                        10, "#111827", specs("sound", "Hi-Res Audio", "battery", "30 hours", "anc", "Industry-leading ANC", "comfort", "Soft-fit leather")),
                new Seed("QuietComfort Ultra", "Bose", cat, 34990, 9,
                        "Premium over-ear headphones with immersive spatial audio and best-in-class comfort for long sessions.",
                        0, "#1f2937", specs("sound", "Spatial Audio", "battery", "24 hours", "anc", "Adjustable ANC", "comfort", "Plush cushions")),
                new Seed("Tune 760NC", "JBL", cat, 4999, 40,
                        "Affordable wireless headphones with active noise cancellation and JBL's signature punchy bass.",
                        15, "#f97316", specs("sound", "Pure Bass", "battery", "35 hours", "anc", "Active NC", "comfort", "Lightweight")),
                new Seed("Rockerz 450", "boAt", cat, 1499, 60,
                        "Budget-friendly wireless headphones with deep bass and a long-lasting battery for daily commutes.",
                        20, "#dc2626", specs("sound", "Deep Bass", "battery", "15 hours", "comfort", "Padded ear cushions")),
                new Seed("Buds Pro 2", "Samsung", cat, 17999, 16,
                        "True wireless earbuds with intelligent ANC and 360 audio, built for all-day comfort.",
                        5, "#2563eb", specs("sound", "360 Audio", "battery", "8 hours + case", "anc", "Intelligent ANC", "comfort", "Ergonomic fit"))
        );
    }

    private List<Seed> laptops() {
        String cat = "Laptop";
        return List.of(
                new Seed("MacBook Air M2", "Apple", cat, 114900, 10,
                        "Thin and light laptop with the Apple M2 chip, fanless design and all-day battery life.",
                        0, "#374151", specs("performance", "Apple M2", "ram", "8GB", "storage", "256GB SSD", "display", "13.6-inch Liquid Retina", "battery", "18 hours")),
                new Seed("XPS 13", "Dell", cat, 99990, 8,
                        "Premium ultrabook with a compact InfinityEdge display and strong everyday performance.",
                        6, "#1e3a8a", specs("performance", "Intel Core i7", "ram", "16GB", "storage", "512GB SSD", "display", "13.4-inch FHD+")),
                new Seed("Pavilion 15", "HP", cat, 54990, 20,
                        "Reliable all-rounder laptop for study and work, with enough RAM for comfortable multitasking.",
                        10, "#0ea5e9", specs("performance", "Intel Core i5", "ram", "16GB", "storage", "512GB SSD", "display", "15.6-inch FHD")),
                new Seed("ThinkPad E14", "Lenovo", cat, 62990, 14,
                        "Business-grade laptop with a durable chassis, comfortable keyboard and solid battery backup.",
                        8, "#111827", specs("performance", "Intel Core i5", "ram", "16GB", "storage", "512GB SSD", "battery", "10 hours")),
                new Seed("ROG Strix G15", "Asus", cat, 89990, 11,
                        "Gaming laptop with a dedicated GPU and a 144Hz display built for fast, graphics-heavy games.",
                        7, "#7c2d12", specs("performance", "Ryzen 7", "gpu", "RTX 4060", "ram", "16GB", "storage", "1TB SSD", "display", "144Hz FHD"))
        );
    }

    private List<Seed> shoes() {
        String cat = "Shoes";
        return List.of(
                new Seed("Air Zoom Pegasus 40", "Nike", cat, 9995, 30,
                        "Responsive daily running shoe with Nike's React foam cushioning for long-distance comfort.",
                        10, "#16a34a", specs("comfort", "React foam cushioning", "use", "Running", "weight", "Lightweight")),
                new Seed("Ultraboost Light", "Adidas", cat, 17999, 18,
                        "Energy-returning running shoe with Boost midsole cushioning and a supportive Primeknit upper.",
                        5, "#111827", specs("comfort", "Boost midsole", "use", "Running", "weight", "Lightweight")),
                new Seed("RS-X Efekt", "Puma", cat, 7999, 25,
                        "Chunky retro-style sneaker built for everyday streetwear with extra cushioned comfort.",
                        15, "#dc2626", specs("comfort", "Extra cushioning", "use", "Casual", "weight", "Medium")),
                new Seed("Classic Leather", "Reebok", cat, 5999, 40,
                        "Timeless leather sneaker with a soft sockliner, great for everyday casual wear.",
                        0, "#1d4ed8", specs("comfort", "Soft sockliner", "use", "Casual", "weight", "Medium")),
                new Seed("Gel-Kayano 30", "Asics", cat, 14999, 12,
                        "Stability running shoe with gel cushioning, designed for runners who need extra support.",
                        8, "#0891b2", specs("comfort", "Gel cushioning", "use", "Running", "weight", "Medium"))
        );
    }

    private List<Seed> fans() {
        String cat = "Fans";
        return List.of(
                new Seed("Stealth Air 1200mm", "Havells", cat, 2899, 24,
                        "High-speed ceiling fan with a sleek design and strong air delivery for large rooms.",
                        10, "#334155", specs("airflow", "230 RPM", "speed", "High", "sweep", "1200mm")),
                new Seed("Frore 1200mm", "Bajaj", cat, 2399, 30,
                        "Energy-efficient ceiling fan offering reliable airflow at a budget-friendly price.",
                        12, "#0f766e", specs("airflow", "210 RPM", "speed", "Medium-High", "sweep", "1200mm")),
                new Seed("Aeroslim 1200mm", "Orient Electric", cat, 3299, 16,
                        "Premium ultra-slim ceiling fan with BLDC motor technology for lower power consumption.",
                        5, "#7c3aed", specs("airflow", "220 RPM", "speed", "High", "sweep", "1200mm", "power", "BLDC motor")),
                new Seed("Energion High Speed", "Crompton", cat, 1999, 35,
                        "Dependable everyday ceiling fan built for strong, consistent airflow in Indian summers.",
                        8, "#be185d", specs("airflow", "215 RPM", "speed", "High", "sweep", "1200mm")),
                new Seed("Breezer Table Fan", "Usha", cat, 1799, 20,
                        "Compact table fan with adjustable tilt, ideal for desks and small rooms.",
                        0, "#ca8a04", specs("airflow", "2200 RPM", "speed", "3-speed", "type", "Table fan"))
        );
    }

    private List<Seed> electronics() {
        String cat = "Electronics";
        return List.of(
                new Seed("Watch SE (2nd Gen)", "Apple", cat, 29900, 15,
                        "Smartwatch with heart-rate and sleep tracking, crash detection and a bright always-on-ready display.",
                        5, "#111827", specs("battery", "18 hours", "features", "Heart rate, sleep tracking")),
                new Seed("Galaxy Watch 6", "Samsung", cat, 27999, 13,
                        "Advanced fitness smartwatch with body composition analysis and a vivid AMOLED display.",
                        8, "#1d4ed8", specs("battery", "40 hours", "features", "Body composition, GPS")),
                new Seed("Mi Smart Band 8", "Xiaomi", cat, 2999, 45,
                        "Affordable fitness band with heart-rate tracking, SpO2 monitoring and a two-week battery life.",
                        10, "#ea580c", specs("battery", "14 days", "features", "Heart rate, SpO2")),
                new Seed("Charge 6", "Fitbit", cat, 14999, 10,
                        "Fitness tracker with built-in GPS, heart-rate tracking and up to 7 days of battery life.",
                        0, "#16a34a", specs("battery", "7 days", "features", "Built-in GPS, heart rate"))
        );
    }

    private List<Seed> fashion() {
        String cat = "Fashion";
        return List.of(
                new Seed("Trucker Denim Jacket", "Levi's", cat, 4999, 22,
                        "Classic denim jacket with a timeless fit, made from durable cotton denim.",
                        10, "#1e3a8a", specs("material", "Cotton denim", "fit", "Regular")),
                new Seed("Relaxed Cotton Tee", "H&M", cat, 799, 60,
                        "Soft, breathable cotton t-shirt in a relaxed everyday fit.",
                        0, "#64748b", specs("material", "100% Cotton", "fit", "Relaxed")),
                new Seed("Slim Fit Formal Shirt", "Zara", cat, 2999, 18,
                        "Crisp formal shirt with a tailored slim fit, suitable for office and formal occasions.",
                        15, "#0f172a", specs("material", "Cotton blend", "fit", "Slim")),
                new Seed("Chino Trousers", "Allen Solly", cat, 1999, 25,
                        "Smart-casual chino trousers with a comfortable stretch fit.",
                        5, "#78350f", specs("material", "Stretch cotton", "fit", "Tapered"))
        );
    }

    private List<Seed> toys() {
        String cat = "Toys";
        return List.of(
                new Seed("Classic Brick Box 1500pc", "LEGO", cat, 4999, 20,
                        "Large set of classic LEGO bricks in assorted colours for open-ended creative building.",
                        0, "#dc2626", specs("ageGroup", "4+", "pieces", "1500")),
                new Seed("Monster Trucks Track Set", "Hot Wheels", cat, 1999, 28,
                        "Die-cast track set with loops and ramps for high-speed Hot Wheels car stunts.",
                        10, "#f97316", specs("ageGroup", "3+", "pieces", "45")),
                new Seed("Dreamhouse Playset", "Barbie", cat, 8999, 9,
                        "Three-storey dollhouse playset with furniture and an elevator for imaginative play.",
                        5, "#ec4899", specs("ageGroup", "3+", "pieces", "1")),
                new Seed("Elite Dart Blaster", "Nerf", cat, 1499, 32,
                        "Fast-firing foam dart blaster for active indoor and outdoor play.",
                        0, "#16a34a", specs("ageGroup", "8+", "pieces", "1"))
        );
    }

    private Map<String, String> specs(String... kv) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) map.put(kv[i], kv[i + 1]);
        return map;
    }

    /** A simple solid-colour SVG placeholder so every seeded product has a real image to show,
     *  just like the frontend's own sample-data placeholders. Admins can replace it any time by
     *  editing the product and uploading a real photo. */
    private byte[] placeholderImage(String hexColor, String category) {
        String svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>"
                + "<rect width='400' height='300' fill='" + hexColor + "'/>"
                + "<text x='200' y='160' font-size='28' font-family='sans-serif' fill='white' "
                + "text-anchor='middle' opacity='0.85'>" + category + "</text>"
                + "</svg>";
        return svg.getBytes(StandardCharsets.UTF_8);
    }
}
