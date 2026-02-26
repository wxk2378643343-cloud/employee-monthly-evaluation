package com.eval.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;

class RestTemplateConfigTest {

    @Test
    void restTemplateBean() {
        RestTemplate template = new RestTemplateConfig().restTemplate();
        assertNotNull(template);
        assertTrue(template.getRequestFactory() instanceof SimpleClientHttpRequestFactory);
    }
}
