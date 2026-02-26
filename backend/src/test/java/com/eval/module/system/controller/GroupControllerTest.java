package com.eval.module.system.controller;

import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.service.GroupService;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GroupControllerTest {

    @Test
    void allEndpoints() {
        GroupService service = mock(GroupService.class);
        when(service.listAll()).thenReturn(Collections.emptyList());
        when(service.listByDeptId(1L)).thenReturn(Collections.emptyList());
        GroupController controller = new GroupController(service);
        assertEquals(200, controller.listAll().getCode());
        assertEquals(200, controller.listByDept(1L).getCode());
        assertEquals(200, controller.create(new SysGroup()).getCode());
        assertEquals(200, controller.update(1L, new SysGroup()).getCode());
        assertEquals(200, controller.delete(1L).getCode());
        verify(service).save(any(SysGroup.class));
        verify(service).updateById(any(SysGroup.class));
        verify(service).removeById(1L);
    }
}
