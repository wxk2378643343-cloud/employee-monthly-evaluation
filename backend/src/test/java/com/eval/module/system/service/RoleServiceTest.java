package com.eval.module.system.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.system.entity.SysRole;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoleServiceTest {

    @Test
    void createRoleValidatesAndSetsDefaults() {
        RoleService service = spy(new RoleService());
        doReturn(0L).when(service).count(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).save(any(SysRole.class));
        SysRole role = new SysRole();
        role.setRoleCode(" custom ");
        role.setRoleName("n");
        service.createRole(role);
        assertEquals("CUSTOM", role.getRoleCode());
        assertEquals(1, role.getStatus());
        assertEquals(0, role.getSortOrder());
    }

    @Test
    void createRoleFailsWhenCodeExists() {
        RoleService service = spy(new RoleService());
        doReturn(1L).when(service).count(any(LambdaQueryWrapper.class));
        SysRole role = new SysRole();
        role.setRoleCode("ADMIN2");
        assertThrows(BusinessException.class, () -> service.createRole(role));
    }

    @Test
    void updateRoleValidationBranches() {
        RoleService service = spy(new RoleService());
        doReturn(null).when(service).getById(1L);
        assertThrows(BusinessException.class, () -> service.updateRole(1L, new SysRole()));

        SysRole existing = new SysRole();
        existing.setId(2L);
        existing.setRoleCode("R1");
        doReturn(existing).when(service).getById(2L);
        SysRole payload = new SysRole();
        payload.setRoleCode("R2");
        assertThrows(BusinessException.class, () -> service.updateRole(2L, payload));

        SysRole payload2 = new SysRole();
        payload2.setRoleCode("R1");
        payload2.setRoleName("new");
        payload2.setStatus(1);
        payload2.setSortOrder(9);
        doReturn(true).when(service).updateById(existing);
        service.updateRole(2L, payload2);
        assertEquals("new", existing.getRoleName());
    }

    @Test
    void deleteRoleBranches() {
        RoleService service = spy(new RoleService());
        doReturn(null).when(service).getById(1L);
        service.deleteRole(1L);
        verify(service, never()).removeById(1L);

        SysRole builtin = new SysRole();
        builtin.setRoleCode("ADMIN");
        doReturn(builtin).when(service).getById(2L);
        assertThrows(BusinessException.class, () -> service.deleteRole(2L));

        SysRole custom = new SysRole();
        custom.setRoleCode("CUSTOM");
        doReturn(custom).when(service).getById(3L);
        doReturn(true).when(service).removeById(3L);
        service.deleteRole(3L);
        verify(service).removeById(3L);
    }

    @Test
    void validateAssignableRoleBranches() {
        RoleService service = spy(new RoleService());
        doReturn(null).when(service).getOne(any());
        assertThrows(BusinessException.class, () -> service.validateAssignableRole("a"));

        SysRole disabled = new SysRole();
        disabled.setStatus(0);
        doReturn(disabled).when(service).getOne(any());
        assertThrows(BusinessException.class, () -> service.validateAssignableRole("a"));

        SysRole enabled = new SysRole();
        enabled.setStatus(1);
        doReturn(enabled).when(service).getOne(any());
        assertDoesNotThrow(() -> service.validateAssignableRole("a"));
    }
}
