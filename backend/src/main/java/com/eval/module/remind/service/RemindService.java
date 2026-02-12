package com.eval.module.remind.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.remind.entity.RemindRecord;
import com.eval.module.remind.mapper.RemindRecordMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RemindService extends ServiceImpl<RemindRecordMapper, RemindRecord> {

    private final EvalScoreAssignMapper assignMapper;
    private final PeriodService periodService;
    private final UserService userService;
    private final DingTalkService dingTalkService;

    // userId -> read reminder ids
    private final Map<Long, Set<Long>> readIndex = new ConcurrentHashMap<>();

    public void remindUnscored(Long periodId) {
        List<EvalScoreAssign> unscoredAssigns = assignMapper.selectList(
                new LambdaQueryWrapper<EvalScoreAssign>()
                        .eq(EvalScoreAssign::getPeriodId, periodId)
                        .eq(EvalScoreAssign::getStatus, 0));

        Set<Long> unscoredUserIds = unscoredAssigns.stream()
                .map(EvalScoreAssign::getScorerId)
                .collect(Collectors.toSet());

        EvalPeriod period = periodService.getById(periodId);
        String periodName = period != null ? period.getPeriodName() : "Current period";

        for (Long userId : unscoredUserIds) {
            SysUser user = userService.getById(userId);
            if (user == null) continue;

            String content = String.format("[%s] You still have pending evaluation tasks.", periodName);
            boolean sent = dingTalkService.sendTextMessage(String.format("%s %s", user.getRealName(), content));

            RemindRecord record = new RemindRecord();
            record.setPeriodId(periodId);
            record.setUserId(userId);
            record.setRemindType("SCORE");
            record.setRemindWay("DINGTALK");
            record.setSendStatus(sent ? 1 : 2);
            record.setSendTime(LocalDateTime.now());
            save(record);
        }
    }

    public List<RemindRecord> listByPeriod(Long periodId) {
        return list(new LambdaQueryWrapper<RemindRecord>()
                .eq(RemindRecord::getPeriodId, periodId)
                .orderByDesc(RemindRecord::getCreateTime));
    }

    public List<Map<String, Object>> listCurrentUser(Long periodId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        LambdaQueryWrapper<RemindRecord> wrapper = new LambdaQueryWrapper<RemindRecord>()
                .eq(RemindRecord::getUserId, currentUserId)
                .orderByDesc(RemindRecord::getCreateTime);
        if (periodId != null) {
            wrapper.eq(RemindRecord::getPeriodId, periodId);
        }
        return toView(list(wrapper), currentUserId);
    }

    public List<Map<String, Object>> listCurrentUserUnread() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return toViewUnread(currentUserId);
    }

    public Long unreadCountForCurrentUser() {
        return (long) listCurrentUserUnread().size();
    }

    public void markReadForCurrentUser(Long remindId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        RemindRecord record = getById(remindId);
        if (record == null || !currentUserId.equals(record.getUserId())) {
            throw new BusinessException(404, "Reminder not found");
        }
        readIndex.computeIfAbsent(currentUserId, k -> ConcurrentHashMap.newKeySet()).add(remindId);
    }

    public void markAllReadForCurrentUser() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<RemindRecord> records = list(new LambdaQueryWrapper<RemindRecord>()
                .eq(RemindRecord::getUserId, currentUserId));
        Set<Long> readSet = readIndex.computeIfAbsent(currentUserId, k -> ConcurrentHashMap.newKeySet());
        records.forEach(r -> readSet.add(r.getId()));
    }

    private List<Map<String, Object>> toView(List<RemindRecord> records, Long userId) {
        Set<Long> readSet = readIndex.getOrDefault(userId, Collections.emptySet());
        return records.stream().map(record -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", record.getId());
            item.put("periodId", record.getPeriodId());
            item.put("remindType", record.getRemindType());
            item.put("remindWay", record.getRemindWay());
            item.put("sendStatus", record.getSendStatus());
            item.put("createTime", record.getCreateTime());
            item.put("sendTime", record.getSendTime());
            item.put("isRead", readSet.contains(record.getId()));
            item.put("remindContent", buildContent(record));
            return item;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> toViewUnread(Long userId) {
        return toView(list(new LambdaQueryWrapper<RemindRecord>()
                        .eq(RemindRecord::getUserId, userId)
                        .orderByDesc(RemindRecord::getCreateTime)), userId)
                .stream()
                .filter(item -> !(Boolean) item.get("isRead"))
                .collect(Collectors.toList());
    }

    private String buildContent(RemindRecord record) {
        String typeLabel = "SCORE".equals(record.getRemindType()) ? "Score task" : "Vote task";
        EvalPeriod period = periodService.getById(record.getPeriodId());
        String periodName = period != null ? period.getPeriodName() : "Current period";
        return String.format("%s reminder for %s", typeLabel, periodName);
    }
}
