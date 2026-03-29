package com.expenseanalyzer.service;

import com.expenseanalyzer.dto.request.BudgetRequest;
import com.expenseanalyzer.entity.Budget;
import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.BudgetRepository;
import com.expenseanalyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    public Budget createBudget(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Budget budget = Budget.builder()
                .user(user)
                .category(request.getCategory())
                .limitAmount(request.getLimitAmount())
                .month(request.getMonth())
                .build();

        return budgetRepository.save(budget);
    }
}