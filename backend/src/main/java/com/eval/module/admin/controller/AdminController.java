package com.eval.module.admin.controller;

import com.eval.common.result.Result;
import com.eval.module.admin.dto.AssignDTO;
import com.eval.module.admin.dto.AssignVO;
import com.eval.module.admin.dto.LinearScoreDTO;
import com.eval.module.admin.dto.LinearScoreVO;
import com.eval.module.admin.service.AssignService;
import com.eval.module.admin.service.LinearScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AssignService assignService;
    private final LinearScoreService linearScoreService;

    // ---- Score Assignment ----

    @GetMapping("/assigns")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<List<AssignVO>> listAssigns(@RequestParam Long periodId) {
        return Result.success(assignService.listByPeriod(periodId));
    }

    @GetMapping("/assigns/by-target")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<List<AssignVO>> listAssignsByTarget(@RequestParam Long periodId, @RequestParam Long targetId) {
        return Result.success(assignService.listByPeriodAndTarget(periodId, targetId));
    }

    @PostMapping("/assigns")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<Void> saveAssign(@Valid @RequestBody AssignDTO dto) {
        assignService.saveAssign(dto);
        return Result.success();
    }

    @PostMapping("/assigns/batch")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<Void> batchSaveAssigns(@RequestBody List<AssignDTO> dtos) {
        assignService.batchSaveAssigns(dtos);
        return Result.success();
    }

    @PostMapping("/assigns/copy")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<Void> copyAssigns(@RequestParam Long sourcePeriodId, @RequestParam Long targetPeriodId) {
        assignService.copyAssignsFromPeriod(sourcePeriodId, targetPeriodId);
        return Result.success();
    }

    @DeleteMapping("/assigns/{id}")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<Void> deleteAssign(@PathVariable Long id) {
        assignService.removeById(id);
        return Result.success();
    }

    // ---- Linear Score ----

    @GetMapping("/linear-scores")
    @PreAuthorize("hasAuthority('linear:manage')")
    public Result<List<LinearScoreVO>> listLinearScores(@RequestParam Long periodId,
                                                         @RequestParam(required = false) Long deptId) {
        return Result.success(linearScoreService.listByPeriod(periodId, deptId));
    }

    @PostMapping("/linear-scores")
    @PreAuthorize("hasAuthority('linear:manage')")
    public Result<Void> setLinearScore(@Valid @RequestBody LinearScoreDTO dto) {
        linearScoreService.setLinearScore(dto);
        return Result.success();
    }

    @PostMapping("/linear-scores/batch")
    @PreAuthorize("hasAuthority('linear:manage')")
    public Result<Void> batchSetLinearScores(@RequestBody List<LinearScoreDTO> dtos) {
        linearScoreService.batchSetLinearScore(dtos);
        return Result.success();
    }
}
