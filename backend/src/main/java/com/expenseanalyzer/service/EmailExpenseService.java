package com.expenseanalyzer.service;

import com.expenseanalyzer.client.MlServiceClient;
import com.expenseanalyzer.entity.EmailExpense;
import com.expenseanalyzer.entity.Expense;
import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.EmailExpenseRepository;
import com.expenseanalyzer.repository.ExpenseRepository;
import com.expenseanalyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailExpenseService {

    private final EmailExpenseRepository emailExpenseRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final MlServiceClient mlServiceClient;

    public Expense convertToExpense(Long emailExpenseId, Long userId) {
        EmailExpense emailExpense = emailExpenseRepository.findById(emailExpenseId)
                .orElseThrow(() -> new RuntimeException("Email expense not found"));

        if (emailExpense.getAmount() == null) {
            throw new RuntimeException("Cannot convert: no amount detected in this email");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String category = mlServiceClient.predictCategory(emailExpense.getExtractedText());

        Expense expense = Expense.builder()
                .user(user)
                .amount(emailExpense.getAmount())
                .description(emailExpense.getExtractedText())
                .expenseDate(LocalDate.now())
                .category(category)
                .source("EMAIL")
                .build();

        emailExpense.setDetected(true);
        emailExpenseRepository.save(emailExpense);

        return expenseRepository.save(expense);
    }
    public List<EmailExpense> getEmailExpenses(Long userId) {
        return emailExpenseRepository.findByUserId(userId);
    }
}