package com.eval.module.system.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eval.common.exception.BusinessException;
import com.eval.common.result.Result;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.system.dto.UserImportResultVO;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('user:manage')")
    public Result<Page<SysUser>> pageUsers(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String keyword) {
        return Result.success(userService.pageUsers(pageNum, pageSize, deptId, keyword));
    }

    @GetMapping("/{id}")
    public Result<UserInfoVO> getUserInfo(@PathVariable Long id) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        SysUser currentUser = userService.getById(currentUserId);
        SysUser targetUser = userService.getById(id);
        if (currentUser == null || targetUser == null) {
            throw new BusinessException(404, "User not found");
        }
        if (!canViewUser(currentUserId, currentUser, targetUser)) {
            throw new BusinessException(403, "No permission to view this user");
        }
        return Result.success(userService.getUserInfo(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('user:manage')")
    public Result<Void> createUser(@RequestBody SysUser user) {
        userService.createUser(user);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('user:manage')")
    public Result<Void> updateUser(@PathVariable Long id, @RequestBody SysUser user) {
        user.setId(id);
        userService.updateUser(user);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('user:manage')")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.removeById(id);
        return Result.success();
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('user:manage')")
    public Result<Void> resetPassword(@PathVariable Long id, @RequestParam String newPassword) {
        userService.resetPassword(id, newPassword);
        return Result.success();
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('user:manage')")
    public Result<UserImportResultVO> importUsers(@RequestParam("file") MultipartFile file) {
        return Result.success(userService.importUsersFromExcel(file));
    }

    @GetMapping("/by-group/{groupId}")
    @PreAuthorize("hasAuthority('user:group:view')")
    public Result<List<SysUser>> listByGroup(@PathVariable Long groupId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        SysUser currentUser = userService.getById(currentUserId);
        if (currentUser == null) {
            throw new BusinessException(401, "User not found");
        }
        if ("GROUP_LEADER".equals(currentUser.getRole()) && !groupId.equals(currentUser.getGroupId())) {
            throw new BusinessException(403, "No permission to view this group");
        }
        return Result.success(userService.listByGroupId(groupId));
    }

    @GetMapping("/by-dept/{deptId}")
    @PreAuthorize("hasAuthority('user:dept:view')")
    public Result<List<SysUser>> listByDept(@PathVariable Long deptId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        SysUser currentUser = userService.getById(currentUserId);
        if (currentUser == null) {
            throw new BusinessException(401, "User not found");
        }
        if ("DEPT_LEADER".equals(currentUser.getRole()) && !deptId.equals(currentUser.getDeptId())) {
            throw new BusinessException(403, "No permission to view this department");
        }
        return Result.success(userService.listByDeptId(deptId));
    }

    private boolean canViewUser(Long currentUserId, SysUser currentUser, SysUser targetUser) {
        if (currentUserId.equals(targetUser.getId())) {
            return true;
        }
        if ("ADMIN".equals(currentUser.getRole())) {
            return true;
        }
        if ("DEPT_LEADER".equals(currentUser.getRole())) {
            return currentUser.getDeptId() != null && currentUser.getDeptId().equals(targetUser.getDeptId());
        }
        if ("GROUP_LEADER".equals(currentUser.getRole())) {
            return currentUser.getGroupId() != null && currentUser.getGroupId().equals(targetUser.getGroupId());
        }
        return false;
    }
}
