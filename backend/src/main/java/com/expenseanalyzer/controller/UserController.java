package com.expenseanalyzer.controller;

import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.UserRepository;
import com.expenseanalyzer.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Long userId = jwtUtil.extractUserId(authHeader.substring(7));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "joinedAt", user.getCreatedAt().toString(),
                "totalExpenses", user.getExpenses().size(),
                "totalBudgets", user.getBudgets().size()
        ));
    }
}