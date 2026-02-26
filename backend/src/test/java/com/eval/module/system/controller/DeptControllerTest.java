package com.eval.module.system.controller;

import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.service.DeptService;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DeptControllerTest {

    @Test
    void allEndpoints() {
        DeptService service = mock(DeptService.class);
        when(service.listAll()).thenReturn(Collections.emptyList());
        when(service.getById(1L)).thenReturn(new SysDepartment());
        DeptController controller = new DeptController(service);
        assertEquals(200, controller.listAll().getCode());
        assertEquals(200, controller.getById(1L).getCode());
        assertEquals(200, controller.create(new SysDepartment()).getCode());
        assertEquals(200, controller.update(1L, new SysDepartment()).getCode());
        assertEquals(200, controller.delete(1L).getCode());
        verify(service).save(any(SysDepartment.class));
        verify(service).updateById(any(SysDepartment.class));
        verify(service).removeById(1L);
    }
}
