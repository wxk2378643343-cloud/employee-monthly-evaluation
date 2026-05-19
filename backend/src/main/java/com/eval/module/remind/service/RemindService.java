package com.eval.module.remind.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.eval.common.exception.BusinessException;
import com.eval.common.utils.SecurityUtils;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.remind.dto.NoticeUpdateDTO;
import com.eval.module.remind.dto.PublishMessageDTO;
import com.eval.module.remind.entity.Notice;
import com.eval.module.remind.entity.RemindRecord;
import com.eval.module.remind.mapper.NoticeMapper;
import com.eval.module.remind.mapper.RemindRecordMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final NoticeMapper noticeMapper;

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
        String periodName = period != null ? period.getPeriodName() : "当前周期";

        for (Long userId : unscoredUserIds) {
            sendScoreRemind(periodId, periodName, userId);
        }
    }

    public void remindSingleUser(Long periodId, Long userId) {
        Long pendingCount = assignMapper.selectCount(new LambdaQueryWrapper<EvalScoreAssign>()
                .eq(EvalScoreAssign::getPeriodId, periodId)
                .eq(EvalScoreAssign::getScorerId, userId)
                .eq(EvalScoreAssign::getStatus, 0));
        if (pendingCount == null || pendingCount <= 0) {
            throw new BusinessException(400, "该用户当前没有待评分任务");
        }
        EvalPeriod period = periodService.getById(periodId);
        String periodName = period != null ? period.getPeriodName() : "当前周期";
        sendScoreRemind(periodId, periodName, userId);
    }

    @Transactional(rollbackFor = Exception.class)
    public void publishMessage(PublishMessageDTO dto) {
        String content = dto.getContent() == null ? "" : dto.getContent().trim();
        if (content.isEmpty()) {
            throw new BusinessException(400, "消息内容不能为空");
        }

        List<Long> userIds = dto.getUserIds() == null ? Collections.emptyList() : dto.getUserIds();
        if (userIds.isEmpty()) {
            throw new BusinessException(400, "接收人不能为空");
        }

        LocalDateTime now = LocalDateTime.now();
        Notice notice = new Notice();
        notice.setPeriodId(dto.getPeriodId());
        notice.setContent(content);
        notice.setStatus(1);
        notice.setCreatedBy(SecurityUtils.getCurrentUserId());
        noticeMapper.insert(notice);

        List<RemindRecord> records = new ArrayList<>();
        for (Long userId : new LinkedHashSet<>(userIds)) {
            SysUser user = userService.getById(userId);
            if (user == null || user.getStatus() == null || user.getStatus() != 1) {
                continue;
            }
            RemindRecord record = new RemindRecord();
            record.setPeriodId(dto.getPeriodId());
            record.setUserId(userId);
            record.setNoticeId(notice.getId());
            record.setRemindType("NOTICE");
            record.setRemindWay("SYSTEM");
            record.setSendStatus(1);
            record.setContent(content);
            record.setSendTime(now);
            records.add(record);
        }

        if (records.isEmpty()) {
            throw new BusinessException(400, "没有可发布的接收人");
        }
        saveBatch(records);
    }

    public List<Notice> listNotices(Long periodId) {
        return noticeMapper.selectList(new LambdaQueryWrapper<Notice>()
                .eq(periodId != null, Notice::getPeriodId, periodId)
                .orderByDesc(Notice::getCreateTime));
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateNotice(Long noticeId, NoticeUpdateDTO dto) {
        Notice notice = noticeMapper.selectById(noticeId);
        if (notice == null) {
            throw new BusinessException(404, "Notice not found");
        }
        if (!Integer.valueOf(1).equals(notice.getStatus())) {
            throw new BusinessException(400, "Notice has been recalled");
        }
        String content = dto.getContent() == null ? "" : dto.getContent().trim();
        if (content.isEmpty()) {
            throw new BusinessException(400, "Message content cannot be empty");
        }
        notice.setContent(content);
        noticeMapper.updateById(notice);

        List<RemindRecord> records = list(new LambdaQueryWrapper<RemindRecord>()
                .eq(RemindRecord::getNoticeId, noticeId)
                .eq(RemindRecord::getRemindType, "NOTICE"));
        for (RemindRecord record : records) {
            record.setContent(content);
        }
        if (!records.isEmpty()) {
            updateBatchById(records);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void recallNotice(Long noticeId) {
        Notice notice = noticeMapper.selectById(noticeId);
        if (notice == null) {
            throw new BusinessException(404, "Notice not found");
        }
        if (!Integer.valueOf(1).equals(notice.getStatus())) {
            return;
        }
        notice.setStatus(0);
        notice.setRecalledTime(LocalDateTime.now());
        noticeMapper.updateById(notice);

        List<RemindRecord> records = list(new LambdaQueryWrapper<RemindRecord>()
                .eq(RemindRecord::getNoticeId, noticeId)
                .eq(RemindRecord::getRemindType, "NOTICE"));
        for (RemindRecord record : records) {
            removeById(record.getId());
            Set<Long> readSet = readIndex.get(record.getUserId());
            if (readSet != null) {
                readSet.remove(record.getId());
            }
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
            throw new BusinessException(404, "提醒记录不存在");
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

    public void markUnreadForCurrentUser(Long remindId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        RemindRecord record = getById(remindId);
        if (record == null || !currentUserId.equals(record.getUserId())) {
            throw new BusinessException(404, "提醒记录不存在");
        }
        Set<Long> readSet = readIndex.computeIfAbsent(currentUserId, k -> ConcurrentHashMap.newKeySet());
        readSet.remove(remindId);
    }

    private List<Map<String, Object>> toView(List<RemindRecord> records, Long userId) {
        Set<Long> readSet = readIndex.getOrDefault(userId, Collections.emptySet());
        return records.stream().map(record -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", record.getId());
            item.put("periodId", record.getPeriodId());
            item.put("noticeId", record.getNoticeId());
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
        if ("NOTICE".equals(record.getRemindType()) && record.getContent() != null && !record.getContent().trim().isEmpty()) {
            return record.getContent();
        }
        String typeLabel = "SCORE".equals(record.getRemindType()) ? "评分任务" : "投票任务";
        EvalPeriod period = periodService.getById(record.getPeriodId());
        String periodName = period != null ? period.getPeriodName() : "当前周期";
        return String.format("[%s] %s提醒，请及时处理。", periodName, typeLabel);
    }

    private void sendScoreRemind(Long periodId, String periodName, Long userId) {
        SysUser user = userService.getById(userId);
        if (user == null) {
            return;
        }
        String content = String.format("[%s] 你还有待完成的评分任务，请及时处理。", periodName);
        boolean sent = dingTalkService.sendTextMessage(String.format("%s %s", user.getRealName(), content));
        LocalDateTime now = LocalDateTime.now();

        RemindRecord record = getOne(new LambdaQueryWrapper<RemindRecord>()
                .eq(RemindRecord::getPeriodId, periodId)
                .eq(RemindRecord::getUserId, userId)
                .eq(RemindRecord::getRemindType, "SCORE")
                .last("limit 1"));
        boolean isNew = record == null;
        if (isNew) {
            record = new RemindRecord();
        }
        record.setPeriodId(periodId);
        record.setUserId(userId);
        record.setRemindType("SCORE");
        record.setRemindWay("DINGTALK");
        record.setSendStatus(sent ? 1 : 2);
        record.setContent(content);
        record.setSendTime(now);
        if (isNew) {
            save(record);
        } else {
            updateById(record);
            Set<Long> readSet = readIndex.get(userId);
            if (readSet != null) {
                readSet.remove(record.getId());
            }
        }
    }
}
