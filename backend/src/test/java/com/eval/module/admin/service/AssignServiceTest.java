package com.eval.module.admin.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.admin.dto.AssignDTO;
import com.eval.module.admin.dto.AssignGenerateRuleDTO;
import com.eval.module.admin.entity.EvalScoreAssign;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AssignServiceTest {

    @Test
    void listByPeriodAndTargetAndScorer() {
        UserService userService = mock(UserService.class);
        AssignService service = spy(new AssignService(userService));
        EvalScoreAssign assign = new EvalScoreAssign();
        assign.setId(1L);
        assign.setPeriodId(1L);
        assign.setScorerId(2L);
        assign.setTargetId(3L);
        assign.setEvalType("PEER");
        assign.setWeight(BigDecimal.ONE);
        doReturn(Collections.singletonList(assign)).when(service).list(any(LambdaQueryWrapper.class));
        SysUser scorer = new SysUser();
        scorer.setRealName("s");
        SysUser target = new SysUser();
        target.setRealName("t");
        when(userService.getById(2L)).thenReturn(scorer);
        when(userService.getById(3L)).thenReturn(target);
        assertEquals(1, service.listByPeriod(1L).size());
        assertEquals(1, service.listByPeriodAndTarget(1L, 3L).size());
        assertEquals(1, service.listByScorerAndPeriod(2L, 1L).size());
    }

    @Test
    void saveAssignAndBatchSave() {
        AssignService service = spy(new AssignService(mock(UserService.class)));
        AssignDTO dto = new AssignDTO();
        dto.setPeriodId(1L);
        dto.setScorerId(2L);
        dto.setTargetId(3L);
        dto.setEvalType("PEER");
        dto.setWeight(BigDecimal.TEN);

        EvalScoreAssign existing = new EvalScoreAssign();
        doReturn(existing).when(service).getOne(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).updateById(existing);
        service.saveAssign(dto);
        verify(service).updateById(existing);

        doReturn(null).when(service).getOne(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).save(any(EvalScoreAssign.class));
        service.saveAssign(dto);
        verify(service).save(any(EvalScoreAssign.class));

        clearInvocations(service);
        doNothing().when(service).saveAssign(any(AssignDTO.class));
        service.batchSaveAssigns(Arrays.asList(dto, dto));
        verify(service, times(2)).saveAssign(any(AssignDTO.class));
    }

    @Test
    void copyAssignsAndRemoveByPeriodAndGenerateValidation() {
        AssignService service = spy(new AssignService(mock(UserService.class)));
        doReturn(Collections.emptyList()).when(service).list(any(LambdaQueryWrapper.class));
        assertThrows(BusinessException.class, () -> service.copyAssignsFromPeriod(1L, 2L));

        EvalScoreAssign source = new EvalScoreAssign();
        source.setScorerId(1L);
        source.setTargetId(2L);
        source.setEvalType("SELF");
        source.setWeight(BigDecimal.ONE);
        doReturn(Collections.singletonList(source)).when(service).list(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).remove(any());
        doReturn(true).when(service).saveBatch(anyList());
        service.copyAssignsFromPeriod(1L, 2L);

        doReturn(3L).when(service).count(any(LambdaQueryWrapper.class));
        assertEquals(3, service.removeByPeriod(1L));
        assertEquals(0, service.removeByPeriod(null));

        AssignGenerateRuleDTO invalid = new AssignGenerateRuleDTO();
        assertThrows(BusinessException.class, () -> service.generateByRule(invalid));
        invalid.setPeriodId(1L);
        invalid.setEnableSelf(false);
        invalid.setEnablePeer(false);
        invalid.setEnableGroupLeader(false);
        invalid.setEnableDeptLeader(false);
        invalid.setEnableAdmin(false);
        assertThrows(BusinessException.class, () -> service.generateByRule(invalid));
    }

    @Test
    void generateByRuleSuccess() {
        UserService userService = mock(UserService.class);
        AssignService service = spy(new AssignService(userService));
        AssignGenerateRuleDTO rule = new AssignGenerateRuleDTO();
        rule.setPeriodId(1L);
        rule.setReplaceExisting(true);
        rule.setEnableSelf(true);
        rule.setSelfWeight(BigDecimal.TEN);

        SysUser employee = new SysUser();
        employee.setId(10L);
        employee.setRole("EMPLOYEE");
        employee.setGroupId(1L);
        employee.setDeptId(1L);
        when(userService.list(any(LambdaQueryWrapper.class))).thenReturn(Collections.singletonList(employee));
        doReturn(Collections.emptyList()).when(service).list(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).remove(any());
        doReturn(true).when(service).saveBatch(anyList());
        doReturn(1L).when(service).count(any(LambdaQueryWrapper.class));
        com.eval.module.admin.dto.AssignGenerateResultVO result = service.generateByRule(rule);
        assertEquals(1, result.getCreatedCount());
        assertEquals(1, result.getTotalAfterGenerate());
    }
}
