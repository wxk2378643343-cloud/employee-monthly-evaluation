package com.eval.module.system.controller;

import com.eval.module.system.entity.SysRole;
import com.eval.module.system.service.RoleService;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class RoleControllerTest {

    @Test
    void allEndpoints() {
        RoleService service = mock(RoleService.class);
        when(service.listEnabled()).thenReturn(Collections.emptyList());
        when(service.listAll()).thenReturn(Collections.emptyList());
        RoleController controller = new RoleController(service);
        assertEquals(200, controller.listEnabled().getCode());
        assertEquals(200, controller.listAll().getCode());
        assertEquals(200, controller.create(new SysRole()).getCode());
        assertEquals(200, controller.update(3L, new SysRole()).getCode());
        assertEquals(200, controller.delete(3L).getCode());
        verify(service).createRole(any(SysRole.class));
        verify(service).updateRole(eq(3L), any(SysRole.class));
        verify(service).deleteRole(3L);
    }
}
