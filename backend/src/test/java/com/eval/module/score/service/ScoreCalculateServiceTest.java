package com.eval.module.score.service;

import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.admin.mapper.EvalScoreAssignMapper;
import com.eval.module.score.entity.EvalDetail;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalDetailMapper;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ScoreCalculateServiceTest {

    @Test
    void calculateScoresCoversInsertAndDeptRanking() {
        EvalDetailMapper detailMapper = mock(EvalDetailMapper.class);
        EvalRecordMapper recordMapper = mock(EvalRecordMapper.class);
        EvalScoreAssignMapper assignMapper = mock(EvalScoreAssignMapper.class);
        UserService userService = mock(UserService.class);
        ScoreCalculateService service = new ScoreCalculateService(detailMapper, recordMapper, assignMapper, userService);

        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setPeriodId(1L);
        assign.setTargetId(10L);
        assign.setEvalType("PEER");
        assign.setWeight(BigDecimal.valueOf(30));
        doReturn(Collections.singletonList(assign))
                .doReturn(Collections.singletonList(assign))
                .when(assignMapper).selectList(any());

        EvalDetail detail = new EvalDetail();
        detail.setEvalType("PEER");
        detail.setScore(BigDecimal.valueOf(90));
        when(detailMapper.selectList(any())).thenReturn(Collections.singletonList(detail));
        when(recordMapper.selectOne(any())).thenReturn(null);

        List<EvalRecord> deptRecords = Arrays.asList(
                record(1L, 10L, 95), record(2L, 11L, 94), record(3L, 12L, 93), record(4L, 13L, 92), record(5L, 14L, 91)
        );
        when(recordMapper.selectList(any())).thenReturn(deptRecords);
        when(userService.getById(10L)).thenReturn(user(1L));
        when(userService.getById(11L)).thenReturn(user(1L));
        when(userService.getById(12L)).thenReturn(user(1L));
        when(userService.getById(13L)).thenReturn(user(1L));
        when(userService.getById(14L)).thenReturn(user(1L));

        service.calculateScores(1L);
        verify(recordMapper).insert(any(EvalRecord.class));
        verify(recordMapper, atLeastOnce()).updateById(any(EvalRecord.class));
    }

    @Test
    void calculateScoresCoversUpdateBranch() {
        EvalDetailMapper detailMapper = mock(EvalDetailMapper.class);
        EvalRecordMapper recordMapper = mock(EvalRecordMapper.class);
        EvalScoreAssignMapper assignMapper = mock(EvalScoreAssignMapper.class);
        UserService userService = mock(UserService.class);
        ScoreCalculateService service = new ScoreCalculateService(detailMapper, recordMapper, assignMapper, userService);

        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setPeriodId(1L);
        assign.setTargetId(10L);
        assign.setEvalType("SELF");
        assign.setWeight(BigDecimal.valueOf(100));
        doReturn(Collections.singletonList(assign))
                .doReturn(Collections.singletonList(assign))
                .when(assignMapper).selectList(any());

        EvalDetail detail = new EvalDetail();
        detail.setEvalType("SELF");
        detail.setScore(BigDecimal.valueOf(80));
        when(detailMapper.selectList(any())).thenReturn(Collections.singletonList(detail));

        EvalRecord existing = new EvalRecord();
        existing.setId(100L);
        when(recordMapper.selectOne(any())).thenReturn(existing);
        when(recordMapper.selectList(any())).thenReturn(Collections.emptyList());

        service.calculateScores(1L);
        verify(recordMapper, never()).insert(any(EvalRecord.class));
        verify(recordMapper, atLeastOnce()).updateById(any(EvalRecord.class));
    }

    private static EvalRecord record(Long id, Long targetId, int score) {
        EvalRecord r = new EvalRecord();
        r.setId(id);
        r.setTargetId(targetId);
        r.setWeightedScore(BigDecimal.valueOf(score));
        return r;
    }

    private static SysUser user(Long deptId) {
        SysUser u = new SysUser();
        u.setDeptId(deptId);
        return u;
    }
}
