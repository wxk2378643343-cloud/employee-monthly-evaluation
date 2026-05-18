package com.eval.module.admin.service;

import com.eval.common.exception.BusinessException;
import com.eval.module.admin.dto.LinearScoreDTO;
import com.eval.module.admin.dto.LinearScoreImportResultVO;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.GroupService;
import com.eval.module.system.service.UserService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LinearScoreServiceTest {

    @Test
    void listAndSetAndBatch() {
        EvalRecordMapper mapper = mock(EvalRecordMapper.class);
        UserService userService = mock(UserService.class);
        LinearScoreService service = spy(new LinearScoreService(mapper, userService, mock(DeptService.class), mock(GroupService.class)));

        EvalRecord record = new EvalRecord();
        record.setId(1L);
        record.setTargetId(2L);
        when(mapper.selectList(any())).thenReturn(Collections.singletonList(record));
        SysUser user = new SysUser();
        user.setId(2L);
        user.setRealName("u");
        when(userService.getById(2L)).thenReturn(user);
        assertEquals(1, service.listByPeriod(1L, null).size());

        LinearScoreDTO bad = new LinearScoreDTO();
        bad.setPeriodId(1L);
        bad.setTargetId(2L);
        assertThrows(BusinessException.class, () -> service.setLinearScore(bad));
        bad.setLinearRankScore(new BigDecimal("101"));
        assertThrows(BusinessException.class, () -> service.setLinearScore(bad));

        LinearScoreDTO ok = new LinearScoreDTO();
        ok.setPeriodId(1L);
        ok.setTargetId(2L);
        ok.setLinearRankScore(new BigDecimal("80"));
        when(mapper.selectOne(any())).thenReturn(record);
        service.setLinearScore(ok);
        verify(mapper).updateById(record);
        service.batchSetLinearScore(Collections.singletonList(ok));
    }

    @Test
    void exportAndImport() throws Exception {
        EvalRecordMapper mapper = mock(EvalRecordMapper.class);
        UserService userService = mock(UserService.class);
        LinearScoreService service = spy(new LinearScoreService(mapper, userService, mock(DeptService.class), mock(GroupService.class)));

        SysUser user = new SysUser();
        user.setId(2L);
        user.setRealName("u");
        user.setRole("EMPLOYEE");
        user.setStatus(1);
        when(userService.getById(2L)).thenReturn(user);
        when(userService.list(any(LambdaQueryWrapper.class))).thenReturn(Collections.singletonList(user));
        when(mapper.selectList(any())).thenReturn(Collections.emptyList());
        byte[] bytes = service.exportLinearScoreExcel(1L, null);
        assertTrue(bytes.length > 0);

        assertThrows(BusinessException.class, () -> service.exportLinearScoreExcel(null, null));

        XSSFWorkbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("s");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("id");
        header.createCell(4).setCellValue("linear");
        Row row = sheet.createRow(1);
        row.createCell(0).setCellValue("2");
        row.createCell(4).setCellValue("77");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        MockMultipartFile file = new MockMultipartFile("file", "x.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        doNothing().when(service).setLinearScore(any(LinearScoreDTO.class));
        LinearScoreImportResultVO result = service.importLinearScoreExcel(1L, file);
        assertEquals(1, result.getSuccessCount());
        assertThrows(BusinessException.class, () -> service.importLinearScoreExcel(null, file));
    }

    @Test
    void importFailsWithoutWritingWhenUserInfoMismatch() throws Exception {
        EvalRecordMapper mapper = mock(EvalRecordMapper.class);
        UserService userService = mock(UserService.class);
        LinearScoreService service = spy(new LinearScoreService(mapper, userService, mock(DeptService.class), mock(GroupService.class)));

        SysUser user = new SysUser();
        user.setId(2L);
        user.setRealName("system-name");
        when(userService.getById(2L)).thenReturn(user);

        XSSFWorkbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("s");
        sheet.createRow(0);
        Row row = sheet.createRow(1);
        row.createCell(0).setCellValue("2");
        row.createCell(1).setCellValue("excel-name");
        row.createCell(4).setCellValue("77");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        MockMultipartFile file = new MockMultipartFile("file", "x.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        assertThrows(BusinessException.class, () -> service.importLinearScoreExcel(1L, file));
        verify(service, never()).setLinearScore(any(LinearScoreDTO.class));
    }
}
