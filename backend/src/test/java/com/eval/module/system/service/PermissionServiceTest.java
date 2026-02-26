package com.eval.module.system.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PermissionServiceTest {

    private final PermissionService permissionService = new PermissionService();

    @Test
    void adminPermissions() {
        List<String> perms = permissionService.getPermissionsByRole("ADMIN");
        assertTrue(perms.contains("user:manage"));
        assertTrue(perms.contains("period:manage"));
    }

    @Test
    void deptLeaderPermissions() {
        List<String> perms = permissionService.getPermissionsByRole("DEPT_LEADER");
        assertTrue(perms.contains("query:rank:view"));
    }

    @Test
    void groupLeaderPermissions() {
        List<String> perms = permissionService.getPermissionsByRole("GROUP_LEADER");
        assertTrue(perms.contains("query:detail:view"));
    }

    @Test
    void unknownAndNullRoleReturnsEmpty() {
        assertTrue(permissionService.getPermissionsByRole("EMPLOYEE").isEmpty());
        assertTrue(permissionService.getPermissionsByRole(null).isEmpty());
    }
}
