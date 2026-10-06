package com.arjoo.ecom_proj.controller;

import com.arjoo.ecom_proj.ai.AiChatRequest;
import com.arjoo.ecom_proj.ai.AiChatResponse;
import com.arjoo.ecom_proj.ai.AiRecommendationService;
import com.arjoo.ecom_proj.ai.ComparisonResponse;
import com.arjoo.ecom_proj.ai.ProductComparisonService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@RequestMapping("/api/ai")
public class AiController {
    private final AiRecommendationService aiRecommendationService;
    private final ProductComparisonService productComparisonService;

    public AiController(AiRecommendationService aiRecommendationService,
                        ProductComparisonService productComparisonService) {
        this.aiRecommendationService = aiRecommendationService;
        this.productComparisonService = productComparisonService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody AiChatRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return new ResponseEntity<>("Message can't be empty", HttpStatus.BAD_REQUEST);
        }
        AiChatResponse response = aiRecommendationService.chat(request.getMessage());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /** Explicit comparison endpoint for compare buttons / future React comparison UI. */
    @PostMapping("/compare")
    public ResponseEntity<?> compare(@RequestBody AiChatRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return new ResponseEntity<>("Comparison request can't be empty", HttpStatus.BAD_REQUEST);
        }
        ComparisonResponse response = productComparisonService.compare(request.getMessage());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
