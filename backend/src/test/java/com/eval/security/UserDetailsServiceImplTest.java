package com.eval.security;

import com.eval.module.system.entity.SysUser;
import com.eval.module.system.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserDetailsServiceImplTest {

    @Test
    void loadUserByUsernameSuccess() {
        SysUserMapper mapper = mock(SysUserMapper.class);
        SysUser user = new SysUser();
        user.setUsername("u1");
        user.setPassword("pwd");
        user.setRole("ADMIN");
        when(mapper.selectOne(any())).thenReturn(user);

        UserDetailsServiceImpl service = new UserDetailsServiceImpl(mapper);
        UserDetails details = service.loadUserByUsername("u1");
        assertEquals("u1", details.getUsername());
        assertEquals("pwd", details.getPassword());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void loadUserByUsernameNotFound() {
        SysUserMapper mapper = mock(SysUserMapper.class);
        when(mapper.selectOne(any())).thenReturn(null);
        UserDetailsServiceImpl service = new UserDetailsServiceImpl(mapper);
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("none"));
    }
}
