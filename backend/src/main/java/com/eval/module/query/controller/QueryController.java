package com.eval.module.query.controller;

import com.eval.common.result.Result;
import com.eval.module.query.service.QueryService;
import com.eval.module.query.vo.EvalHistoryVO;
import com.eval.module.query.vo.RankVO;
import com.eval.module.query.vo.ScoreDetailVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/query")
@RequiredArgsConstructor
public class QueryController {

    private final QueryService queryService;

    @GetMapping("/my-history")
    public Result<List<EvalHistoryVO>> getMyHistory() {
        return Result.success(queryService.getMyHistory());
    }

    @GetMapping("/history/{userId}")
    @PreAuthorize("hasAuthority('query:detail:view')")
    public Result<List<EvalHistoryVO>> getHistoryByUser(@PathVariable Long userId) {
        return Result.success(queryService.getHistoryByUserId(userId));
    }

    @GetMapping("/details")
    public Result<List<ScoreDetailVO>> getScoreDetails(@RequestParam Long periodId, @RequestParam Long targetId) {
        return Result.success(queryService.getScoreDetails(periodId, targetId));
    }

    @GetMapping("/ranking")
    @PreAuthorize("hasAuthority('query:rank:view')")
    public Result<List<RankVO>> getDeptRanking(@RequestParam Long periodId,
                                               @RequestParam(required = false) Long deptId) {
        return Result.success(queryService.getDeptRanking(periodId, deptId));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('query:statistics:view')")
    public Result<Map<String, Object>> getStatistics(@RequestParam Long periodId) {
        return Result.success(queryService.getStatistics(periodId));
    }
}
