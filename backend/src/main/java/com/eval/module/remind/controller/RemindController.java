package com.eval.module.remind.controller;

import com.eval.common.result.Result;
import com.eval.module.remind.dto.PublishMessageDTO;
import com.eval.module.remind.entity.RemindRecord;
import com.eval.module.remind.service.RemindService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reminds")
@RequiredArgsConstructor
public class RemindController {

    private final RemindService remindService;

    @PostMapping("/send/{periodId}")
    @PreAuthorize("hasAuthority('remind:manage')")
    public Result<Void> sendRemind(@PathVariable Long periodId) {
        remindService.remindUnscored(periodId);
        return Result.success();
    }

    @PostMapping("/send/{periodId}/user/{userId}")
    @PreAuthorize("hasAuthority('remind:manage')")
    public Result<Void> sendUserRemind(@PathVariable Long periodId, @PathVariable Long userId) {
        remindService.remindSingleUser(periodId, userId);
        return Result.success();
    }

    @PostMapping("/publish")
    @PreAuthorize("hasAuthority('remind:manage')")
    public Result<Void> publishMessage(@Valid @RequestBody PublishMessageDTO dto) {
        remindService.publishMessage(dto);
        return Result.success();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('remind:manage')")
    public Result<List<RemindRecord>> listByPeriod(@RequestParam Long periodId) {
        return Result.success(remindService.listByPeriod(periodId));
    }

    @GetMapping("/mine")
    public Result<List<Map<String, Object>>> listMine(@RequestParam(required = false) Long periodId) {
        return Result.success(remindService.listCurrentUser(periodId));
    }

    @GetMapping("/unread")
    public Result<List<Map<String, Object>>> listUnread() {
        return Result.success(remindService.listCurrentUserUnread());
    }

    @GetMapping("/unread-count")
    public Result<Long> unreadCount() {
        return Result.success(remindService.unreadCountForCurrentUser());
    }

    @PostMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id) {
        remindService.markReadForCurrentUser(id);
        return Result.success();
    }

    @PostMapping("/read-all")
    public Result<Void> markAllRead() {
        remindService.markAllReadForCurrentUser();
        return Result.success();
    }

    @PostMapping("/{id}/unread")
    public Result<Void> markUnread(@PathVariable Long id) {
        remindService.markUnreadForCurrentUser(id);
        return Result.success();
    }
}
