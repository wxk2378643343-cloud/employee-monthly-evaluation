package com.eval.module.score.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.eval.common.exception.BusinessException;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.service.AssignService;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.score.dto.PendingUserVO;
import com.eval.module.score.dto.ScoreSubmitDTO;
import com.eval.module.score.entity.EvalDetail;
import com.eval.module.score.mapper.EvalDetailMapper;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.GroupService;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final EvalDetailMapper evalDetailMapper;
    private final AssignService assignService;
    private final ScoreCalculateService scoreCalculateService;
    private final PeriodService periodService;
    private final UserService userService;
    private final DeptService deptService;
    private final GroupService groupService;

    public List<PendingUserVO> getPendingList(Long periodId) {
        if (!isScoringPeriodAvailable(periodId)) {
            return new ArrayList<>();
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<EvalScoreAssign> assigns = assignService.listByScorerAndPeriod(currentUserId, periodId);

        List<PendingUserVO> result = new ArrayList<>();
        for (EvalScoreAssign assign : assigns) {
            SysUser target = userService.getById(assign.getTargetId());
            if (target == null) continue;

            PendingUserVO vo = new PendingUserVO();
            vo.setAssignId(assign.getId());
            vo.setTargetId(assign.getTargetId());
            vo.setTargetName(target.getRealName());
            vo.setEvalType(assign.getEvalType());
            vo.setStatus(assign.getStatus());

            if (target.getDeptId() != null) {
                SysDepartment dept = deptService.getById(target.getDeptId());
                if (dept != null) {
                    vo.setDeptName(dept.getDeptName());
                }
            }
            if (target.getGroupId() != null) {
                SysGroup group = groupService.getById(target.getGroupId());
                if (group != null) {
                    vo.setGroupName(group.getGroupName());
                }
            }
            result.add(vo);
        }
        return result;
    }

    @Transactional
    public void submitScore(ScoreSubmitDTO dto) {
        validateScoringPeriod(dto.getPeriodId());
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // Verify assignment exists
        EvalScoreAssign assign = assignService.getOne(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, dto.getPeriodId())
                .eq(EvalScoreAssign::getScorerId, currentUserId)
                .eq(EvalScoreAssign::getTargetId, dto.getTargetId())
                .eq(EvalScoreAssign::getEvalType, dto.getEvalType()));

        if (assign == null) {
            throw new BusinessException("未找到对应的评分分配，无权评价");
        }

        // Check if already scored - update if exists
        EvalDetail existing = evalDetailMapper.selectOne(new LambdaQueryWrapper<EvalDetail>()
                .eq(EvalDetail::getPeriodId, dto.getPeriodId())
                .eq(EvalDetail::getScorerId, currentUserId)
                .eq(EvalDetail::getTargetId, dto.getTargetId())
                .eq(EvalDetail::getEvalType, dto.getEvalType()));

        if (existing != null) {
            existing.setScore(dto.getScore());
            existing.setComment(dto.getComment());
            evalDetailMapper.updateById(existing);
        } else {
            EvalDetail detail = new EvalDetail();
            detail.setPeriodId(dto.getPeriodId());
            detail.setScorerId(currentUserId);
            detail.setTargetId(dto.getTargetId());
            detail.setEvalType(dto.getEvalType());
            detail.setScore(dto.getScore());
            detail.setComment(dto.getComment());
            evalDetailMapper.insert(detail);
        }

        // Mark assignment as scored
        assign.setStatus(1);
        assignService.updateById(assign);

        // Auto-calculate and close period when all scoring tasks are completed.
        Long remaining = assignService.count(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, dto.getPeriodId())
                .eq(EvalScoreAssign::getStatus, 0));
        if (remaining != null && remaining == 0) {
            scoreCalculateService.calculateScores(dto.getPeriodId());
        }
    }

    @Transactional
    public void batchSubmitScores(List<ScoreSubmitDTO> dtos) {
        for (ScoreSubmitDTO dto : dtos) {
            submitScore(dto);
        }
    }

    private void validateScoringPeriod(Long periodId) {
        EvalPeriod period = getScoringPeriod(periodId);
        if (period == null) {
            throw new BusinessException(400, "评价周期不存在");
        }
        if (period.getStatus() == null || period.getStatus() != 1) {
            throw new BusinessException(400, "当前评价周期未开始或已结束，不能评分");
        }

        LocalDateTime now = LocalDateTime.now();
        if (period.getStartTime() != null && now.isBefore(period.getStartTime())) {
            throw new BusinessException(400, "评价周期尚未开始，不能评分");
        }
        if (period.getEndTime() != null && now.isAfter(period.getEndTime())) {
            throw new BusinessException(400, "评价周期已结束，不能评分");
        }
    }

    private boolean isScoringPeriodAvailable(Long periodId) {
        EvalPeriod period = getScoringPeriod(periodId);
        if (period == null || period.getStatus() == null || period.getStatus() != 1) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        if (period.getStartTime() != null && now.isBefore(period.getStartTime())) {
            return false;
        }
        return period.getEndTime() == null || !now.isAfter(period.getEndTime());
    }

    private EvalPeriod getScoringPeriod(Long periodId) {
        if (periodId == null) {
            return null;
        }
        return periodService.getById(periodId);
    }
}
