package com.eval.module.system.controller;

import com.eval.common.result.Result;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public Result<List<SysGroup>> listAll() {
        return Result.success(groupService.listAll());
    }

    @GetMapping("/by-dept/{deptId}")
    public Result<List<SysGroup>> listByDept(@PathVariable Long deptId) {
        return Result.success(groupService.listByDeptId(deptId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> create(@RequestBody SysGroup group) {
        groupService.save(group);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> update(@PathVariable Long id, @RequestBody SysGroup group) {
        group.setId(id);
        groupService.updateById(group);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> delete(@PathVariable Long id) {
        groupService.removeById(id);
        return Result.success();
    }
}
