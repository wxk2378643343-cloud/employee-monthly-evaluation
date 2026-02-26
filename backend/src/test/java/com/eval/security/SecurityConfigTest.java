package com.eval.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityConfigTest {

    @Test
    void passwordEncoderBean() {
        SecurityConfig config = new SecurityConfig(mock(JwtAuthenticationFilter.class), new ObjectMapper());
        PasswordEncoder encoder = config.passwordEncoder();
        assertNotNull(encoder);
        assertTrue(encoder.matches("123", encoder.encode("123")));
    }

    @Test
    void authenticationManagerBean() throws Exception {
        SecurityConfig config = new SecurityConfig(mock(JwtAuthenticationFilter.class), new ObjectMapper());
        AuthenticationConfiguration authenticationConfiguration = mock(AuthenticationConfiguration.class);
        AuthenticationManager manager = mock(AuthenticationManager.class);
        when(authenticationConfiguration.getAuthenticationManager()).thenReturn(manager);
        assertSame(manager, config.authenticationManager(authenticationConfiguration));
    }
}
