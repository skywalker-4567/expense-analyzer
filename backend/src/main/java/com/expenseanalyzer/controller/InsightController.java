package com.expenseanalyzer.controller;

import com.expenseanalyzer.entity.Insight;
import com.expenseanalyzer.security.JwtUtil;
import com.expenseanalyzer.service.InsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @GetMapping
    public ResponseEntity<?> getInsights(
            @RequestHeader("Authorization") String authHeader
    ) {
        Long userId = extractUserId(authHeader);
        List<Insight> insights = insightService.getInsights(userId);
        return ResponseEntity.ok(insights);
    }
}