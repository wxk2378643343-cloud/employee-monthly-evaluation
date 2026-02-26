package com.eval.module.query.controller;

import com.eval.module.query.service.QueryService;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class QueryControllerTest {

    @Test
    void allEndpoints() {
        QueryService service = mock(QueryService.class);
        when(service.getMyHistory()).thenReturn(Collections.emptyList());
        when(service.getHistoryByUserId(2L)).thenReturn(Collections.emptyList());
        when(service.getScoreDetails(1L, 2L)).thenReturn(Collections.emptyList());
        when(service.getDeptRanking(1L, null)).thenReturn(Collections.emptyList());
        when(service.getStatistics(1L)).thenReturn(new HashMap<>());
        QueryController controller = new QueryController(service);
        assertEquals(200, controller.getMyHistory().getCode());
        assertEquals(200, controller.getHistoryByUser(2L).getCode());
        assertEquals(200, controller.getScoreDetails(1L, 2L).getCode());
        assertEquals(200, controller.getDeptRanking(1L, null).getCode());
        assertEquals(200, controller.getStatistics(1L).getCode());
    }
}
