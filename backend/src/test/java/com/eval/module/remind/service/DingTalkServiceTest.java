package com.eval.module.remind.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DingTalkServiceTest {

    @Test
    void returnsFalseWhenWebhookMissing() {
        DingTalkService service = new DingTalkService();
        ReflectionTestUtils.setField(service, "webhookUrl", "");
        ReflectionTestUtils.setField(service, "restTemplate", mock(RestTemplate.class));
        assertFalse(service.sendTextMessage("x"));
    }

    @Test
    void returnsTrueWhenPostSuccess() {
        DingTalkService service = new DingTalkService();
        RestTemplate restTemplate = mock(RestTemplate.class);
        ReflectionTestUtils.setField(service, "webhookUrl", "http://test");
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        assertTrue(service.sendTextMessage("x"));
        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void returnsFalseWhenPostThrows() {
        DingTalkService service = new DingTalkService();
        RestTemplate restTemplate = mock(RestTemplate.class);
        doThrow(new RuntimeException("x")).when(restTemplate).postForEntity(anyString(), any(), eq(String.class));
        ReflectionTestUtils.setField(service, "webhookUrl", "http://test");
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        assertFalse(service.sendTextMessage("x"));
    }
}
