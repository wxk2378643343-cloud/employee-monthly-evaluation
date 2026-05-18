package com.eval.module.period.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.period.entity.EvalPeriod;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PeriodServiceTest {

    @Test
    void createPeriodThrowsWhenDuplicate() {
        PeriodService service = spy(new PeriodService());
        doReturn(new EvalPeriod()).when(service).getOne(any());
        assertThrows(BusinessException.class, () -> service.createPeriod(new EvalPeriod()));
    }

    @Test
    void createPeriodSetsDefaultStatus() {
        PeriodService service = spy(new PeriodService());
        doReturn(null).when(service).getOne(any());
        doReturn(true).when(service).save(any(EvalPeriod.class));
        EvalPeriod period = new EvalPeriod();
        period.setYear(2025);
        period.setMonth(1);
        service.createPeriod(period);
        assertEquals(0, period.getStatus());
    }

    @Test
    void startPeriodThrowsWhenMissing() {
        PeriodService service = spy(new PeriodService());
        doReturn(null).when(service).getById(1L);
        assertThrows(BusinessException.class, () -> service.startPeriod(1L));
    }

    @Test
    void startPeriodClosesActivePeriod() {
        PeriodService service = spy(new PeriodService());
        EvalPeriod target = new EvalPeriod();
        target.setId(2L);
        target.setStatus(0);
        EvalPeriod active = new EvalPeriod();
        active.setId(1L);
        active.setStatus(1);
        doReturn(target).when(service).getById(2L);
        doReturn(active).when(service).getCurrentPeriod();
        doReturn(true).when(service).updateById(any(EvalPeriod.class));
        service.startPeriod(2L);
        assertEquals(1, target.getStatus());
        assertEquals(2, active.getStatus());
        verify(service, times(2)).updateById(any(EvalPeriod.class));
    }

    @Test
    void endPeriodThrowsWhenMissingAndUpdatesWhenFound() {
        PeriodService service = spy(new PeriodService());
        doReturn(null).when(service).getById(1L);
        assertThrows(BusinessException.class, () -> service.endPeriod(1L));

        EvalPeriod period = new EvalPeriod();
        period.setId(2L);
        period.setStatus(1);
        doReturn(period).when(service).getById(2L);
        doReturn(true).when(service).updateById(period);
        service.endPeriod(2L);
        assertEquals(2, period.getStatus());
    }

    @Test
    void updatePeriodRejectsStatusChangeThroughEdit() {
        PeriodService service = spy(new PeriodService());
        EvalPeriod existing = new EvalPeriod();
        existing.setId(1L);
        existing.setStatus(1);
        doReturn(existing).when(service).getById(1L);

        EvalPeriod payload = new EvalPeriod();
        payload.setId(1L);
        payload.setStatus(0);
        assertThrows(BusinessException.class, () -> service.updatePeriod(payload));
    }

    @Test
    void endedPeriodCannotRestart() {
        PeriodService service = spy(new PeriodService());
        EvalPeriod ended = new EvalPeriod();
        ended.setId(1L);
        ended.setStatus(2);
        doReturn(ended).when(service).getById(1L);

        assertThrows(BusinessException.class, () -> service.startPeriod(1L));
    }
}
