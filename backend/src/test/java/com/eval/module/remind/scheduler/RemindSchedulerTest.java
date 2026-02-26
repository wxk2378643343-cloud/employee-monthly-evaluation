package com.eval.module.remind.scheduler;

import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.remind.service.RemindService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class RemindSchedulerTest {

    @Test
    void dailyRemindSkipsWhenNoActivePeriod() {
        PeriodService periodService = mock(PeriodService.class);
        when(periodService.getCurrentPeriod()).thenReturn(null);
        RemindService remindService = mock(RemindService.class);
        RemindScheduler scheduler = new RemindScheduler(periodService, remindService);
        scheduler.dailyRemind();
        verify(remindService, never()).remindUnscored(anyLong());
    }

    @Test
    void dailyRemindCallsServiceWhenActivePeriodExists() {
        PeriodService periodService = mock(PeriodService.class);
        EvalPeriod period = new EvalPeriod();
        period.setId(1L);
        period.setPeriodName("P1");
        when(periodService.getCurrentPeriod()).thenReturn(period);
        RemindService remindService = mock(RemindService.class);
        RemindScheduler scheduler = new RemindScheduler(periodService, remindService);
        scheduler.dailyRemind();
        verify(remindService).remindUnscored(1L);
    }
}
