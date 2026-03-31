package com.expenseanalyzer.controller;

import com.expenseanalyzer.security.JwtUtil;
import com.expenseanalyzer.service.GmailService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/integrations/gmail")
@RequiredArgsConstructor
public class GmailController {

    private final GmailService gmailService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @GetMapping("/connect")
    public ResponseEntity<?> connect(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = extractUserId(authHeader); // extractUserId already guards null now
        String authUrl = gmailService.buildAuthUrl(userId);
        return ResponseEntity.ok(Map.of("url", authUrl));
    }

    @GetMapping("/callback")
    public void callback(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletResponse response
    ) throws IOException {
        try {
            Long userId = Long.parseLong(state);
            gmailService.exchangeCodeAndStoreToken(code, userId);
            response.sendRedirect("https://expenso-frontend-bwde.onrender.com/gmail?gmail=connected");
        } catch (Exception e) {
            response.sendRedirect("https://expenso-frontend-bwde.onrender.com/gmail?gmail=error");
        }
    }

    @PostMapping("/fetch")
    public ResponseEntity<?> fetchEmails(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Long userId = extractUserId(authHeader);
            int count = gmailService.fetchAndSaveEmails(userId);
            return ResponseEntity.ok(Map.of(
                    "message", "Emails fetched and processed",
                    "savedCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}