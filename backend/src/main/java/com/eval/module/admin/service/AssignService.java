package com.eval.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.admin.dto.AssignDTO;
import com.eval.module.admin.dto.AssignGenerateResultVO;
import com.eval.module.admin.dto.AssignGenerateRuleDTO;
import com.eval.module.admin.dto.AssignVO;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignService extends ServiceImpl<EvalScoreAssignMapper, EvalScoreAssign> {

    private final UserService userService;

    public List<AssignVO> listByPeriod(Long periodId) {
        List<EvalScoreAssign> assigns = list(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId)
                .orderByAsc(EvalScoreAssign::getTargetId));

        return assigns.stream().map(a -> {
            AssignVO vo = new AssignVO();
            vo.setId(a.getId());
            vo.setPeriodId(a.getPeriodId());
            vo.setScorerId(a.getScorerId());
            vo.setTargetId(a.getTargetId());
            vo.setEvalType(a.getEvalType());
            vo.setWeight(a.getWeight());
            vo.setStatus(a.getStatus());

            SysUser scorer = userService.getById(a.getScorerId());
            if (scorer != null) {
                vo.setScorerName(scorer.getRealName());
            }
            SysUser target = userService.getById(a.getTargetId());
            if (target != null) {
                vo.setTargetName(target.getRealName());
            }
            return vo;
        }).collect(Collectors.toList());
    }

    public List<AssignVO> listByPeriodAndTarget(Long periodId, Long targetId) {
        List<EvalScoreAssign> assigns = list(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId)
                .eq(EvalScoreAssign::getTargetId, targetId));

        return assigns.stream().map(a -> {
            AssignVO vo = new AssignVO();
            vo.setId(a.getId());
            vo.setPeriodId(a.getPeriodId());
            vo.setScorerId(a.getScorerId());
            vo.setTargetId(a.getTargetId());
            vo.setEvalType(a.getEvalType());
            vo.setWeight(a.getWeight());
            vo.setStatus(a.getStatus());

            SysUser scorer = userService.getById(a.getScorerId());
            if (scorer != null) {
                vo.setScorerName(scorer.getRealName());
            }
            SysUser target = userService.getById(a.getTargetId());
            if (target != null) {
                vo.setTargetName(target.getRealName());
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void saveAssign(AssignDTO dto) {
        // Check if assignment already exists
        EvalScoreAssign existing = getOne(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, dto.getPeriodId())
                .eq(EvalScoreAssign::getScorerId, dto.getScorerId())
                .eq(EvalScoreAssign::getTargetId, dto.getTargetId())
                .eq(EvalScoreAssign::getEvalType, dto.getEvalType()));

        if (existing != null) {
            existing.setWeight(dto.getWeight());
            updateById(existing);
        } else {
            EvalScoreAssign assign = new EvalScoreAssign();
            assign.setPeriodId(dto.getPeriodId());
            assign.setScorerId(dto.getScorerId());
            assign.setTargetId(dto.getTargetId());
            assign.setEvalType(dto.getEvalType());
            assign.setWeight(dto.getWeight());
            assign.setStatus(0);
            save(assign);
        }
    }

    @Transactional
    public void batchSaveAssigns(List<AssignDTO> dtos) {
        for (AssignDTO dto : dtos) {
            saveAssign(dto);
        }
    }

    @Transactional
    public void copyAssignsFromPeriod(Long sourcePeriodId, Long targetPeriodId) {
        List<EvalScoreAssign> sourceAssigns = list(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, sourcePeriodId));

        if (sourceAssigns.isEmpty()) {
            throw new BusinessException("源周期没有分配数据");
        }

        // Remove existing assigns for target period
        remove(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, targetPeriodId));

        List<EvalScoreAssign> newAssigns = new ArrayList<>();
        for (EvalScoreAssign source : sourceAssigns) {
            EvalScoreAssign newAssign = new EvalScoreAssign();
            newAssign.setPeriodId(targetPeriodId);
            newAssign.setScorerId(source.getScorerId());
            newAssign.setTargetId(source.getTargetId());
            newAssign.setEvalType(source.getEvalType());
            newAssign.setWeight(source.getWeight());
            newAssign.setStatus(0);
            newAssigns.add(newAssign);
        }
        saveBatch(newAssigns);
    }

    public List<EvalScoreAssign> listByScorerAndPeriod(Long scorerId, Long periodId) {
        return list(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getScorerId, scorerId)
                .eq(EvalScoreAssign::getPeriodId, periodId));
    }

    @Transactional
    public int removeByPeriod(Long periodId) {
        if (periodId == null) {
            return 0;
        }
        int count = Math.toIntExact(count(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId)));
        remove(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId));
        return count;
    }

    @Transactional
    public AssignGenerateResultVO generateByRule(AssignGenerateRuleDTO rule) {
        if (rule.getPeriodId() == null) {
            throw new BusinessException("Period is required");
        }

        boolean anyEnabled = Boolean.TRUE.equals(rule.getEnableSelf())
                || Boolean.TRUE.equals(rule.getEnablePeer())
                || Boolean.TRUE.equals(rule.getEnableGroupLeader())
                || Boolean.TRUE.equals(rule.getEnableDeptLeader())
                || Boolean.TRUE.equals(rule.getEnableAdmin());
        if (!anyEnabled) {
            throw new BusinessException("Please enable at least one assign rule");
        }

        Long periodId = rule.getPeriodId();
        int deletedCount = 0;
        if (Boolean.TRUE.equals(rule.getReplaceExisting())) {
            List<EvalScoreAssign> existing = list(new LambdaQueryWrapper<EvalScoreAssign>()
                    .eq(EvalScoreAssign::getPeriodId, periodId));
            deletedCount = existing.size();
            remove(new LambdaQueryWrapper<EvalScoreAssign>()
                    .eq(EvalScoreAssign::getPeriodId, periodId));
        }

        List<SysUser> users = userService.list(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1));
        List<SysUser> employees = users.stream()
                .filter(u -> "EMPLOYEE".equals(u.getRole()))
                .collect(Collectors.toList());
        List<SysUser> groupLeaders = users.stream()
                .filter(u -> "GROUP_LEADER".equals(u.getRole()) && u.getGroupId() != null)
                .collect(Collectors.toList());
        List<SysUser> deptLeaders = users.stream()
                .filter(u -> "DEPT_LEADER".equals(u.getRole()) && u.getDeptId() != null)
                .collect(Collectors.toList());
        List<SysUser> admins = users.stream()
                .filter(u -> "ADMIN".equals(u.getRole()))
                .collect(Collectors.toList());

        Map<Long, List<SysUser>> employeesByGroup = employees.stream()
                .filter(u -> u.getGroupId() != null)
                .collect(Collectors.groupingBy(SysUser::getGroupId));
        Map<Long, List<SysUser>> employeesByDept = employees.stream()
                .filter(u -> u.getDeptId() != null)
                .collect(Collectors.groupingBy(SysUser::getDeptId));

        List<EvalScoreAssign> newAssigns = new ArrayList<>();
        Set<String> uniqueKeys = new HashSet<>();
        int skippedCount = 0;

        if (!Boolean.TRUE.equals(rule.getReplaceExisting())) {
            List<EvalScoreAssign> existing = list(new LambdaQueryWrapper<EvalScoreAssign>()
                    .eq(EvalScoreAssign::getPeriodId, periodId));
            for (EvalScoreAssign item : existing) {
                uniqueKeys.add(buildKey(item.getScorerId(), item.getTargetId(), item.getEvalType()));
            }
        }

        if (Boolean.TRUE.equals(rule.getEnableSelf())) {
            for (SysUser employee : employees) {
                if (!addAssign(periodId, employee.getId(), employee.getId(), "SELF", defaultWeight(rule.getSelfWeight()), newAssigns, uniqueKeys)) {
                    skippedCount++;
                }
            }
        }

        if (Boolean.TRUE.equals(rule.getEnablePeer())) {
            for (List<SysUser> groupUsers : employeesByGroup.values()) {
                for (SysUser scorer : groupUsers) {
                    for (SysUser target : groupUsers) {
                        if (scorer.getId().equals(target.getId())) {
                            continue;
                        }
                        if (!addAssign(periodId, scorer.getId(), target.getId(), "PEER", defaultWeight(rule.getPeerWeight()), newAssigns, uniqueKeys)) {
                            skippedCount++;
                        }
                    }
                }
            }
        }

        if (Boolean.TRUE.equals(rule.getEnableGroupLeader())) {
            for (SysUser leader : groupLeaders) {
                List<SysUser> groupUsers = employeesByGroup.getOrDefault(leader.getGroupId(), new ArrayList<>());
                for (SysUser target : groupUsers) {
                    if (!addAssign(periodId, leader.getId(), target.getId(), "GROUP_LEADER", defaultWeight(rule.getGroupLeaderWeight()), newAssigns, uniqueKeys)) {
                        skippedCount++;
                    }
                }
            }
        }

        if (Boolean.TRUE.equals(rule.getEnableDeptLeader())) {
            for (SysUser leader : deptLeaders) {
                List<SysUser> deptUsers = employeesByDept.getOrDefault(leader.getDeptId(), new ArrayList<>());
                for (SysUser target : deptUsers) {
                    if (!addAssign(periodId, leader.getId(), target.getId(), "DEPT_LEADER", defaultWeight(rule.getDeptLeaderWeight()), newAssigns, uniqueKeys)) {
                        skippedCount++;
                    }
                }
            }
        }

        if (Boolean.TRUE.equals(rule.getEnableAdmin())) {
            for (SysUser admin : admins) {
                for (SysUser target : employees) {
                    if (!addAssign(periodId, admin.getId(), target.getId(), "ADMIN", defaultWeight(rule.getAdminWeight()), newAssigns, uniqueKeys)) {
                        skippedCount++;
                    }
                }
            }
        }

        if (!newAssigns.isEmpty()) {
            saveBatch(newAssigns);
        }

        int totalAfter = Math.toIntExact(count(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId)));

        AssignGenerateResultVO result = new AssignGenerateResultVO();
        result.setDeletedCount(deletedCount);
        result.setCreatedCount(newAssigns.size());
        result.setSkippedCount(skippedCount);
        result.setTotalAfterGenerate(totalAfter);
        return result;
    }

    private boolean addAssign(Long periodId,
                              Long scorerId,
                              Long targetId,
                              String evalType,
                              BigDecimal weight,
                              List<EvalScoreAssign> buffer,
                              Set<String> uniqueKeys) {
        if (periodId == null || scorerId == null || targetId == null || evalType == null) {
            return false;
        }
        String key = buildKey(scorerId, targetId, evalType);
        if (uniqueKeys.contains(key)) {
            return false;
        }
        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setPeriodId(periodId);
        assign.setScorerId(scorerId);
        assign.setTargetId(targetId);
        assign.setEvalType(evalType);
        assign.setWeight(defaultWeight(weight));
        assign.setStatus(0);
        buffer.add(assign);
        uniqueKeys.add(key);
        return true;
    }

    private String buildKey(Long scorerId, Long targetId, String evalType) {
        return scorerId + "_" + targetId + "_" + evalType;
    }

    private BigDecimal defaultWeight(BigDecimal weight) {
        return weight == null ? BigDecimal.ZERO : weight;
    }
}
