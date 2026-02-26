package com.eval.module.period.controller;

import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PeriodControllerTest {

    @Test
    void allEndpoints() {
        PeriodService service = mock(PeriodService.class);
        when(service.listAll()).thenReturn(Collections.emptyList());
        when(service.getCurrentPeriod()).thenReturn(new EvalPeriod());
        PeriodController controller = new PeriodController(service);
        assertEquals(200, controller.listAll().getCode());
        assertEquals(200, controller.getCurrentPeriod().getCode());
        assertEquals(200, controller.create(new EvalPeriod()).getCode());
        assertEquals(200, controller.update(2L, new EvalPeriod()).getCode());
        assertEquals(200, controller.start(2L).getCode());
        assertEquals(200, controller.end(2L).getCode());
        verify(service).createPeriod(any(EvalPeriod.class));
        verify(service).updateById(any(EvalPeriod.class));
        verify(service).startPeriod(2L);
        verify(service).endPeriod(2L);
    }
}
