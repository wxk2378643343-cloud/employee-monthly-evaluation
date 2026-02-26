package com.eval.module.system.service;

import org.junit.jupiter.api.Test;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DeptServiceTest {

    @Test
    void listAllDelegatesToList() {
        DeptService service = spy(new DeptService());
        doReturn(Collections.emptyList()).when(service).list(any(LambdaQueryWrapper.class));
        assertNotNull(service.listAll());
        verify(service).list(any(LambdaQueryWrapper.class));
    }
}
