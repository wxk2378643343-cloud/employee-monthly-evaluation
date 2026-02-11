package com.eval.module.remind.scheduler;

import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.remind.service.RemindService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RemindScheduler {

    private final PeriodService periodService;
    private final RemindService remindService;

    /**
     * Daily reminder at 9:00 AM for unscored users during active period
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void dailyRemind() {
        EvalPeriod currentPeriod = periodService.getCurrentPeriod();
        if (currentPeriod == null) {
            log.info("No active evaluation period, skipping reminder");
            return;
        }

        log.info("Sending daily reminders for period: {}", currentPeriod.getPeriodName());
        remindService.remindUnscored(currentPeriod.getId());
    }
}
