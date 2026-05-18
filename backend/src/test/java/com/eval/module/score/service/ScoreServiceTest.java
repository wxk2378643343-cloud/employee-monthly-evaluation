package com.eval.module.score.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.service.AssignService;
import com.eval.module.period.entity.EvalPeriod;
import com.eval.module.period.service.PeriodService;
import com.eval.module.score.dto.ScoreSubmitDTO;
import com.eval.module.score.entity.EvalDetail;
import com.eval.module.score.mapper.EvalDetailMapper;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.GroupService;
import com.eval.module.system.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ScoreServiceTest {

    @AfterEach
    void clearCtx() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getPendingListBuildsViewData() {
        EvalDetailMapper detailMapper = mock(EvalDetailMapper.class);
        AssignService assignService = mock(AssignService.class);
        UserService userService = mock(UserService.class);
        DeptService deptService = mock(DeptService.class);
        GroupService groupService = mock(GroupService.class);
        PeriodService periodService = mock(PeriodService.class);
        when(periodService.getById(8L)).thenReturn(activePeriod());
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));

        EvalScoreAssign a = new EvalScoreAssign();
        a.setId(9L);
        a.setTargetId(2L);
        a.setEvalType("PEER");
        a.setStatus(0);
        when(assignService.listByScorerAndPeriod(1L, 8L)).thenReturn(Collections.singletonList(a));
        SysUser target = new SysUser();
        target.setId(2L);
        target.setRealName("t");
        target.setDeptId(11L);
        target.setGroupId(12L);
        when(userService.getById(2L)).thenReturn(target);
        SysDepartment dept = new SysDepartment();
        dept.setDeptName("d");
        when(deptService.getById(11L)).thenReturn(dept);
        SysGroup group = new SysGroup();
        group.setGroupName("g");
        when(groupService.getById(12L)).thenReturn(group);

        ScoreService service = new ScoreService(detailMapper, assignService, mock(ScoreCalculateService.class),
                periodService, userService, deptService, groupService);
        assertEquals(1, service.getPendingList(8L).size());
    }

    @Test
    void getPendingListReturnsEmptyBeforePeriodStarts() {
        PeriodService periodService = mock(PeriodService.class);
        EvalPeriod period = activePeriod();
        period.setStatus(0);
        when(periodService.getById(8L)).thenReturn(period);
        AssignService assignService = mock(AssignService.class);
        ScoreService service = new ScoreService(mock(EvalDetailMapper.class), assignService,
                mock(ScoreCalculateService.class), periodService, mock(UserService.class), mock(DeptService.class),
                mock(GroupService.class));

        assertTrue(service.getPendingList(8L).isEmpty());
        verify(assignService, never()).listByScorerAndPeriod(any(), any());
    }

    @Test
    void submitScoreThrowsWhenAssignMissing() {
        PeriodService periodService = mock(PeriodService.class);
        when(periodService.getById(1L)).thenReturn(activePeriod());
        ScoreService service = new ScoreService(mock(EvalDetailMapper.class), mock(AssignService.class),
                mock(ScoreCalculateService.class), periodService, mock(UserService.class), mock(DeptService.class),
                mock(GroupService.class));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        ScoreSubmitDTO dto = new ScoreSubmitDTO();
        dto.setPeriodId(1L);
        dto.setTargetId(2L);
        dto.setEvalType("PEER");
        assertThrows(BusinessException.class, () -> service.submitScore(dto));
    }

    @Test
    void submitScoreUpdateAndInsertBranches() {
        EvalDetailMapper detailMapper = mock(EvalDetailMapper.class);
        AssignService assignService = mock(AssignService.class);
        PeriodService periodService = mock(PeriodService.class);
        when(periodService.getById(1L)).thenReturn(activePeriod());
        ScoreService service = spy(new ScoreService(detailMapper, assignService,
                mock(ScoreCalculateService.class), periodService, mock(UserService.class), mock(DeptService.class),
                mock(GroupService.class)));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));

        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setId(1L);
        when(assignService.getOne(any())).thenReturn(assign);
        ScoreSubmitDTO dto = new ScoreSubmitDTO();
        dto.setPeriodId(1L);
        dto.setTargetId(2L);
        dto.setEvalType("PEER");
        dto.setScore(BigDecimal.TEN);
        dto.setComment("c");

        EvalDetail existing = new EvalDetail();
        existing.setId(3L);
        when(detailMapper.selectOne(any())).thenReturn(existing);
        service.submitScore(dto);
        verify(detailMapper).updateById(existing);
        verify(assignService).updateById(assign);

        when(detailMapper.selectOne(any())).thenReturn(null);
        service.submitScore(dto);
        verify(detailMapper).insert(any(EvalDetail.class));
    }

    @Test
    void batchSubmitDelegatesPerItem() {
        ScoreService service = spy(new ScoreService(mock(EvalDetailMapper.class), mock(AssignService.class),
                mock(ScoreCalculateService.class), mock(PeriodService.class), mock(UserService.class),
                mock(DeptService.class), mock(GroupService.class)));
        doNothing().when(service).submitScore(any(ScoreSubmitDTO.class));
        service.batchSubmitScores(Arrays.asList(new ScoreSubmitDTO(), new ScoreSubmitDTO()));
        verify(service, times(2)).submitScore(any(ScoreSubmitDTO.class));
    }

    @Test
    void submitScoreRejectsInactivePeriod() {
        PeriodService periodService = mock(PeriodService.class);
        EvalPeriod period = activePeriod();
        period.setStatus(0);
        when(periodService.getById(1L)).thenReturn(period);
        ScoreService service = new ScoreService(mock(EvalDetailMapper.class), mock(AssignService.class),
                mock(ScoreCalculateService.class), periodService, mock(UserService.class), mock(DeptService.class),
                mock(GroupService.class));
        ScoreSubmitDTO dto = new ScoreSubmitDTO();
        dto.setPeriodId(1L);
        assertThrows(BusinessException.class, () -> service.submitScore(dto));
    }

    private EvalPeriod activePeriod() {
        EvalPeriod period = new EvalPeriod();
        period.setId(1L);
        period.setStatus(1);
        period.setStartTime(LocalDateTime.now().minusDays(1));
        period.setEndTime(LocalDateTime.now().plusDays(1));
        return period;
    }
}
