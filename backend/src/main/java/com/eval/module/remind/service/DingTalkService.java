package com.eval.module.remind.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class DingTalkService {

    @Value("${dingtalk.webhook-url:}")
    private String webhookUrl;

    @Resource
    private RestTemplate restTemplate;

    public boolean sendTextMessage(String content) {
        if (webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("DingTalk webhook URL not configured, skipping notification");
            return false;
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("msgtype", "text");
            Map<String, String> text = new HashMap<>();
            text.put("content", content);
            body.put("text", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.postForEntity(webhookUrl, request, String.class);
            return true;
        } catch (Exception e) {
            log.error("Failed to send DingTalk message", e);
            return false;
        }
    }
}
