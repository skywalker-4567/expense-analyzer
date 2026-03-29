package com.expenseanalyzer.repository;

import com.expenseanalyzer.entity.EmailExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailExpenseRepository extends JpaRepository<EmailExpense, Long> {

    List<EmailExpense> findByUserIdAndDetectedFalse(Long userId);

    boolean existsByEmailId(String emailId); // prevents duplicate email processing

    List<EmailExpense> findByUserId(Long userId);
}