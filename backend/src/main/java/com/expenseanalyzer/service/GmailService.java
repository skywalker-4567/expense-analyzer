package com.expenseanalyzer.service;

import com.expenseanalyzer.config.GoogleOAuthConfig;
import com.expenseanalyzer.entity.EmailExpense;
import com.expenseanalyzer.entity.User;
import com.expenseanalyzer.repository.EmailExpenseRepository;
import com.expenseanalyzer.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class GmailService {

    private final GoogleOAuthConfig oAuthConfig;
    private final EmailExpenseRepository emailExpenseRepository;
    private final UserRepository userRepository;

    private final Map<Long, String> tokenStore = new ConcurrentHashMap<>();

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:₹|Rs\\.?\\s*)(\\d+(?:\\.\\d{1,2})?)|(?:(\\d+(?:\\.\\d{1,2})?)\\s*INR)",
            Pattern.CASE_INSENSITIVE
    );

    public String buildAuthUrl(Long userId) {
        String scopes = String.join(" ", GoogleOAuthConfig.SCOPES);
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + oAuthConfig.getClientId()
                + "&redirect_uri=" + oAuthConfig.getRedirectUri()
                + "&response_type=code"
                + "&scope=" + scopes.replace(" ", "%20")
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=" + userId;
    }

    public void exchangeCodeAndStoreToken(String code, Long userId) throws Exception {
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                JacksonFactory.getDefaultInstance(),
                oAuthConfig.getClientId(),
                oAuthConfig.getClientSecret(),
                code,
                oAuthConfig.getRedirectUri()
        ).execute();

        tokenStore.put(userId, tokenResponse.getAccessToken());
        log.info("Access token stored for userId: {}", userId);
    }

    public int fetchAndSaveEmails(Long userId) throws Exception {
        String accessToken = tokenStore.get(userId);
        if (accessToken == null) {
            throw new RuntimeException("Gmail not connected for this user");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Gmail gmail = buildGmailClient(accessToken);

        ListMessagesResponse listResponse = gmail.users()
                .messages()
                .list("me")
                .setMaxResults(10L)
                .execute();

        List<Message> messages = listResponse.getMessages();
        if (messages == null || messages.isEmpty()) {
            return 0;
        }

        int saved = 0;
        for (Message msg : messages) {
            if (emailExpenseRepository.existsByEmailId(msg.getId())) {
                continue;
            }

            Message fullMessage = gmail.users()
                    .messages()
                    .get("me", msg.getId())
                    .setFormat("metadata")
                    .execute();

            String snippet = fullMessage.getSnippet();
            BigDecimal amount = extractAmount(snippet);

            EmailExpense emailExpense = EmailExpense.builder()
                    .user(user)
                    .emailId(msg.getId())
                    .extractedText(snippet)
                    .amount(amount)
                    .detected(amount != null)
                    .build();

            emailExpenseRepository.save(emailExpense);
            saved++;
        }

        return saved;
    }

    private BigDecimal extractAmount(String text) {
        if (text == null || text.isBlank()) return null;

        Matcher matcher = AMOUNT_PATTERN.matcher(text);
        if (matcher.find()) {
            String raw = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            try {
                return new BigDecimal(raw);
            } catch (NumberFormatException e) {
                log.warn("Failed to parse amount from: {}", raw);
            }
        }
        return null;
    }

    private Gmail buildGmailClient(String accessToken) {
        GoogleCredentials credentials = GoogleCredentials.create(
                new AccessToken(accessToken, new Date(System.currentTimeMillis() + 3600000))
        );

        return new Gmail.Builder(
                new NetHttpTransport(),
                JacksonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials)
        ).setApplicationName("expense-analyzer").build();
    }
}