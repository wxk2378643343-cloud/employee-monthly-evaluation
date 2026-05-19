package com.eval.module.system.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.module.system.dto.ProfileUpdateDTO;
import com.eval.module.system.dto.UserImportResultVO;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysRole;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.mapper.SysDepartmentMapper;
import com.eval.module.system.mapper.SysGroupMapper;
import com.eval.module.system.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<SysUserMapper, SysUser> {

    private final SysDepartmentMapper deptMapper;
    private final SysGroupMapper groupMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleService roleService;
    private final PermissionService permissionService;
    private static final String DEFAULT_IMPORT_PASSWORD = "123456";

    public SysUser getByUsername(String username) {
        return getOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)
                .eq(SysUser::getStatus, 1));
    }

    public SysUser getByPhone(String phone) {
        return getOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getPhone, phone)
                .eq(SysUser::getStatus, 1));
    }

    public SysUser getByPhoneOrUsername(String phoneOrUsername) {
        SysUser user = getByPhone(phoneOrUsername);
        if (user != null) {
            return user;
        }
        return getByUsername(phoneOrUsername);
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
        String kw = keyword == null ? null : keyword.trim();
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
                .eq(deptId != null, SysUser::getDeptId, deptId)
                .and(kw != null && !kw.isEmpty(), w ->
                        w.like(SysUser::getUsername, kw)
                                .or().like(SysUser::getRealName, kw)
                                .or().like(SysUser::getPhone, kw))
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

    @Transactional(rollbackFor = Exception.class)
    public UserImportResultVO importUsersFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "Please upload an Excel file");
        }

        UserImportResultVO result = new UserImportResultVO();
        DataFormatter formatter = new DataFormatter();
        Map<String, SysDepartment> deptCache = new HashMap<>();
        Map<String, SysGroup> groupCache = new HashMap<>();
        Map<String, String> roleNameCache = buildRoleNameCache();

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new BusinessException(400, "No worksheet found in Excel");
            }
            int lastRowNum = sheet.getLastRowNum();
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                String deptName = readCell(row, 0, formatter);
                String groupName = readCell(row, 1, formatter);
                String realName = readCell(row, 2, formatter);
                String username = readCell(row, 3, formatter);
                String roleText = readCell(row, 4, formatter);
                String phone = readCell(row, 5, formatter);

                if (isBlank(deptName) && isBlank(groupName) && isBlank(realName) && isBlank(username) && isBlank(roleText)) {
                    continue;
                }
                result.setTotalRows(result.getTotalRows() + 1);
                try {
                    String roleCode = resolveRoleCode(roleText, roleNameCache);
                    Long deptId = null;
                    Long groupId = null;

                    if (!"SYS_ADMIN".equals(roleCode) && !"LEADER".equals(roleCode)) {
                        if (isBlank(deptName)) {
                            throw new BusinessException(400, "Department is required for this role");
                        }
                        SysDepartment department = getOrCreateDepartment(deptName, deptCache);
                        deptId = department.getId();
                    }

                    if ("EMPLOYEE".equals(roleCode) || "GROUP_LEADER".equals(roleCode)) {
                        if (isBlank(groupName)) {
                            throw new BusinessException(400, "Grid is required for this role");
                        }
                        SysGroup group = getOrCreateGroup(groupName, deptId, groupCache);
                        groupId = group.getId();
                    } else if (!isBlank(groupName) && deptId != null) {
                        SysGroup group = getOrCreateGroup(groupName, deptId, groupCache);
                        groupId = group.getId();
                    }

                    upsertUser(username, realName, roleCode, deptId, groupId, phone, result);
                    result.setSuccessCount(result.getSuccessCount() + 1);
                } catch (BusinessException ex) {
                    result.setFailedCount(result.getFailedCount() + 1);
                    result.getErrors().add("Row " + (i + 1) + ": " + ex.getMessage());
                } catch (Exception ex) {
                    result.setFailedCount(result.getFailedCount() + 1);
                    result.getErrors().add("Row " + (i + 1) + ": " + ex.getMessage());
                }
            }
        } catch (IOException ex) {
            throw new BusinessException(400, "Failed to read uploaded file");
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(400, "Invalid Excel format");
        }
        return result;
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
        if (isBlank(newPassword)) {
            throw new BusinessException(400, "New password cannot be empty");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        updateById(user);
    }

    public void resetPasswords(List<Long> userIds, String newPassword) {
        if (userIds == null || userIds.isEmpty()) {
            throw new BusinessException(400, "User ids cannot be empty");
        }
        if (isBlank(newPassword)) {
            throw new BusinessException(400, "New password cannot be empty");
        }
        List<SysUser> users = listByIds(userIds);
        for (SysUser user : users) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        if (!users.isEmpty()) {
            updateBatchById(users);
        }
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

    private Map<String, String> buildRoleNameCache() {
        Map<String, String> roleCache = new HashMap<>();
        List<SysRole> roles = roleService.listEnabled();
        for (SysRole role : roles) {
            if (role.getRoleCode() != null) {
                roleCache.put(role.getRoleCode().trim().toUpperCase(Locale.ROOT), role.getRoleCode().trim().toUpperCase(Locale.ROOT));
            }
            if (role.getRoleName() != null && role.getRoleCode() != null) {
                roleCache.put(role.getRoleName().trim(), role.getRoleCode().trim().toUpperCase(Locale.ROOT));
            }
        }
        roleCache.put("\u666e\u901a\u5458\u5de5", "EMPLOYEE");
        roleCache.put("\u5458\u5de5", "EMPLOYEE");
        roleCache.put("\u7f51\u683c\u957f", "GROUP_LEADER");
        roleCache.put("\u7f51\u683c\u8d1f\u8d23\u4eba", "GROUP_LEADER");
        roleCache.put("\u5c0f\u7ec4\u8d1f\u8d23\u4eba", "GROUP_LEADER");
        roleCache.put("\u90e8\u95e8\u8d1f\u8d23\u4eba", "DEPT_LEADER");
        roleCache.put("\u5206\u7ba1\u9886\u5bfc", "DEPT_LEADER");
        roleCache.put("\u5355\u4f4d\u9886\u5bfc", "LEADER");
        roleCache.put("\u9886\u5bfc", "LEADER");
        roleCache.put("\u7cfb\u7edf\u7ba1\u7406\u5458", "SYS_ADMIN");
        roleCache.put("\u7ba1\u7406\u5458", "SYS_ADMIN");
        return roleCache;
    }

    private String resolveRoleCode(String roleText, Map<String, String> roleNameCache) {
        if (isBlank(roleText)) {
            throw new BusinessException(400, "Role is required");
        }
        String raw = roleText.trim();
        String upper = raw.toUpperCase(Locale.ROOT);
        if (roleNameCache.containsKey(raw)) {
            return roleNameCache.get(raw);
        }
        if (roleNameCache.containsKey(upper)) {
            return roleNameCache.get(upper);
        }
        throw new BusinessException(400, "Role not supported: " + raw);
    }

    private SysDepartment getOrCreateDepartment(String deptName, Map<String, SysDepartment> deptCache) {
        String key = deptName.trim();
        if (deptCache.containsKey(key)) {
            return deptCache.get(key);
        }
        SysDepartment dept = deptMapper.selectOne(new LambdaQueryWrapper<SysDepartment>()
                .eq(SysDepartment::getDeptName, key)
                .last("limit 1"));
        if (dept == null) {
            dept = new SysDepartment();
            dept.setDeptName(key);
            dept.setStatus(1);
            dept.setSortOrder(0);
            deptMapper.insert(dept);
        }
        deptCache.put(key, dept);
        return dept;
    }

    private SysGroup getOrCreateGroup(String groupName, Long deptId, Map<String, SysGroup> groupCache) {
        if (deptId == null) {
            throw new BusinessException(400, "Department is required before grid");
        }
        String name = groupName.trim();
        String key = deptId + "::" + name;
        if (groupCache.containsKey(key)) {
            return groupCache.get(key);
        }
        SysGroup group = groupMapper.selectOne(new LambdaQueryWrapper<SysGroup>()
                .eq(SysGroup::getDeptId, deptId)
                .eq(SysGroup::getGroupName, name)
                .last("limit 1"));
        if (group == null) {
            group = new SysGroup();
            group.setDeptId(deptId);
            group.setGroupName(name);
            group.setStatus(1);
            group.setSortOrder(0);
            groupMapper.insert(group);
        }
        groupCache.put(key, group);
        return group;
    }

    private void upsertUser(String username,
                            String realName,
                            String roleCode,
                            Long deptId,
                            Long groupId,
                            String phone,
                            UserImportResultVO result) {
        if (isBlank(username)) {
            throw new BusinessException(400, "Username is required");
        }
        if (isBlank(realName)) {
            throw new BusinessException(400, "Real name is required");
        }
        roleService.validateAssignableRole(roleCode);

        SysUser existing = getOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username.trim())
                .last("limit 1"));
        if (existing == null) {
            SysUser user = new SysUser();
            user.setUsername(username.trim());
            user.setRealName(realName.trim());
            user.setRole(roleCode);
            user.setDeptId(deptId);
            user.setGroupId(groupId);
            user.setPhone(isBlank(phone) ? null : phone.trim());
            user.setStatus(1);
            user.setPassword(passwordEncoder.encode(DEFAULT_IMPORT_PASSWORD));
            save(user);
            result.setCreatedCount(result.getCreatedCount() + 1);
            return;
        }
        existing.setRealName(realName.trim());
        existing.setRole(roleCode);
        existing.setDeptId(deptId);
        existing.setGroupId(groupId);
        existing.setPhone(isBlank(phone) ? null : phone.trim());
        if (existing.getStatus() == null) {
            existing.setStatus(1);
        }
        updateById(existing);
        result.setUpdatedCount(result.getUpdatedCount() + 1);
    }

    private String readCell(Row row, int index, DataFormatter formatter) {
        if (row.getCell(index) == null) {
            return "";
        }
        return formatter.formatCellValue(row.getCell(index)).trim();
    }

    private boolean isBlank(String text) {
        return text == null || text.trim().isEmpty();
    }
}
