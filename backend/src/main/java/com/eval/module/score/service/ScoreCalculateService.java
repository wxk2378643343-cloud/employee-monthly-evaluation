package com.eval.module.score.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.score.entity.EvalDetail;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalDetailMapper;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoreCalculateService {

    private final EvalDetailMapper evalDetailMapper;
    private final EvalRecordMapper evalRecordMapper;
    private final EvalScoreAssignMapper assignMapper;
    private final PeriodService periodService;
    private final UserService userService;

    @Transactional
    public void calculateScores(Long periodId) {
        // Get all targets for this period
        List<EvalScoreAssign> assigns = assignMapper.selectList(
                new LambdaQueryWrapper<EvalScoreAssign>()
                        .eq(EvalScoreAssign::getPeriodId, periodId));

        Set<Long> targetIds = assigns.stream()
                .map(EvalScoreAssign::getTargetId)
                .collect(Collectors.toSet());

        for (Long targetId : targetIds) {
            calculateForTarget(periodId, targetId);
        }

        // Calculate department rankings
        calculateDeptRanks(periodId);
        autoEndPeriodIfAllAssignmentsDone(periodId);
    }

    @Transactional
    public boolean calculateTargetIfAllScored(Long periodId, Long targetId) {
        List<EvalScoreAssign> assigns = assignMapper.selectList(
                new LambdaQueryWrapper<EvalScoreAssign>()
                        .eq(EvalScoreAssign::getPeriodId, periodId)
                        .eq(EvalScoreAssign::getTargetId, targetId));
        if (assigns == null || assigns.isEmpty()) {
            return false;
        }
        boolean allScored = assigns.stream().allMatch(a -> a.getStatus() != null && a.getStatus() == 1);
        if (!allScored) {
            return false;
        }
        calculateForTarget(periodId, targetId);
        autoEndPeriodIfAllAssignmentsDone(periodId);
        return true;
    }

    private void autoEndPeriodIfAllAssignmentsDone(Long periodId) {
        Long remaining = assignMapper.selectCount(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId)
                .eq(EvalScoreAssign::getStatus, 0));
        if (remaining == null || remaining > 0) {
            return;
        }

        EvalPeriod period = periodService.getById(periodId);
        if (period != null && period.getStatus() != null && period.getStatus() == 1) {
            periodService.endPeriod(periodId);
        }
    }

    private void calculateForTarget(Long periodId, Long targetId) {
        // Get all details for this target
        List<EvalDetail> details = evalDetailMapper.selectList(
                new LambdaQueryWrapper<EvalDetail>()
                        .eq(EvalDetail::getPeriodId, periodId)
                        .eq(EvalDetail::getTargetId, targetId));

        // Get assign weights
        List<EvalScoreAssign> assigns = assignMapper.selectList(
                new LambdaQueryWrapper<EvalScoreAssign>()
                        .eq(EvalScoreAssign::getPeriodId, periodId)
                        .eq(EvalScoreAssign::getTargetId, targetId));

        // Group details by eval type
        Map<String, List<EvalDetail>> detailsByType = details.stream()
                .collect(Collectors.groupingBy(EvalDetail::getEvalType));

        // Get weight for each type (use the first assign's weight per type)
        Map<String, BigDecimal> weightByType = assigns.stream()
                .collect(Collectors.toMap(
                        EvalScoreAssign::getEvalType,
                        EvalScoreAssign::getWeight,
                        (w1, w2) -> w1));

        // Calculate average score per type (handles multiple scorers of same type)
        BigDecimal selfScore = averageScore(detailsByType.get("SELF"));
        BigDecimal peerScore = averageScore(detailsByType.get("PEER"));
        BigDecimal groupLeaderScore = averageScore(detailsByType.get("GROUP_LEADER"));
        BigDecimal deptLeaderScore = averageScore(detailsByType.get("DEPT_LEADER"));
        BigDecimal adminScore = averageScore(detailsByType.get("ADMIN"));

        // Calculate weighted score
        BigDecimal weightedScore = BigDecimal.ZERO;
        if (selfScore != null && weightByType.containsKey("SELF")) {
            weightedScore = weightedScore.add(selfScore.multiply(weightByType.get("SELF")).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        if (peerScore != null && weightByType.containsKey("PEER")) {
            weightedScore = weightedScore.add(peerScore.multiply(weightByType.get("PEER")).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        if (groupLeaderScore != null && weightByType.containsKey("GROUP_LEADER")) {
            weightedScore = weightedScore.add(groupLeaderScore.multiply(weightByType.get("GROUP_LEADER")).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        if (deptLeaderScore != null && weightByType.containsKey("DEPT_LEADER")) {
            weightedScore = weightedScore.add(deptLeaderScore.multiply(weightByType.get("DEPT_LEADER")).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        if (adminScore != null && weightByType.containsKey("ADMIN")) {
            weightedScore = weightedScore.add(adminScore.multiply(weightByType.get("ADMIN")).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }

        // Upsert eval record
        EvalRecord record = evalRecordMapper.selectOne(
                new LambdaQueryWrapper<EvalRecord>()
                        .eq(EvalRecord::getPeriodId, periodId)
                        .eq(EvalRecord::getTargetId, targetId));

        if (record == null) {
            record = new EvalRecord();
            record.setPeriodId(periodId);
            record.setTargetId(targetId);
        }

        record.setSelfScore(selfScore);
        record.setPeerScore(peerScore);
        record.setGroupLeaderScore(groupLeaderScore);
        record.setDeptLeaderScore(deptLeaderScore);
        record.setAdminScore(adminScore);
        record.setWeightedScore(weightedScore);

        if (record.getId() == null) {
            evalRecordMapper.insert(record);
        } else {
            evalRecordMapper.updateById(record);
        }
    }

    private BigDecimal averageScore(List<EvalDetail> details) {
        if (details == null || details.isEmpty()) {
            return null;
        }
        BigDecimal sum = details.stream()
                .map(EvalDetail::getScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(details.size()), 2, RoundingMode.HALF_UP);
    }

    private void calculateDeptRanks(Long periodId) {
        List<EvalRecord> records = evalRecordMapper.selectList(
                new LambdaQueryWrapper<EvalRecord>()
                        .eq(EvalRecord::getPeriodId, periodId)
                        .isNotNull(EvalRecord::getWeightedScore));

        // Group by department
        Map<Long, List<EvalRecord>> recordsByDept = new HashMap<>();
        for (EvalRecord record : records) {
            SysUser user = userService.getById(record.getTargetId());
            if (user != null && user.getDeptId() != null) {
                recordsByDept.computeIfAbsent(user.getDeptId(), k -> new ArrayList<>()).add(record);
            }
        }

        // Rank within each department
        for (Map.Entry<Long, List<EvalRecord>> entry : recordsByDept.entrySet()) {
            List<EvalRecord> deptRecords = entry.getValue();
            deptRecords.sort((a, b) -> b.getWeightedScore().compareTo(a.getWeightedScore()));

            int deptSize = deptRecords.size();
            for (int i = 0; i < deptSize; i++) {
                EvalRecord record = deptRecords.get(i);
                record.setDeptRank(i + 1);

                // Mark bottom 3% (only if dept has >= 5 people)
                if (deptSize >= 5) {
                    int bottom3Count = Math.max(1, (int) Math.ceil(deptSize * 0.03));
                    record.setIsBottom3pct(i >= deptSize - bottom3Count ? 1 : 0);
                } else {
                    record.setIsBottom3pct(0);
                }

                evalRecordMapper.updateById(record);
            }
        }
    }
}
