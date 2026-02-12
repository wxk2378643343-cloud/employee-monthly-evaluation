package com.eval.module.vote.controller;

import com.eval.common.result.Result;
import com.eval.module.vote.dto.VoteSubmitDTO;
import com.eval.module.vote.entity.EvalVote;
import com.eval.module.vote.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/votes")
@PreAuthorize("hasAuthority('vote:view')")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping
    public Result<Void> submitVote(@Valid @RequestBody VoteSubmitDTO dto) {
        voteService.submitVote(dto);
        return Result.success();
    }

    @GetMapping("/my")
    public Result<List<EvalVote>> getMyVotes(@RequestParam Long periodId) {
        return Result.success(voteService.getMyVotes(periodId));
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getVoteStats(@RequestParam Long periodId, @RequestParam Long candidateId) {
        return Result.success(voteService.getVoteStats(periodId, candidateId));
    }
}
