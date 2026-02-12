package com.eval.module.system.controller;

import com.eval.common.result.Result;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.service.DeptService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/depts")
@RequiredArgsConstructor
public class DeptController {

    private final DeptService deptService;

    @GetMapping
    public Result<List<SysDepartment>> listAll() {
        return Result.success(deptService.listAll());
    }

    @GetMapping("/{id}")
    public Result<SysDepartment> getById(@PathVariable Long id) {
        return Result.success(deptService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('dept:manage')")
    public Result<Void> create(@RequestBody SysDepartment dept) {
        deptService.save(dept);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('dept:manage')")
    public Result<Void> update(@PathVariable Long id, @RequestBody SysDepartment dept) {
        dept.setId(id);
        deptService.updateById(dept);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('dept:manage')")
    public Result<Void> delete(@PathVariable Long id) {
        deptService.removeById(id);
        return Result.success();
    }
}
