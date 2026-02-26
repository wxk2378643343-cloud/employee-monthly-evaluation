package com.eval.module.system.controller;

import com.eval.common.result.Result;
import com.eval.module.system.dto.*;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.PermissionService;
import com.eval.module.system.service.UserService;
import com.eval.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    @AfterEach
    void clearCtx() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginReturnsTokenAndUserData() {
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        JwtTokenProvider jwtTokenProvider = mock(JwtTokenProvider.class);
        UserService userService = mock(UserService.class);
        PermissionService permissionService = mock(PermissionService.class);
        when(authenticationManager.authenticate(any())).thenReturn(new TestingAuthenticationToken("x", "x"));

        SysUser user = new SysUser();
        user.setId(1L);
        user.setUsername("u");
        user.setRealName("U");
        user.setRole("ADMIN");
        when(userService.getByUsername("u")).thenReturn(user);
        when(jwtTokenProvider.generateToken(1L, "u", "ADMIN")).thenReturn("tkn");
        when(permissionService.getPermissionsByRole("ADMIN")).thenReturn(Arrays.asList("a", "b"));

        AuthController controller = new AuthController(authenticationManager, jwtTokenProvider, userService, permissionService);
        LoginDTO dto = new LoginDTO();
        dto.setUsername("u");
        dto.setPassword("p");
        Result<Map<String, Object>> result = controller.login(dto);
        assertEquals(200, result.getCode());
        assertEquals("tkn", result.getData().get("token"));
    }

    @Test
    void logoutReturnsSuccess() {
        AuthController controller = new AuthController(mock(AuthenticationManager.class), mock(JwtTokenProvider.class),
                mock(UserService.class), mock(PermissionService.class));
        assertEquals(200, controller.logout().getCode());
    }

    @Test
    void getUserInfoUsesCurrentUserId() {
        UserService userService = mock(UserService.class);
        UserInfoVO vo = new UserInfoVO();
        vo.setId(11L);
        when(userService.getUserInfo(11L)).thenReturn(vo);

        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(11L, null, "ROLE_TEST"));
        AuthController controller = new AuthController(mock(AuthenticationManager.class), mock(JwtTokenProvider.class),
                userService, mock(PermissionService.class));

        Result<UserInfoVO> result = controller.getUserInfo();
        assertEquals(11L, result.getData().getId());
    }

    @Test
    void updateProfileAndPasswordCallService() {
        UserService userService = mock(UserService.class);
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(9L, null, "ROLE_TEST"));
        AuthController controller = new AuthController(mock(AuthenticationManager.class), mock(JwtTokenProvider.class),
                userService, mock(PermissionService.class));

        ProfileUpdateDTO profile = new ProfileUpdateDTO();
        profile.setRealName("r");
        controller.updateProfile(profile);

        ChangePasswordDTO pwd = new ChangePasswordDTO();
        pwd.setOldPassword("old");
        pwd.setNewPassword("new");
        controller.changePassword(pwd);

        verify(userService).updateOwnProfile(eq(9L), any(ProfileUpdateDTO.class));
        verify(userService).changeOwnPassword(9L, "old", "new");
    }
}

