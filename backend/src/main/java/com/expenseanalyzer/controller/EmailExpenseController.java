package com.expenseanalyzer.controller;

import com.expenseanalyzer.entity.Expense;
import com.expenseanalyzer.security.JwtUtil;
import com.expenseanalyzer.service.EmailExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email-expenses")
@RequiredArgsConstructor
public class EmailExpenseController {

    private final EmailExpenseService emailExpenseService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertToExpense(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = extractUserId(authHeader);
        Expense expense = emailExpenseService.convertToExpense(id, userId);
        return ResponseEntity.ok(Map.of(
                "message", "Email expense converted successfully",
                "expenseId", expense.getId()
        ));
    }
    @GetMapping
    public ResponseEntity<?> getEmailExpenses(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(emailExpenseService.getEmailExpenses(userId));
    }
}