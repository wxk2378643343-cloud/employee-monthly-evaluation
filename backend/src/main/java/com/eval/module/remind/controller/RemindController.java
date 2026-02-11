package com.eval.module.remind.controller;

import com.eval.common.result.Result;
import com.eval.module.remind.entity.RemindRecord;
import com.eval.module.remind.service.RemindService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminds")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RemindController {

    private final RemindService remindService;

    @PostMapping("/send/{periodId}")
    public Result<Void> sendRemind(@PathVariable Long periodId) {
        remindService.remindUnscored(periodId);
        return Result.success();
    }

    @GetMapping
    public Result<List<RemindRecord>> listByPeriod(@RequestParam Long periodId) {
        return Result.success(remindService.listByPeriod(periodId));
    }
}
