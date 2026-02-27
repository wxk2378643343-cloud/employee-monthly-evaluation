package com.eval.module.period.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.mapper.EvalPeriodMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PeriodService extends ServiceImpl<EvalPeriodMapper, EvalPeriod> {

    public List<EvalPeriod> listAll() {
        return list(new LambdaQueryWrapper<EvalPeriod>()
                .orderByDesc(EvalPeriod::getYear)
                .orderByDesc(EvalPeriod::getMonth));
    }

    public EvalPeriod getCurrentPeriod() {
        return getOne(new LambdaQueryWrapper<EvalPeriod>()
                .eq(EvalPeriod::getStatus, 1)
                .last("LIMIT 1"));
    }

    public void createPeriod(EvalPeriod period) {
        EvalPeriod existing = getOne(new LambdaQueryWrapper<EvalPeriod>()
                .eq(EvalPeriod::getYear, period.getYear())
                .eq(EvalPeriod::getMonth, period.getMonth()));
        if (existing != null) {
            throw new BusinessException("该月份评价周期已存在");
        }
        validatePeriodTime(period);
        if (period.getStatus() == null) {
            period.setStatus(0);
        }
        try {
            save(period);
        } catch (DuplicateKeyException e) {
            int revived = baseMapper.reviveDeletedPeriod(
                    period.getPeriodName(),
                    period.getYear(),
                    period.getMonth(),
                    period.getStatus(),
                    period.getStartTime(),
                    period.getEndTime()
            );
            if (revived <= 0) {
                throw new BusinessException("该月份评价周期已存在");
            }
        }
    }

    public void updatePeriod(EvalPeriod period) {
        if (period == null || period.getId() == null) {
            throw new BusinessException("period id is required");
        }
        validatePeriodTime(period);
        updateById(period);
    }

    public void startPeriod(Long periodId) {
        EvalPeriod period = getById(periodId);
        if (period == null) {
            throw new BusinessException("评价周期不存在");
        }
        EvalPeriod activePeriod = getCurrentPeriod();
        if (activePeriod != null && !activePeriod.getId().equals(periodId)) {
            activePeriod.setStatus(2);
            updateById(activePeriod);
        }
        period.setStatus(1);
        updateById(period);
    }

    public void endPeriod(Long periodId) {
        EvalPeriod period = getById(periodId);
        if (period == null) {
            throw new BusinessException("评价周期不存在");
        }
        period.setStatus(2);
        updateById(period);
    }

    public void deletePeriod(Long periodId) {
        EvalPeriod period = getById(periodId);
        if (period == null) {
            throw new BusinessException("评价周期不存在");
        }
        if (period.getStatus() != null && period.getStatus() == 1) {
            throw new BusinessException("进行中的周期不能删除");
        }
        baseMapper.hardDeleteById(periodId);
    }

    private void validatePeriodTime(EvalPeriod period) {
        LocalDateTime start = period.getStartTime();
        LocalDateTime end = period.getEndTime();
        if (start != null && end != null && start.isAfter(end)) {
            throw new BusinessException("开始时间不能晚于结束时间");
        }
    }
}
