package com.expenseanalyzer.service;

import com.expenseanalyzer.entity.Insight;
import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.BudgetRepository;
import com.expenseanalyzer.repository.ExpenseRepository;
import com.expenseanalyzer.repository.InsightRepository;
import com.expenseanalyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsightService {

    private final InsightRepository insightRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter MONTH_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM");

    public List<Insight> getInsights(Long userId) {
        return insightRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void generateInsightsForUser(Long userId) {
        String currentMonth = LocalDate.now().format(MONTH_FORMAT);

        YearMonth ym = YearMonth.parse(currentMonth);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal total = expenseRepository
                .sumAmountByUserIdAndDateRange(userId, start, end);

        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) return;

        // Insight 1: Total spend
        saveIfNotDuplicate(user,
                "Your total spend this month is ₹" + total + ".");

        // Insight 2: Top category
        List<Object[]> breakdown = expenseRepository
                .findCategoryBreakdownByUserIdAndDateRange(userId, start, end);

        if (!breakdown.isEmpty()) {
            String topCategory = (String) breakdown.get(0)[0];
            BigDecimal topAmount = (BigDecimal) breakdown.get(0)[1];
            saveIfNotDuplicate(user,
                    "You spent the most on " + topCategory +
                            " this month: ₹" + topAmount + ".");
        }

        // Insight 3: Budget breach
        budgetRepository.findByUserIdAndMonth(userId, currentMonth)
                .forEach(budget -> {
                    BigDecimal spent = expenseRepository
                            .sumAmountByUserIdAndDateRange(userId, start, end);
                    if (spent != null &&
                            spent.compareTo(budget.getLimitAmount()) > 0) {
                        saveIfNotDuplicate(user,
                                "You have exceeded your " + budget.getCategory() +
                                        " budget of ₹" + budget.getLimitAmount() +
                                        " this month.");
                    }
                });

        log.info("Insights generated for userId: {}", userId);
    }

    private void saveIfNotDuplicate(User user, String message) {
        if (!insightRepository.existsByUserIdAndMessage(user.getId(), message)) {
            insightRepository.save(
                    Insight.builder()
                            .user(user)
                            .message(message)
                            .build()
            );
        }
    }
}