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
    @PreAuthorize("hasAnyRole('ADMIN','DEPT_LEADER','GROUP_LEADER')")
    public Result<List<EvalHistoryVO>> getHistoryByUser(@PathVariable Long userId) {
        return Result.success(queryService.getHistoryByUserId(userId));
    }

    @GetMapping("/details")
    public Result<List<ScoreDetailVO>> getScoreDetails(@RequestParam Long periodId, @RequestParam Long targetId) {
        return Result.success(queryService.getScoreDetails(periodId, targetId));
    }

    @GetMapping("/ranking")
    @PreAuthorize("hasAnyRole('ADMIN','DEPT_LEADER')")
    public Result<List<RankVO>> getDeptRanking(@RequestParam Long periodId,
                                                @RequestParam(required = false) Long deptId) {
        return Result.success(queryService.getDeptRanking(periodId, deptId));
    }
}
