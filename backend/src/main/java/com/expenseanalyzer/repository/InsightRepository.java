package com.expenseanalyzer.repository;

import com.expenseanalyzer.entity.Insight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsightRepository extends JpaRepository<Insight, Long> {

    boolean existsByUserIdAndMessage(Long userId, String message);
    List<Insight> findByUserIdOrderByCreatedAtDesc(Long userId);
}