package com.eval.module.vote.controller;

import com.eval.module.vote.dto.VoteSubmitDTO;
import com.eval.module.vote.service.VoteService;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class VoteControllerTest {

    @Test
    void allEndpoints() {
        VoteService service = mock(VoteService.class);
        when(service.getMyVotes(1L)).thenReturn(Collections.emptyList());
        when(service.getVoteStats(1L, 2L)).thenReturn(new HashMap<>());
        VoteController controller = new VoteController(service);
        assertEquals(200, controller.submitVote(new VoteSubmitDTO()).getCode());
        assertEquals(200, controller.getMyVotes(1L).getCode());
        assertEquals(200, controller.getVoteStats(1L, 2L).getCode());
        verify(service).submitVote(any(VoteSubmitDTO.class));
    }
}
