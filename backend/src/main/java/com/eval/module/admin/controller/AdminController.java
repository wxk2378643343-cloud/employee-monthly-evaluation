package com.eval.module.admin.controller;

import com.eval.common.result.Result;
import com.eval.module.admin.dto.AssignDTO;
import com.eval.module.admin.dto.AssignGenerateResultVO;
import com.eval.module.admin.dto.AssignGenerateRuleDTO;
import com.eval.module.admin.dto.AssignVO;
import com.eval.module.admin.dto.LinearScoreDTO;
import com.eval.module.admin.dto.LinearScoreImportResultVO;
import com.eval.module.admin.dto.LinearScoreVO;
import com.eval.module.admin.service.AssignService;
import com.eval.module.admin.service.LinearScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @DeleteMapping("/assigns")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<Integer> clearAssignsByPeriod(@RequestParam Long periodId) {
        return Result.success(assignService.removeByPeriod(periodId));
    }

    @PostMapping("/assigns/generate")
    @PreAuthorize("hasAuthority('assign:manage')")
    public Result<AssignGenerateResultVO> generateAssigns(@Valid @RequestBody AssignGenerateRuleDTO dto) {
        return Result.success(assignService.generateByRule(dto));
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

    @GetMapping("/linear-scores/export")
    @PreAuthorize("hasAuthority('linear:manage')")
    public ResponseEntity<byte[]> exportLinearScores(@RequestParam Long periodId,
                                                     @RequestParam(required = false) Long deptId) {
        byte[] bytes = linearScoreService.exportLinearScoreExcel(periodId, deptId);
        String filename = "linear-scores-period-" + periodId + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping("/linear-scores/import")
    @PreAuthorize("hasAuthority('linear:manage')")
    public Result<LinearScoreImportResultVO> importLinearScores(@RequestParam Long periodId,
                                                                @RequestParam("file") MultipartFile file) {
        return Result.success(linearScoreService.importLinearScoreExcel(periodId, file));
    }
}
