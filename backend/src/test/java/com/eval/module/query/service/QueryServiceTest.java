package com.eval.module.query.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.score.entity.EvalDetail;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalDetailMapper;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.GroupService;
import com.eval.module.system.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class QueryServiceTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getMyHistoryAndHistoryByUser() {
        EvalRecordMapper recordMapper = mock(EvalRecordMapper.class);
        EvalRecord record = new EvalRecord();
        record.setId(1L);
        record.setPeriodId(9L);
        when(recordMapper.selectList(any())).thenReturn(Collections.singletonList(record));
        PeriodService periodService = mock(PeriodService.class);
        EvalPeriod p = new EvalPeriod();
        p.setPeriodName("2026-01");
        when(periodService.getById(9L)).thenReturn(p);

        QueryService service = new QueryService(recordMapper, mock(EvalDetailMapper.class), periodService,
                mock(UserService.class), mock(DeptService.class), mock(GroupService.class), mock(EvalScoreAssignMapper.class));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(5L, null, "ROLE_TEST"));
        assertEquals(1, service.getMyHistory().size());
        assertEquals(1, service.getHistoryByUserId(3L).size());
    }

    @Test
    void getScoreDetailsPermissionBranches() {
        UserService userService = mock(UserService.class);
        QueryService service = new QueryService(mock(EvalRecordMapper.class), mock(EvalDetailMapper.class), mock(PeriodService.class),
                userService, mock(DeptService.class), mock(GroupService.class), mock(EvalScoreAssignMapper.class));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        when(userService.getById(1L)).thenReturn(null);
        assertThrows(BusinessException.class, () -> service.getScoreDetails(1L, 2L));

        SysUser me = new SysUser();
        me.setId(1L);
        me.setRole("EMPLOYEE");
        SysUser target = new SysUser();
        target.setId(2L);
        when(userService.getById(1L)).thenReturn(me);
        when(userService.getById(2L)).thenReturn(target);
        assertThrows(BusinessException.class, () -> service.getScoreDetails(1L, 2L));
    }

    @Test
    void getScoreDetailsAndRankingAndStatistics() {
        EvalDetailMapper detailMapper = mock(EvalDetailMapper.class);
        EvalRecordMapper recordMapper = mock(EvalRecordMapper.class);
        EvalScoreAssignMapper assignMapper = mock(EvalScoreAssignMapper.class);
        UserService userService = mock(UserService.class);
        QueryService service = new QueryService(recordMapper, detailMapper, mock(PeriodService.class),
                userService, mock(DeptService.class), mock(GroupService.class), assignMapper);

        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        SysUser me = new SysUser();
        me.setId(1L);
        me.setRole("ADMIN");
        when(userService.getById(1L)).thenReturn(me);
        SysUser target = new SysUser();
        target.setId(2L);
        target.setRealName("t");
        target.setDeptId(1L);
        target.setGroupId(2L);
        when(userService.getById(2L)).thenReturn(target);

        EvalDetail detail = new EvalDetail();
        detail.setId(7L);
        detail.setScorerId(2L);
        detail.setEvalType("PEER");
        detail.setScore(BigDecimal.TEN);
        when(detailMapper.selectList(any())).thenReturn(Collections.singletonList(detail));
        assertEquals(1, service.getScoreDetails(1L, 2L).size());

        EvalRecord record = new EvalRecord();
        record.setTargetId(2L);
        record.setDeptRank(1);
        record.setWeightedScore(BigDecimal.TEN);
        when(recordMapper.selectList(any())).thenReturn(Collections.singletonList(record));
        assertEquals(1, service.getDeptRanking(1L, null).size());

        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setTargetId(2L);
        when(assignMapper.selectList(any())).thenReturn(Collections.singletonList(assign));
        assertNotNull(service.getStatistics(1L));
    }
}
