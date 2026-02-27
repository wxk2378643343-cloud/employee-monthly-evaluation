package com.eval.module.period.controller;

import com.eval.common.result.Result;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.remind.service.RemindService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/periods")
@RequiredArgsConstructor
public class PeriodController {

    private final PeriodService periodService;
    private final RemindService remindService;

    @GetMapping
    public Result<List<EvalPeriod>> listAll() {
        return Result.success(periodService.listAll());
    }

    @GetMapping("/current")
    public Result<EvalPeriod> getCurrentPeriod() {
        return Result.success(periodService.getCurrentPeriod());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('period:manage')")
    public Result<Void> create(@RequestBody EvalPeriod period) {
        periodService.createPeriod(period);
        if (period.getStatus() != null && period.getStatus() == 1 && period.getId() != null) {
            remindService.remindUnscored(period.getId());
        }
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('period:manage')")
    public Result<Void> update(@PathVariable Long id, @RequestBody EvalPeriod period) {
        EvalPeriod before = periodService.getById(id);
        period.setId(id);
        periodService.updatePeriod(period);
        boolean switchedToInProgress = period.getStatus() != null
                && period.getStatus() == 1
                && (before == null || before.getStatus() == null || before.getStatus() != 1);
        if (switchedToInProgress) {
            remindService.remindUnscored(id);
        }
        return Result.success();
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('period:manage')")
    public Result<Void> start(@PathVariable Long id) {
        periodService.startPeriod(id);
        // Trigger initial reminders when a scoring period starts.
        remindService.remindUnscored(id);
        return Result.success();
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAuthority('period:manage')")
    public Result<Void> end(@PathVariable Long id) {
        periodService.endPeriod(id);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('period:manage')")
    public Result<Void> delete(@PathVariable Long id) {
        periodService.deletePeriod(id);
        return Result.success();
    }
}
