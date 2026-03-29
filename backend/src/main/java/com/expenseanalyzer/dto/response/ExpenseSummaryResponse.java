package com.expenseanalyzer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
public class ExpenseSummaryResponse {
    private BigDecimal total;
    private Map<String, BigDecimal> categoryBreakdown;
}