package com.eval.module.admin.controller;

import com.eval.module.admin.dto.AssignDTO;
import com.eval.module.admin.dto.AssignGenerateRuleDTO;
import com.eval.module.admin.dto.AssignGenerateResultVO;
import com.eval.module.admin.dto.LinearScoreDTO;
import com.eval.module.admin.dto.LinearScoreImportResultVO;
import com.eval.module.admin.service.AssignService;
import com.eval.module.admin.service.LinearScoreService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    @Test
    void allEndpoints() {
        AssignService assignService = mock(AssignService.class);
        LinearScoreService linearService = mock(LinearScoreService.class);

        when(assignService.listByPeriod(1L)).thenReturn(Collections.emptyList());
        when(assignService.listByPeriodAndTarget(1L, 2L)).thenReturn(Collections.emptyList());
        when(assignService.removeByPeriod(1L)).thenReturn(2);
        AssignGenerateResultVO generateResultVO = new AssignGenerateResultVO();
        when(assignService.generateByRule(any())).thenReturn(generateResultVO);

        when(linearService.listByPeriod(1L, null)).thenReturn(Collections.emptyList());
        when(linearService.exportLinearScoreExcel(1L, null)).thenReturn(new byte[]{1, 2});
        LinearScoreImportResultVO importVO = new LinearScoreImportResultVO();
        when(linearService.importLinearScoreExcel(eq(1L), any())).thenReturn(importVO);

        AdminController controller = new AdminController(assignService, linearService);
        assertEquals(200, controller.listAssigns(1L).getCode());
        assertEquals(200, controller.listAssignsByTarget(1L, 2L).getCode());
        assertEquals(200, controller.saveAssign(new AssignDTO()).getCode());
        assertEquals(200, controller.batchSaveAssigns(Collections.singletonList(new AssignDTO())).getCode());
        assertEquals(200, controller.copyAssigns(1L, 2L).getCode());
        assertEquals(200, controller.deleteAssign(8L).getCode());
        assertEquals(2, controller.clearAssignsByPeriod(1L).getData());
        assertSame(generateResultVO, controller.generateAssigns(new AssignGenerateRuleDTO()).getData());

        assertEquals(200, controller.listLinearScores(1L, null).getCode());
        assertEquals(200, controller.setLinearScore(new LinearScoreDTO()).getCode());
        assertEquals(200, controller.batchSetLinearScores(Collections.singletonList(new LinearScoreDTO())).getCode());
        ResponseEntity<byte[]> response = controller.exportLinearScores(1L, null);
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("linear-scores-period-1.xlsx"));
        assertSame(importVO, controller.importLinearScores(1L,
                new MockMultipartFile("file", "x.xlsx", "application/octet-stream", new byte[]{1})).getData());
    }
}
