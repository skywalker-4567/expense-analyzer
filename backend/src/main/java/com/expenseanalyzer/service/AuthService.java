package com.expenseanalyzer.service;

import com.expenseanalyzer.dto.request.LoginRequest;
import com.expenseanalyzer.dto.request.RegisterRequest;
import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.UserRepository;
import com.expenseanalyzer.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail());

        return Map.of(
                "message", "User registered successfully",
                "token", token,
                "userId", saved.getId()
        );
    }

    public Map<String, Object> login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        try {
            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            return Map.of(
                    "message", "Login successful",
                    "token", token,
                    "userId", user.getId()
            );
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuthService.class).error("Token generation failed", e);
            throw e;
        }
    }
}