package com.eval.module.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.mapper.SysGroupMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupService extends ServiceImpl<SysGroupMapper, SysGroup> {

    public List<SysGroup> listByDeptId(Long deptId) {
        return list(new LambdaQueryWrapper<SysGroup>()
                .eq(SysGroup::getDeptId, deptId)
                .eq(SysGroup::getStatus, 1)
                .orderByAsc(SysGroup::getSortOrder));
    }

    public List<SysGroup> listAll() {
        return list(new LambdaQueryWrapper<SysGroup>()
                .eq(SysGroup::getStatus, 1)
                .orderByAsc(SysGroup::getSortOrder));
    }
}
