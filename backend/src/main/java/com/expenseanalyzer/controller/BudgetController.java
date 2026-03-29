package com.expenseanalyzer.controller;

import com.expenseanalyzer.dto.request.BudgetRequest;
import com.expenseanalyzer.entity.Budget;
import com.expenseanalyzer.security.JwtUtil;
import com.expenseanalyzer.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping
    public ResponseEntity<?> createBudget(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody BudgetRequest request
    ) {
        Long userId = extractUserId(authHeader);
        Budget budget = budgetService.createBudget(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(budget);
    }
}