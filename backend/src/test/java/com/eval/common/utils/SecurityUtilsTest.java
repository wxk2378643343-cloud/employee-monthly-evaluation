package com.eval.common.utils;

import com.eval.common.exception.BusinessException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

class SecurityUtilsTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserIdThrowsWhenNoAuth() {
        assertThrows(BusinessException.class, SecurityUtils::getCurrentUserId);
    }

    @Test
    void getCurrentUserIdFromLongPrincipal() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken(7L, null, "ROLE_TEST");
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertEquals(7L, SecurityUtils.getCurrentUserId());
    }

    @Test
    void getCurrentUserIdFromStringPrincipal() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("9", null, "ROLE_TEST");
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertEquals(9L, SecurityUtils.getCurrentUserId());
    }

    @Test
    void getCurrentUserIdThrowsWhenPrincipalNotNumber() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("abc", null, "ROLE_TEST");
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertThrows(BusinessException.class, SecurityUtils::getCurrentUserId);
    }

    @Test
    void getCurrentUsernameThrowsWhenNoAuth() {
        assertThrows(BusinessException.class, SecurityUtils::getCurrentUsername);
    }

    @Test
    void getCurrentUsernameFromAuth() {
        TestingAuthenticationToken auth = new TestingAuthenticationToken("10", null, "ROLE_TEST");
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertEquals("10", SecurityUtils.getCurrentUsername());
    }
}
