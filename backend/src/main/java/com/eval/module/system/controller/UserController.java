package com.eval.module.system.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eval.common.result.Result;
import com.eval.module.system.dto.UserInfoVO;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<SysUser>> pageUsers(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String keyword) {
        return Result.success(userService.pageUsers(pageNum, pageSize, deptId, keyword));
    }

    @GetMapping("/{id}")
    public Result<UserInfoVO> getUserInfo(@PathVariable Long id) {
        return Result.success(userService.getUserInfo(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> createUser(@RequestBody SysUser user) {
        userService.createUser(user);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateUser(@PathVariable Long id, @RequestBody SysUser user) {
        user.setId(id);
        user.setPassword(null); // prevent password update via this endpoint
        userService.updateById(user);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.removeById(id);
        return Result.success();
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> resetPassword(@PathVariable Long id, @RequestParam String newPassword) {
        userService.resetPassword(id, newPassword);
        return Result.success();
    }

    @GetMapping("/by-group/{groupId}")
    public Result<List<SysUser>> listByGroup(@PathVariable Long groupId) {
        return Result.success(userService.listByGroupId(groupId));
    }

    @GetMapping("/by-dept/{deptId}")
    public Result<List<SysUser>> listByDept(@PathVariable Long deptId) {
        return Result.success(userService.listByDeptId(deptId));
    }
}
