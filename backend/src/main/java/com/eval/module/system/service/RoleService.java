package com.eval.module.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.system.entity.SysRole;
import com.eval.module.system.mapper.SysRoleMapper;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
public class RoleService extends ServiceImpl<SysRoleMapper, SysRole> {

    private static final List<String> BUILTIN_CODES =
            Arrays.asList("ADMIN", "DEPT_LEADER", "GROUP_LEADER", "EMPLOYEE");

    public List<SysRole> listAll() {
        return list(new LambdaQueryWrapper<SysRole>()
                .orderByAsc(SysRole::getSortOrder)
                .orderByAsc(SysRole::getId));
    }

    public List<SysRole> listEnabled() {
        return list(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getStatus, 1)
                .orderByAsc(SysRole::getSortOrder)
                .orderByAsc(SysRole::getId));
    }

    public void createRole(SysRole role) {
        String roleCode = normalizeRoleCode(role.getRoleCode());
        if (existsByCode(roleCode, null)) {
            throw new BusinessException(400, "Role code already exists");
        }
        role.setRoleCode(roleCode);
        if (role.getStatus() == null) {
            role.setStatus(1);
        }
        if (role.getSortOrder() == null) {
            role.setSortOrder(0);
        }
        save(role);
    }

    public void updateRole(Long id, SysRole payload) {
        SysRole existing = getById(id);
        if (existing == null) {
            throw new BusinessException(404, "Role not found");
        }
        if (payload.getRoleCode() != null) {
            String normalizedCode = normalizeRoleCode(payload.getRoleCode());
            if (!normalizedCode.equals(existing.getRoleCode())) {
                throw new BusinessException(400, "Role code cannot be changed");
            }
        }
        existing.setRoleName(payload.getRoleName());
        if (payload.getSortOrder() != null) {
            existing.setSortOrder(payload.getSortOrder());
        }
        if (payload.getStatus() != null) {
            existing.setStatus(payload.getStatus());
        }
        updateById(existing);
    }

    public void deleteRole(Long id) {
        SysRole role = getById(id);
        if (role == null) {
            return;
        }
        if (BUILTIN_CODES.contains(role.getRoleCode())) {
            throw new BusinessException(400, "Built-in role cannot be deleted");
        }
        removeById(id);
    }

    public void validateAssignableRole(String roleCode) {
        String normalizedCode = normalizeRoleCode(roleCode);
        SysRole role = getOne(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getRoleCode, normalizedCode)
                .last("limit 1"));
        if (role == null) {
            throw new BusinessException(400, "Role does not exist");
        }
        if (!Integer.valueOf(1).equals(role.getStatus())) {
            throw new BusinessException(400, "Role is disabled");
        }
    }

    private boolean existsByCode(String roleCode, Long excludeId) {
        return count(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getRoleCode, roleCode)
                .ne(excludeId != null, SysRole::getId, excludeId)) > 0;
    }

    private String normalizeRoleCode(String roleCode) {
        if (roleCode == null || roleCode.trim().isEmpty()) {
            throw new BusinessException(400, "Role code is required");
        }
        return roleCode.trim().toUpperCase(Locale.ROOT);
    }
}
