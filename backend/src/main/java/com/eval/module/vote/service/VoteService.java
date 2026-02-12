package com.eval.module.vote.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import com.eval.module.vote.dto.VoteSubmitDTO;
import com.eval.module.vote.entity.EvalVote;
import com.eval.module.vote.mapper.EvalVoteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VoteService extends ServiceImpl<EvalVoteMapper, EvalVote> {

    private final UserService userService;

    public void submitVote(VoteSubmitDTO dto) {
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Cannot vote for yourself
        if (currentUserId.equals(dto.getCandidateId())) {
            throw new BusinessException("不能给自己投票");
        }

        // Check same group (peer voting within group)
        SysUser voter = userService.getById(currentUserId);
        SysUser candidate = userService.getById(dto.getCandidateId());
        if (voter == null || candidate == null) {
            throw new BusinessException("用户不存在");
        }
        if (voter.getGroupId() == null || !voter.getGroupId().equals(candidate.getGroupId())) {
            throw new BusinessException("只能在同网格内投票");
        }

        // Check duplicate vote
        EvalVote existing = getOne(new LambdaQueryWrapper<EvalVote>()
                .eq(EvalVote::getPeriodId, dto.getPeriodId())
                .eq(EvalVote::getVoterId, currentUserId)
                .eq(EvalVote::getCandidateId, dto.getCandidateId())
                .eq(EvalVote::getVoteType, dto.getVoteType()));
        if (existing != null) {
            throw new BusinessException("已经投过该类型的票");
        }

        EvalVote vote = new EvalVote();
        vote.setPeriodId(dto.getPeriodId());
        vote.setVoterId(currentUserId);
        vote.setCandidateId(dto.getCandidateId());
        vote.setVoteType(dto.getVoteType());
        save(vote);
    }

    public List<EvalVote> getMyVotes(Long periodId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return list(new LambdaQueryWrapper<EvalVote>()
                .eq(EvalVote::getPeriodId, periodId)
                .eq(EvalVote::getVoterId, currentUserId));
    }

    public Map<String, Object> getVoteStats(Long periodId, Long candidateId) {
        long excellentCount = count(new LambdaQueryWrapper<EvalVote>()
                .eq(EvalVote::getPeriodId, periodId)
                .eq(EvalVote::getCandidateId, candidateId)
                .eq(EvalVote::getVoteType, "EXCELLENT"));

        long poorCount = count(new LambdaQueryWrapper<EvalVote>()
                .eq(EvalVote::getPeriodId, periodId)
                .eq(EvalVote::getCandidateId, candidateId)
                .eq(EvalVote::getVoteType, "POOR"));

        Map<String, Object> stats = new HashMap<>();
        stats.put("candidateId", candidateId);
        stats.put("excellentCount", excellentCount);
        stats.put("poorCount", poorCount);
        return stats;
    }
}
