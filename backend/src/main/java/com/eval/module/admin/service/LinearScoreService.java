package com.eval.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.eval.common.exception.BusinessException;
import com.eval.module.admin.dto.LinearScoreDTO;
import com.eval.module.admin.dto.LinearScoreVO;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LinearScoreService {

    private final EvalRecordMapper evalRecordMapper;
    private final UserService userService;
    private final DeptService deptService;

    public List<LinearScoreVO> listByPeriod(Long periodId, Long deptId) {
        LambdaQueryWrapper<EvalRecord> wrapper = new LambdaQueryWrapper<EvalRecord>()
                .eq(EvalRecord::getPeriodId, periodId);

        List<EvalRecord> records = evalRecordMapper.selectList(wrapper);
        List<LinearScoreVO> result = new ArrayList<>();

        for (EvalRecord record : records) {
            SysUser user = userService.getById(record.getTargetId());
            if (user == null) continue;
            if (deptId != null && !deptId.equals(user.getDeptId())) continue;

            LinearScoreVO vo = new LinearScoreVO();
            vo.setRecordId(record.getId());
            vo.setTargetId(record.getTargetId());
            vo.setTargetName(user.getRealName());
            vo.setWeightedScore(record.getWeightedScore());
            vo.setLinearRankScore(record.getLinearRankScore());
            vo.setDeptRank(record.getDeptRank());

            if (user.getDeptId() != null) {
                SysDepartment dept = deptService.getById(user.getDeptId());
                if (dept != null) {
                    vo.setDeptName(dept.getDeptName());
                }
            }
            result.add(vo);
        }
        return result;
    }

    public void setLinearScore(LinearScoreDTO dto) {
        EvalRecord record = evalRecordMapper.selectOne(new LambdaQueryWrapper<EvalRecord>()
                .eq(EvalRecord::getPeriodId, dto.getPeriodId())
                .eq(EvalRecord::getTargetId, dto.getTargetId()));

        if (record == null) {
            throw new BusinessException("未找到该员工的评价记录");
        }
        record.setLinearRankScore(dto.getLinearRankScore());
        evalRecordMapper.updateById(record);
    }

    public void batchSetLinearScore(List<LinearScoreDTO> dtos) {
        for (LinearScoreDTO dto : dtos) {
            setLinearScore(dto);
        }
    }
}
