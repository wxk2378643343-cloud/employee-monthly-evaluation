package com.eval.module.system.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eval.common.exception.BusinessException;
import com.eval.common.result.Result;
import com.eval.module.system.dto.UserImportResultVO;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserControllerTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void pageUsers() {
        UserService userService = mock(UserService.class);
        when(userService.pageUsers(1, 10, null, null)).thenReturn(new Page<>());
        UserController controller = new UserController(userService);
        Result<Page<SysUser>> result = controller.pageUsers(1, 10, null, null);
        assertEquals(200, result.getCode());
    }

    @Test
    void getUserInfoThrowsWhenAnyUserMissing() {
        UserService userService = mock(UserService.class);
        when(userService.getById(any())).thenReturn(null);
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        UserController controller = new UserController(userService);
        assertThrows(BusinessException.class, () -> controller.getUserInfo(2L));
    }

    @Test
    void getUserInfoAllowsAdmin() {
        UserService userService = mock(UserService.class);
        SysUser admin = new SysUser();
        admin.setId(1L);
        admin.setRole("ADMIN");
        SysUser target = new SysUser();
        target.setId(2L);
        target.setDeptId(8L);
        when(userService.getById(1L)).thenReturn(admin);
        when(userService.getById(2L)).thenReturn(target);
        when(userService.getUserInfo(2L)).thenReturn(new UserInfoVO());
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        UserController controller = new UserController(userService);
        assertEquals(200, controller.getUserInfo(2L).getCode());
    }

    @Test
    void getUserInfoRejectsEmployeeViewingOthers() {
        UserService userService = mock(UserService.class);
        SysUser me = new SysUser();
        me.setId(1L);
        me.setRole("EMPLOYEE");
        SysUser target = new SysUser();
        target.setId(2L);
        when(userService.getById(1L)).thenReturn(me);
        when(userService.getById(2L)).thenReturn(target);
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        UserController controller = new UserController(userService);
        assertThrows(BusinessException.class, () -> controller.getUserInfo(2L));
    }

    @Test
    void createUpdateDeleteResetAndImport() {
        UserService userService = mock(UserService.class);
        UserController controller = new UserController(userService);

        SysUser user = new SysUser();
        controller.createUser(user);
        controller.updateUser(10L, user);
        controller.deleteUser(10L);
        controller.resetPassword(10L, "123");

        UserImportResultVO importResultVO = new UserImportResultVO();
        when(userService.importUsersFromExcel(any())).thenReturn(importResultVO);
        Result<UserImportResultVO> result = controller.importUsers(
                new MockMultipartFile("file", "x.xlsx", "application/octet-stream", new byte[]{1}));
        assertSame(importResultVO, result.getData());

        verify(userService).createUser(any(SysUser.class));
        verify(userService).updateUser(any(SysUser.class));
        verify(userService).removeById(10L);
        verify(userService).resetPassword(10L, "123");
    }

    @Test
    void listByGroupRoleGuard() {
        UserService userService = mock(UserService.class);
        SysUser leader = new SysUser();
        leader.setId(7L);
        leader.setRole("GROUP_LEADER");
        leader.setGroupId(3L);
        when(userService.getById(7L)).thenReturn(leader);
        when(userService.listByGroupId(3L)).thenReturn(Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(7L, null, "ROLE_TEST"));
        UserController controller = new UserController(userService);

        assertThrows(BusinessException.class, () -> controller.listByGroup(9L));
        assertEquals(200, controller.listByGroup(3L).getCode());
    }

    @Test
    void listByDeptRoleGuard() {
        UserService userService = mock(UserService.class);
        SysUser leader = new SysUser();
        leader.setId(7L);
        leader.setRole("DEPT_LEADER");
        leader.setDeptId(5L);
        when(userService.getById(7L)).thenReturn(leader);
        when(userService.listByDeptId(5L)).thenReturn(Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(7L, null, "ROLE_TEST"));
        UserController controller = new UserController(userService);

        assertThrows(BusinessException.class, () -> controller.listByDept(8L));
        assertEquals(200, controller.listByDept(5L).getCode());
    }
}

