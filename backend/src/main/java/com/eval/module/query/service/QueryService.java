package com.eval.module.query.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.eval.common.exception.BusinessException;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.query.vo.EvalHistoryVO;
import com.eval.module.query.vo.RankVO;
import com.eval.module.query.vo.ScoreDetailVO;
import com.eval.module.score.entity.EvalDetail;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalDetailMapper;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.GroupService;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QueryService {

    private final EvalRecordMapper evalRecordMapper;
    private final EvalDetailMapper evalDetailMapper;
    private final PeriodService periodService;
    private final UserService userService;
    private final DeptService deptService;
    private final GroupService groupService;
    private final EvalScoreAssignMapper assignMapper;

    public List<EvalHistoryVO> getMyHistory() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return getHistoryByUserId(currentUserId);
    }

    public List<EvalHistoryVO> getHistoryByUserId(Long userId) {
        List<EvalRecord> records = evalRecordMapper.selectList(
                new LambdaQueryWrapper<EvalRecord>()
                        .eq(EvalRecord::getTargetId, userId)
                        .orderByDesc(EvalRecord::getPeriodId));

        List<EvalHistoryVO> result = new ArrayList<>();
        for (EvalRecord record : records) {
            EvalHistoryVO vo = new EvalHistoryVO();
            vo.setRecordId(record.getId());
            vo.setPeriodId(record.getPeriodId());
            vo.setSelfScore(record.getSelfScore());
            vo.setPeerScore(record.getPeerScore());
            vo.setGroupLeaderScore(record.getGroupLeaderScore());
            vo.setDeptLeaderScore(record.getDeptLeaderScore());
            vo.setAdminScore(record.getAdminScore());
            vo.setWeightedScore(record.getWeightedScore());
            vo.setLinearRankScore(record.getLinearRankScore());
            vo.setDeptRank(record.getDeptRank());
            vo.setIsBottom3pct(record.getIsBottom3pct());

            EvalPeriod period = periodService.getById(record.getPeriodId());
            if (period != null) {
                vo.setPeriodName(period.getPeriodName());
            }
            result.add(vo);
        }
        return result;
    }

    public List<ScoreDetailVO> getScoreDetails(Long periodId, Long targetId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        SysUser currentUser = userService.getById(currentUserId);
        SysUser targetUser = userService.getById(targetId);

        if (currentUser == null || targetUser == null) {
            throw new BusinessException(404, "User not found");
        }

        if (!currentUserId.equals(targetId)) {
            String role = currentUser.getRole();
            if ("ADMIN".equals(role)) {
                // allow
            } else if ("DEPT_LEADER".equals(role)) {
                if (currentUser.getDeptId() == null || !currentUser.getDeptId().equals(targetUser.getDeptId())) {
                    throw new BusinessException(403, "No permission to view details for this user");
                }
            } else if ("GROUP_LEADER".equals(role)) {
                if (currentUser.getGroupId() == null || !currentUser.getGroupId().equals(targetUser.getGroupId())) {
                    throw new BusinessException(403, "No permission to view details for this user");
                }
            } else {
                throw new BusinessException(403, "No permission to view details for this user");
            }
        }

        List<EvalDetail> details = evalDetailMapper.selectList(
                new LambdaQueryWrapper<EvalDetail>()
                        .eq(EvalDetail::getPeriodId, periodId)
                        .eq(EvalDetail::getTargetId, targetId)
                        .orderByAsc(EvalDetail::getEvalType));

        List<ScoreDetailVO> result = new ArrayList<>();
        for (EvalDetail detail : details) {
            ScoreDetailVO vo = new ScoreDetailVO();
            vo.setDetailId(detail.getId());
            vo.setEvalType(detail.getEvalType());
            vo.setScore(detail.getScore());
            vo.setComment(detail.getComment());
            vo.setCreateTime(detail.getCreateTime());

            SysUser scorer = userService.getById(detail.getScorerId());
            if (scorer != null) {
                vo.setScorerName(scorer.getRealName());
            }
            result.add(vo);
        }
        return result;
    }

    public List<RankVO> getDeptRanking(Long periodId, Long deptId) {
        List<EvalRecord> records = evalRecordMapper.selectList(
                new LambdaQueryWrapper<EvalRecord>()
                        .eq(EvalRecord::getPeriodId, periodId)
                        .isNotNull(EvalRecord::getDeptRank)
                        .orderByAsc(EvalRecord::getDeptRank));

        List<RankVO> result = new ArrayList<>();
        for (EvalRecord record : records) {
            SysUser user = userService.getById(record.getTargetId());
            if (user == null) continue;
            if (deptId != null && !deptId.equals(user.getDeptId())) continue;

            RankVO vo = new RankVO();
            vo.setTargetId(record.getTargetId());
            vo.setTargetName(user.getRealName());
            vo.setWeightedScore(record.getWeightedScore());
            vo.setLinearRankScore(record.getLinearRankScore());
            vo.setDeptRank(record.getDeptRank());
            vo.setIsBottom3pct(record.getIsBottom3pct());

            if (user.getDeptId() != null) {
                SysDepartment dept = deptService.getById(user.getDeptId());
                if (dept != null) vo.setDeptName(dept.getDeptName());
            }
            if (user.getGroupId() != null) {
                SysGroup group = groupService.getById(user.getGroupId());
                if (group != null) vo.setGroupName(group.getGroupName());
            }
            result.add(vo);
        }
        return result;
    }

    public Map<String, Object> getStatistics(Long periodId) {
        List<EvalScoreAssign> assigns = assignMapper.selectList(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId));

        Set<Long> targetIds = assigns.stream().map(EvalScoreAssign::getTargetId).collect(Collectors.toSet());
        int totalEmployees = targetIds.size();

        List<EvalRecord> scoredRecords = evalRecordMapper.selectList(new LambdaQueryWrapper<EvalRecord>()
                .eq(EvalRecord::getPeriodId, periodId)
                .isNotNull(EvalRecord::getWeightedScore));

        Set<Long> scoredTargetIds = scoredRecords.stream().map(EvalRecord::getTargetId).collect(Collectors.toSet());
        int scoredCount = scoredTargetIds.size();
        int pendingCount = Math.max(0, totalEmployees - scoredCount);

        int bottomCount = (int) scoredRecords.stream()
                .filter(r -> r.getIsBottom3pct() != null && r.getIsBottom3pct() == 1)
                .count();

        Map<String, Object> result = new HashMap<>();
        result.put("totalEmployees", totalEmployees);
        result.put("scoredCount", scoredCount);
        result.put("pendingCount", pendingCount);
        result.put("bottomCount", bottomCount);
        result.put("warningCount", bottomCount);
        return result;
    }
}
