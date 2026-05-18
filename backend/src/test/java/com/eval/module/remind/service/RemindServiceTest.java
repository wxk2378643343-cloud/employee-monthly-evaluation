package com.eval.module.remind.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.remind.entity.RemindRecord;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RemindServiceTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void remindUnscoredCreatesRecords() {
        EvalScoreAssignMapper assignMapper = mock(EvalScoreAssignMapper.class);
        PeriodService periodService = mock(PeriodService.class);
        UserService userService = mock(UserService.class);
        DingTalkService dingTalkService = mock(DingTalkService.class);
        RemindService service = spy(new RemindService(assignMapper, periodService, userService, dingTalkService));

        EvalScoreAssign a = new EvalScoreAssign();
        a.setPeriodId(1L);
        a.setStatus(0);
        a.setScorerId(3L);
        when(assignMapper.selectList(any())).thenReturn(Collections.singletonList(a));
        EvalPeriod p = new EvalPeriod();
        p.setPeriodName("P");
        when(periodService.getById(1L)).thenReturn(p);
        SysUser u = new SysUser();
        u.setId(3L);
        u.setRealName("U");
        when(userService.getById(3L)).thenReturn(u);
        when(dingTalkService.sendTextMessage(anyString())).thenReturn(true);
        doReturn(null).when(service).getOne(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).save(any(RemindRecord.class));

        service.remindUnscored(1L);
        verify(service).save(any(RemindRecord.class));
    }

    @Test
    void remindUnscoredUpdatesExistingScoreRecordInsteadOfCreatingDuplicate() {
        EvalScoreAssignMapper assignMapper = mock(EvalScoreAssignMapper.class);
        PeriodService periodService = mock(PeriodService.class);
        UserService userService = mock(UserService.class);
        DingTalkService dingTalkService = mock(DingTalkService.class);
        RemindService service = spy(new RemindService(assignMapper, periodService, userService, dingTalkService));

        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setPeriodId(1L);
        assign.setStatus(0);
        assign.setScorerId(3L);
        when(assignMapper.selectList(any())).thenReturn(Collections.singletonList(assign));
        EvalPeriod period = new EvalPeriod();
        period.setPeriodName("P");
        when(periodService.getById(1L)).thenReturn(period);
        SysUser user = new SysUser();
        user.setId(3L);
        user.setRealName("U");
        when(userService.getById(3L)).thenReturn(user);
        when(dingTalkService.sendTextMessage(anyString())).thenReturn(true);

        RemindRecord existing = new RemindRecord();
        existing.setId(99L);
        existing.setPeriodId(1L);
        existing.setUserId(3L);
        existing.setRemindType("SCORE");
        doReturn(existing).when(service).getOne(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).updateById(existing);

        service.remindUnscored(1L);

        verify(service, never()).save(any(RemindRecord.class));
        verify(service).updateById(existing);
        assertEquals("DINGTALK", existing.getRemindWay());
        assertEquals(1, existing.getSendStatus());
    }

    @Test
    void listAndUnreadAndReadFlow() {
        EvalScoreAssignMapper assignMapper = mock(EvalScoreAssignMapper.class);
        PeriodService periodService = mock(PeriodService.class);
        UserService userService = mock(UserService.class);
        RemindService service = spy(new RemindService(assignMapper, periodService, userService, mock(DingTalkService.class)));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(7L, null, "ROLE_TEST"));

        RemindRecord r1 = new RemindRecord();
        r1.setId(1L);
        r1.setUserId(7L);
        r1.setPeriodId(9L);
        r1.setRemindType("SCORE");
        RemindRecord r2 = new RemindRecord();
        r2.setId(2L);
        r2.setUserId(7L);
        r2.setPeriodId(9L);
        r2.setRemindType("VOTE");
        doReturn(Arrays.asList(r1, r2)).when(service).list(any(LambdaQueryWrapper.class));
        doReturn(r1).when(service).getById(1L);
        when(periodService.getById(9L)).thenReturn(null);

        assertEquals(2, service.listCurrentUser(null).size());
        assertEquals(2, service.unreadCountForCurrentUser());
        service.markReadForCurrentUser(1L);
        assertEquals(1, service.listCurrentUserUnread().size());
        service.markAllReadForCurrentUser();
        assertEquals(0, service.unreadCountForCurrentUser());
    }

    @Test
    void markReadThrowsWhenNotFoundOrNotOwner() {
        RemindService service = spy(new RemindService(mock(EvalScoreAssignMapper.class), mock(PeriodService.class),
                mock(UserService.class), mock(DingTalkService.class)));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(7L, null, "ROLE_TEST"));
        doReturn(null).when(service).getById(1L);
        assertThrows(BusinessException.class, () -> service.markReadForCurrentUser(1L));
    }
}
