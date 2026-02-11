package com.eval.module.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.mapper.SysDepartmentMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeptService extends ServiceImpl<SysDepartmentMapper, SysDepartment> {

    public List<SysDepartment> listAll() {
        return list(new LambdaQueryWrapper<SysDepartment>()
                .eq(SysDepartment::getStatus, 1)
                .orderByAsc(SysDepartment::getSortOrder));
    }
}
