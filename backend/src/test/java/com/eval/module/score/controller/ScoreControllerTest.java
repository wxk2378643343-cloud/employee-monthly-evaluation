package com.eval.module.score.controller;

import com.eval.module.score.dto.ScoreSubmitDTO;
import com.eval.module.score.service.ScoreCalculateService;
import com.eval.module.score.service.ScoreService;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ScoreControllerTest {

    @Test
    void allEndpoints() {
        ScoreService scoreService = mock(ScoreService.class);
        ScoreCalculateService calcService = mock(ScoreCalculateService.class);
        when(scoreService.getPendingList(1L)).thenReturn(Collections.emptyList());
        ScoreController controller = new ScoreController(scoreService, calcService);

        assertEquals(200, controller.getPendingList(1L).getCode());
        assertEquals(200, controller.submitScore(new ScoreSubmitDTO()).getCode());
        assertEquals(200, controller.batchSubmitScores(Collections.singletonList(new ScoreSubmitDTO())).getCode());
        assertEquals(200, controller.calculateScores(1L).getCode());
        verify(scoreService).submitScore(any(ScoreSubmitDTO.class));
        verify(scoreService).batchSubmitScores(anyList());
        verify(calcService).calculateScores(1L);
    }
}
