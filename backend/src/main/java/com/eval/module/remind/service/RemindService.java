package com.eval.module.remind.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
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
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RemindService extends ServiceImpl<RemindRecordMapper, RemindRecord> {

    private final EvalScoreAssignMapper assignMapper;
    private final PeriodService periodService;
    private final UserService userService;
    private final DingTalkService dingTalkService;

    public void remindUnscored(Long periodId) {
        // Find all unscored assignments
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
            SysUser user = userService.getById(userId);
            if (user == null) continue;

            String message = String.format("【评价提醒】%s，您在%s还有未完成的评价任务，请及时完成。",
                    user.getRealName(), periodName);

            boolean sent = dingTalkService.sendTextMessage(message);

            // Record the remind
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
}
