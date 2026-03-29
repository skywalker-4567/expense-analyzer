package com.expenseanalyzer.scheduler;

import com.expenseanalyzer.repository.UserRepository;
import com.expenseanalyzer.service.InsightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InsightScheduler {

    private final InsightService insightService;
    private final UserRepository userRepository;

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void generateInsightsForAllUsers() {
        log.info("Running scheduled insight generation...");

        userRepository.findAll().forEach(user -> {
            try {
                insightService.generateInsightsForUser(user.getId());
            } catch (Exception e) {
                log.error("Failed to generate insights for userId: {}. Reason: {}",
                        user.getId(), e.getMessage());
            }
        });

        log.info("Scheduled insight generation complete.");
    }
}