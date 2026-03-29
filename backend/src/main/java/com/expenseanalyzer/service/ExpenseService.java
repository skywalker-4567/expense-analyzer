package com.expenseanalyzer.service;

import com.expenseanalyzer.client.MlServiceClient;
import com.expenseanalyzer.dto.request.ExpenseRequest;
import com.expenseanalyzer.dto.response.ExpenseSummaryResponse;
import com.expenseanalyzer.entity.Expense;
import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.ExpenseRepository;
import com.expenseanalyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final MlServiceClient mlServiceClient;
    private final InsightService insightService;

    public Expense createExpense(Long userId, ExpenseRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String category = mlServiceClient.predictCategory(request.getDescription());

        Expense expense = Expense.builder()
                .user(user)
                .amount(request.getAmount())
                .description(request.getDescription())
                .expenseDate(request.getExpenseDate())
                .category(category)
                .source("MANUAL")
                .build();

        Expense saved = expenseRepository.save(expense);
        insightService.generateInsightsForUser(userId);
        return saved;
    }

    public Page<Expense> getExpenses(Long userId, int page, int size, String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        return expenseRepository.findByUserIdAndExpenseDateBetween(
                userId, start, end, PageRequest.of(page, size)
        );
    }

    public ExpenseSummaryResponse getSummary(Long userId, String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal total = expenseRepository
                .sumAmountByUserIdAndDateRange(userId, start, end);

        List<Object[]> breakdown = expenseRepository
                .findCategoryBreakdownByUserIdAndDateRange(userId, start, end);

        Map<String, BigDecimal> categoryBreakdown = new LinkedHashMap<>();
        for (Object[] row : breakdown) {
            categoryBreakdown.put((String) row[0], (BigDecimal) row[1]);
        }

        return new ExpenseSummaryResponse(total, categoryBreakdown);
    }
}