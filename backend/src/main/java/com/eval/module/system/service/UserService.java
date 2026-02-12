package com.eval.module.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.system.dto.ProfileUpdateDTO;
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
    private final RoleService roleService;
    private final PermissionService permissionService;

    public SysUser getByUsername(String username) {
        return getOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .eq(SysUser::getStatus, 1));
    }

    public UserInfoVO getUserInfo(Long userId) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException("User not found");
        }
        UserInfoVO vo = new UserInfoVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setDeptId(user.getDeptId());
        vo.setGroupId(user.getGroupId());
        vo.setRole(user.getRole());
        vo.setPhone(user.getPhone());
        vo.setPermissions(permissionService.getPermissionsByRole(user.getRole()));

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
            throw new BusinessException("Username already exists");
        }
        roleService.validateAssignableRole(user.getRole());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        save(user);
    }

    public void updateUser(SysUser payload) {
        SysUser existing = getById(payload.getId());
        if (existing == null) {
            throw new BusinessException("User not found");
        }
        if (payload.getRole() != null) {
            roleService.validateAssignableRole(payload.getRole());
            existing.setRole(payload.getRole());
        }
        existing.setRealName(payload.getRealName());
        existing.setDeptId(payload.getDeptId());
        existing.setGroupId(payload.getGroupId());
        existing.setPhone(payload.getPhone());
        existing.setStatus(payload.getStatus());
        updateById(existing);
    }

    public void resetPassword(Long userId, String newPassword) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException("User not found");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        updateById(user);
    }

    public void updateOwnProfile(Long userId, ProfileUpdateDTO dto) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException(404, "User not found");
        }
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setDingtalkId(dto.getDingtalkId());
        updateById(user);
    }

    public void changeOwnPassword(Long userId, String oldPassword, String newPassword) {
        SysUser user = getById(userId);
        if (user == null) {
            throw new BusinessException(404, "User not found");
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException(400, "Old password is incorrect");
        }
        if (oldPassword.equals(newPassword)) {
            throw new BusinessException(400, "New password must be different from old password");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        updateById(user);
    }
}
