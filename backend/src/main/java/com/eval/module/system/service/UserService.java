package com.eval.module.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.mapper.SysDepartmentMapper;
import com.eval.module.system.mapper.SysGroupMapper;
import com.eval.module.system.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<SysUserMapper, SysUser> {

    private final SysDepartmentMapper deptMapper;
    private final SysGroupMapper groupMapper;
    private final PasswordEncoder passwordEncoder;

    public SysUser getByUsername(String username) {
        return getOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .eq(SysUser::getStatus, 1));
    }

    public UserInfoVO getUserInfo(Long userId) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        UserInfoVO vo = new UserInfoVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setDeptId(user.getDeptId());
        vo.setGroupId(user.getGroupId());
        vo.setRole(user.getRole());
        vo.setPhone(user.getPhone());

        if (user.getDeptId() != null) {
            SysDepartment dept = deptMapper.selectById(user.getDeptId());
            if (dept != null) {
                vo.setDeptName(dept.getDeptName());
            }
        }
        if (user.getGroupId() != null) {
            SysGroup group = groupMapper.selectById(user.getGroupId());
            if (group != null) {
                vo.setGroupName(group.getGroupName());
            }
        }
        return vo;
    }

    public Page<SysUser> pageUsers(int pageNum, int pageSize, Long deptId, String keyword) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
                .eq(deptId != null, SysUser::getDeptId, deptId)
                .and(keyword != null && !keyword.isEmpty(), w ->
                        w.like(SysUser::getUsername, keyword)
                         .or().like(SysUser::getRealName, keyword))
                .eq(SysUser::getStatus, 1)
                .orderByAsc(SysUser::getId);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    public List<SysUser> listByGroupId(Long groupId) {
        return list(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getGroupId, groupId)
                .eq(SysUser::getStatus, 1));
    }

    public List<SysUser> listByDeptId(Long deptId) {
        return list(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getDeptId, deptId)
                .eq(SysUser::getStatus, 1));
    }

    public void createUser(SysUser user) {
        SysUser existing = getByUsername(user.getUsername());
        if (existing != null) {
            throw new BusinessException("用户名已存在");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        save(user);
    }

    public void resetPassword(Long userId, String newPassword) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        updateById(user);
    }
}
