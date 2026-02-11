package com.eval.module.score.controller;

import com.eval.common.result.Result;
import com.eval.module.score.dto.PendingUserVO;
import com.eval.module.score.dto.ScoreSubmitDTO;
import com.eval.module.score.service.ScoreCalculateService;
import com.eval.module.score.service.ScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;
    private final ScoreCalculateService scoreCalculateService;

    @GetMapping("/pending")
    public Result<List<PendingUserVO>> getPendingList(@RequestParam Long periodId) {
        return Result.success(scoreService.getPendingList(periodId));
    }

    @PostMapping("/submit")
    public Result<Void> submitScore(@Valid @RequestBody ScoreSubmitDTO dto) {
        scoreService.submitScore(dto);
        return Result.success();
    }

    @PostMapping("/submit/batch")
    public Result<Void> batchSubmitScores(@RequestBody List<ScoreSubmitDTO> dtos) {
        scoreService.batchSubmitScores(dtos);
        return Result.success();
    }

    @PostMapping("/calculate/{periodId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> calculateScores(@PathVariable Long periodId) {
        scoreCalculateService.calculateScores(periodId);
        return Result.success();
    }
}
