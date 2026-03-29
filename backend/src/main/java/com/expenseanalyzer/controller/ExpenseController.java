package com.expenseanalyzer.controller;

import com.expenseanalyzer.dto.request.ExpenseRequest;
import com.expenseanalyzer.dto.response.ExpenseSummaryResponse;
import com.expenseanalyzer.entity.Expense;
import com.expenseanalyzer.security.JwtUtil;
import com.expenseanalyzer.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping
    public ResponseEntity<?> createExpense(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ExpenseRequest request
    ) {
        Long userId = extractUserId(authHeader);
        Expense expense = expenseService.createExpense(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }

    @GetMapping
    public ResponseEntity<?> getExpenses(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam String month
    ) {
        Long userId = extractUserId(authHeader);
        Page<Expense> expenses = expenseService.getExpenses(userId, page, size, month);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String month
    ) {
        Long userId = extractUserId(authHeader);
        ExpenseSummaryResponse summary = expenseService.getSummary(userId, month);
        return ResponseEntity.ok(summary);
    }
}