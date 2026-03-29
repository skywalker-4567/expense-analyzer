package com.expenseanalyzer.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Slf4j
@Component
public class MlServiceClient {

    private final WebClient webClient;

    public MlServiceClient(@Value("${ml.service.url}") String mlServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(mlServiceUrl)
                .build();
    }

    public String predictCategory(String description) {
        try {
            Map<?, ?> response = webClient.post()
                    .uri("/predict-category")
                    .bodyValue(Map.of("description", description))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("category")) {
                return (String) response.get("category");
            }

            return "Other";

        } catch (Exception e) {
            log.warn("ML service unavailable. Defaulting to 'Other'. Reason: {}",
                    e.getMessage());
            return "Other";
        }
    }
}