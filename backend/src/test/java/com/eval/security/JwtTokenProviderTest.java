package com.eval.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        String secret = Base64.getEncoder().encodeToString("01234567890123456789012345678901".getBytes());
        ReflectionTestUtils.setField(provider, "secret", secret);
        ReflectionTestUtils.setField(provider, "expiration", 60_000L);
        provider.init();
    }

    @Test
    void generateAndParseToken() {
        String token = provider.generateToken(1L, "u", "ADMIN");
        assertNotNull(token);
        assertEquals(1L, provider.getUserIdFromToken(token));
        assertEquals("u", provider.getUsernameFromToken(token));
        assertEquals("ADMIN", provider.getRoleFromToken(token));
        assertTrue(provider.validateToken(token));
    }

    @Test
    void validateTokenFalseForInvalidToken() {
        assertFalse(provider.validateToken("bad-token"));
    }
}
