package com.eval.module.period.controller;

import com.eval.common.result.Result;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/periods")
@RequiredArgsConstructor
public class PeriodController {

    private final PeriodService periodService;

    @GetMapping
    public Result<List<EvalPeriod>> listAll() {
        return Result.success(periodService.listAll());
    }

    @GetMapping("/current")
    public Result<EvalPeriod> getCurrentPeriod() {
        return Result.success(periodService.getCurrentPeriod());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> create(@RequestBody EvalPeriod period) {
        periodService.createPeriod(period);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> update(@PathVariable Long id, @RequestBody EvalPeriod period) {
        period.setId(id);
        periodService.updateById(period);
        return Result.success();
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> start(@PathVariable Long id) {
        periodService.startPeriod(id);
        return Result.success();
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> end(@PathVariable Long id) {
        periodService.endPeriod(id);
        return Result.success();
    }
}
