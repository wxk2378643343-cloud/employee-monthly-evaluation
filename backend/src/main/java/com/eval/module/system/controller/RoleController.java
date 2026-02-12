package com.eval.module.system.controller;

import com.eval.common.result.Result;
import com.eval.module.system.entity.SysRole;
import com.eval.module.system.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public Result<List<SysRole>> listEnabled() {
        return Result.success(roleService.listEnabled());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('role:manage')")
    public Result<List<SysRole>> listAll() {
        return Result.success(roleService.listAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('role:manage')")
    public Result<Void> create(@RequestBody SysRole role) {
        roleService.createRole(role);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('role:manage')")
    public Result<Void> update(@PathVariable Long id, @RequestBody SysRole role) {
        roleService.updateRole(id, role);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('role:manage')")
    public Result<Void> delete(@PathVariable Long id) {
        roleService.deleteRole(id);
        return Result.success();
    }
}
