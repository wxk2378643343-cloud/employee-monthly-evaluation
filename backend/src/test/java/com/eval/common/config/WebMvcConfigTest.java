package com.eval.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class WebMvcConfigTest {

    @Test
    void addCorsMappings() {
        WebMvcConfig config = new WebMvcConfig();
        assertDoesNotThrow(() -> config.addCorsMappings(new CorsRegistry()));
    }
}
