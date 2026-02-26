package com.eval.security;

import com.eval.module.system.service.PermissionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void setsAuthenticationWhenTokenValid() throws Exception {
        JwtTokenProvider provider = mock(JwtTokenProvider.class);
        PermissionService permissionService = mock(PermissionService.class);
        when(provider.validateToken("abc")).thenReturn(true);
        when(provider.getUserIdFromToken("abc")).thenReturn(100L);
        when(provider.getUsernameFromToken("abc")).thenReturn("tom");
        when(provider.getRoleFromToken("abc")).thenReturn("ADMIN");
        when(permissionService.getPermissionsByRole("ADMIN")).thenReturn(Collections.singletonList("user:manage"));

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(provider, permissionService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer abc");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertEquals(100L, authentication.getPrincipal());
        assertEquals("tom", authentication.getDetails());
        assertTrue(authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
        assertTrue(authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("user:manage")));
    }

    @Test
    void skipsAuthenticationWhenNoToken() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(mock(JwtTokenProvider.class), mock(PermissionService.class));
        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
