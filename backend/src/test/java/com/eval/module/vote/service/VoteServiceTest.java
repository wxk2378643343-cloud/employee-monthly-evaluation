package com.eval.module.vote.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.UserService;
import com.eval.module.vote.dto.VoteSubmitDTO;
import com.eval.module.vote.entity.EvalVote;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VoteServiceTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void submitVoteRejectsSelf() {
        VoteService service = spy(new VoteService(mock(UserService.class)));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        VoteSubmitDTO dto = new VoteSubmitDTO();
        dto.setCandidateId(1L);
        assertThrows(BusinessException.class, () -> service.submitVote(dto));
    }

    @Test
    void submitVoteRejectsMissingOrCrossGroupOrDuplicate() {
        UserService userService = mock(UserService.class);
        VoteService service = spy(new VoteService(userService));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        VoteSubmitDTO dto = new VoteSubmitDTO();
        dto.setPeriodId(1L);
        dto.setCandidateId(2L);
        dto.setVoteType("EXCELLENT");

        when(userService.getById(1L)).thenReturn(null);
        assertThrows(BusinessException.class, () -> service.submitVote(dto));

        SysUser voter = new SysUser();
        voter.setGroupId(1L);
        SysUser c = new SysUser();
        c.setGroupId(2L);
        when(userService.getById(1L)).thenReturn(voter);
        when(userService.getById(2L)).thenReturn(c);
        assertThrows(BusinessException.class, () -> service.submitVote(dto));

        c.setGroupId(1L);
        doReturn(new EvalVote()).when(service).getOne(any(LambdaQueryWrapper.class));
        assertThrows(BusinessException.class, () -> service.submitVote(dto));
    }

    @Test
    void submitVoteSuccessAndQueryApis() {
        UserService userService = mock(UserService.class);
        VoteService service = spy(new VoteService(userService));
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(1L, null, "ROLE_TEST"));
        VoteSubmitDTO dto = new VoteSubmitDTO();
        dto.setPeriodId(1L);
        dto.setCandidateId(2L);
        dto.setVoteType("POOR");

        SysUser voter = new SysUser();
        voter.setGroupId(1L);
        SysUser c = new SysUser();
        c.setGroupId(1L);
        when(userService.getById(1L)).thenReturn(voter);
        when(userService.getById(2L)).thenReturn(c);
        doReturn(null).when(service).getOne(any(LambdaQueryWrapper.class));
        doReturn(true).when(service).save(any(EvalVote.class));
        assertDoesNotThrow(() -> service.submitVote(dto));
        verify(service).save(any(EvalVote.class));

        doReturn(Collections.emptyList()).when(service).list(any(LambdaQueryWrapper.class));
        assertNotNull(service.getMyVotes(1L));

        doReturn(3L).when(service).count(any(LambdaQueryWrapper.class));
        assertEquals(3L, service.getVoteStats(1L, 2L).get("excellentCount"));
    }
}
