package com.eval.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.admin.dto.AssignDTO;
import com.eval.module.admin.dto.AssignVO;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
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
}
