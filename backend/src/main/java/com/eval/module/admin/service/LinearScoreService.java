package com.eval.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.eval.common.exception.BusinessException;
import com.eval.module.admin.dto.LinearScoreDTO;
import com.eval.module.admin.dto.LinearScoreImportResultVO;
import com.eval.module.admin.dto.LinearScoreVO;
import com.eval.module.score.entity.EvalRecord;
import com.eval.module.score.mapper.EvalRecordMapper;
import com.eval.module.system.entity.SysDepartment;
import com.eval.module.system.entity.SysGroup;
import com.eval.module.system.entity.SysUser;
import com.eval.module.system.service.DeptService;
import com.eval.module.system.service.GroupService;
import com.eval.module.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LinearScoreService {

    private final EvalRecordMapper evalRecordMapper;
    private final UserService userService;
    private final DeptService deptService;
    private final GroupService groupService;

    public List<LinearScoreVO> listByPeriod(Long periodId, Long deptId) {
        LambdaQueryWrapper<EvalRecord> wrapper = new LambdaQueryWrapper<EvalRecord>()
                .eq(EvalRecord::getPeriodId, periodId);

        List<EvalRecord> records = evalRecordMapper.selectList(wrapper);
        List<LinearScoreVO> result = new ArrayList<>();

        for (EvalRecord record : records) {
            SysUser user = userService.getById(record.getTargetId());
            if (user == null) {
                continue;
            }
            if (deptId != null && !deptId.equals(user.getDeptId())) {
                continue;
            }

            LinearScoreVO vo = new LinearScoreVO();
            vo.setRecordId(record.getId());
            vo.setTargetId(record.getTargetId());
            vo.setTargetName(user.getRealName());
            vo.setWeightedScore(record.getWeightedScore());
            vo.setLinearRankScore(record.getLinearRankScore());
            vo.setDeptRank(record.getDeptRank());

            if (user.getDeptId() != null) {
                SysDepartment dept = deptService.getById(user.getDeptId());
                if (dept != null) {
                    vo.setDeptName(dept.getDeptName());
                }
            }

            if (user.getGroupId() != null) {
                SysGroup group = groupService.getById(user.getGroupId());
                if (group != null) {
                    vo.setGroupName(group.getGroupName());
                }
            }

            result.add(vo);
        }

        return result;
    }

    public void setLinearScore(LinearScoreDTO dto) {
        if (dto == null || dto.getLinearRankScore() == null) {
            throw new BusinessException(400, "\u7EBF\u6027\u5206\u4E0D\u80FD\u4E3A\u7A7A");
        }
        SysUser target = userService.getById(dto.getTargetId());
        if (target == null) {
            throw new BusinessException(400, "\u5458\u5DE5\u4E0D\u5B58\u5728: " + dto.getTargetId());
        }
        if (dto.getLinearRankScore().compareTo(BigDecimal.ZERO) < 0
                || dto.getLinearRankScore().compareTo(new BigDecimal("100")) > 0) {
            throw new BusinessException(400, "\u7EBF\u6027\u5206\u5FC5\u987B\u57280\u5230100\u4E4B\u95F4");
        }

        EvalRecord record = evalRecordMapper.selectOne(new LambdaQueryWrapper<EvalRecord>()
                .eq(EvalRecord::getPeriodId, dto.getPeriodId())
                .eq(EvalRecord::getTargetId, dto.getTargetId()));

        if (record == null) {
            // Export list is based on sys_user; create missing eval_record on first linear import/save.
            record = new EvalRecord();
            record.setPeriodId(dto.getPeriodId());
            record.setTargetId(dto.getTargetId());
            evalRecordMapper.insert(record);
        }

        record.setLinearRankScore(dto.getLinearRankScore());
        if (record.getId() == null) {
            EvalRecord latest = evalRecordMapper.selectOne(new LambdaQueryWrapper<EvalRecord>()
                    .eq(EvalRecord::getPeriodId, dto.getPeriodId())
                    .eq(EvalRecord::getTargetId, dto.getTargetId()));
            if (latest == null) {
                throw new BusinessException(400, "\u4FDD\u5B58\u7EBF\u6027\u5206\u5931\u8D25");
            }
            latest.setLinearRankScore(dto.getLinearRankScore());
            evalRecordMapper.updateById(latest);
        } else {
            evalRecordMapper.updateById(record);
        }
    }

    public void batchSetLinearScore(List<LinearScoreDTO> dtos) {
        for (LinearScoreDTO dto : dtos) {
            setLinearScore(dto);
        }
    }

    public byte[] exportLinearScoreExcel(Long periodId, Long deptId) {
        List<LinearScoreVO> rows = listExportRowsByUsers(periodId, deptId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("\u7EBF\u6027\u5206\u540D\u5355");
            String[] headers = {
                    "\u5458\u5DE5ID",
                    "\u59D3\u540D",
                    "\u90E8\u95E8",
                    "\u7F51\u683C",
                    "\u7EBF\u6027\u5206"
            };

            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }

            for (int i = 0; i < rows.size(); i++) {
                LinearScoreVO vo = rows.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(vo.getTargetId() == null ? "" : String.valueOf(vo.getTargetId()));
                row.createCell(1).setCellValue(safe(vo.getTargetName()));
                row.createCell(2).setCellValue(safe(vo.getDeptName()));
                row.createCell(3).setCellValue(safe(vo.getGroupName()));
                row.createCell(4).setCellValue(vo.getLinearRankScore() == null ? "" : vo.getLinearRankScore().toPlainString());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Keep readable width on desktop/mobile office apps.
                int minWidth = 24 * 256;
                if (sheet.getColumnWidth(i) < minWidth) {
                    sheet.setColumnWidth(i, minWidth);
                }
            }

            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new BusinessException(400, "\u5BFC\u51FA\u7EBF\u6027\u5206\u540D\u5355\u5931\u8D25");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public LinearScoreImportResultVO importLinearScoreExcel(Long periodId, MultipartFile file) {
        if (periodId == null) {
            throw new BusinessException(400, "\u5468\u671F\u4E0D\u80FD\u4E3A\u7A7A");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "\u8BF7\u4E0A\u4F20Excel\u6587\u4EF6");
        }

        LinearScoreImportResultVO result = new LinearScoreImportResultVO();
        DataFormatter formatter = new DataFormatter();
        List<LinearScoreDTO> validRows = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        try (InputStream inputStream = file.getInputStream(); Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new BusinessException(400, "Excel\u4E2D\u6CA1\u6709\u5DE5\u4F5C\u8868");
            }

            int lastRowNum = sheet.getLastRowNum();
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }

                String targetIdText = formatter.formatCellValue(row.getCell(0)).trim();
                String targetNameText = formatter.formatCellValue(row.getCell(1)).trim();
                String deptNameText = formatter.formatCellValue(row.getCell(2)).trim();
                String groupNameText = formatter.formatCellValue(row.getCell(3)).trim();
                // New template: linear score at column 4; old template used column 5.
                String linearText = formatter.formatCellValue(row.getCell(4)).trim();
                if (linearText.isEmpty()) {
                    linearText = formatter.formatCellValue(row.getCell(5)).trim();
                }
                if (targetIdText.isEmpty() && linearText.isEmpty()) {
                    continue;
                }

                result.setTotalRows(result.getTotalRows() + 1);
                try {
                    validRows.add(validateImportRow(periodId, targetIdText, targetNameText, deptNameText, groupNameText, linearText));
                } catch (Exception ex) {
                    errors.add("\u7B2C" + (i + 1) + "\u884C: " + ex.getMessage());
                }
            }

            if (!errors.isEmpty()) {
                result.setFailedCount(errors.size());
                result.getErrors().addAll(errors);
                throw new BusinessException(400, "\u7EBF\u6027\u5206\u5BFC\u5165\u5931\u8D25\uFF0C\u8BF7\u6838\u5BF9\u7528\u6237\u4FE1\u606F\uFF1A" + String.join("\uFF1B", errors));
            }

            for (LinearScoreDTO dto : validRows) {
                setLinearScore(dto);
            }
            result.setSuccessCount(validRows.size());
            return result;
        } catch (IOException ex) {
            throw new BusinessException(400, "\u8BFB\u53D6Excel\u5931\u8D25");
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(400, "Excel\u683C\u5F0F\u4E0D\u6B63\u786E");
        }
    }

    private LinearScoreDTO validateImportRow(Long periodId,
                                             String targetIdText,
                                             String targetNameText,
                                             String deptNameText,
                                             String groupNameText,
                                             String linearText) {
        if (targetIdText.isEmpty()) {
            throw new BusinessException(400, "\u5458\u5DE5ID\u4E0D\u80FD\u4E3A\u7A7A");
        }

        Long targetId;
        try {
            targetId = Long.parseLong(targetIdText);
        } catch (NumberFormatException ex) {
            throw new BusinessException(400, "\u5458\u5DE5ID\u5FC5\u987B\u662F\u6570\u5B57");
        }

        SysUser user = userService.getById(targetId);
        if (user == null) {
            throw new BusinessException(400, "\u5458\u5DE5\u4E0D\u5B58\u5728: " + targetIdText);
        }
        if (!targetNameText.isEmpty() && !targetNameText.equals(user.getRealName())) {
            throw new BusinessException(400, "\u5458\u5DE5\u59D3\u540D\u4E0D\u5339\u914D\uFF0C\u5BFC\u5165\u503C: " + targetNameText + "\uFF0C\u7CFB\u7EDF\u503C: " + safe(user.getRealName()));
        }
        validateDepartment(user, deptNameText);
        validateGroup(user, groupNameText);

        if (linearText.isEmpty()) {
            throw new BusinessException(400, "\u7EBF\u6027\u5206\u4E0D\u80FD\u4E3A\u7A7A");
        }
        BigDecimal linearScore;
        try {
            linearScore = new BigDecimal(linearText);
        } catch (NumberFormatException ex) {
            throw new BusinessException(400, "\u7EBF\u6027\u5206\u5FC5\u987B\u662F\u6570\u5B57");
        }
        if (linearScore.compareTo(BigDecimal.ZERO) < 0 || linearScore.compareTo(new BigDecimal("100")) > 0) {
            throw new BusinessException(400, "\u7EBF\u6027\u5206\u5FC5\u987B\u57280\u5230100\u4E4B\u95F4");
        }

        return buildLinearDto(periodId, targetId, linearScore);
    }

    private void validateDepartment(SysUser user, String deptNameText) {
        if (deptNameText.isEmpty()) {
            return;
        }
        SysDepartment dept = user.getDeptId() == null ? null : deptService.getById(user.getDeptId());
        String expected = dept == null ? "" : safe(dept.getDeptName());
        if (!deptNameText.equals(expected)) {
            throw new BusinessException(400, "\u90E8\u95E8\u4E0D\u5339\u914D\uFF0C\u5BFC\u5165\u503C: " + deptNameText + "\uFF0C\u7CFB\u7EDF\u503C: " + expected);
        }
    }

    private void validateGroup(SysUser user, String groupNameText) {
        if (groupNameText.isEmpty()) {
            return;
        }
        SysGroup group = user.getGroupId() == null ? null : groupService.getById(user.getGroupId());
        String expected = group == null ? "" : safe(group.getGroupName());
        if (!groupNameText.equals(expected)) {
            throw new BusinessException(400, "\u7F51\u683C\u4E0D\u5339\u914D\uFF0C\u5BFC\u5165\u503C: " + groupNameText + "\uFF0C\u7CFB\u7EDF\u503C: " + expected);
        }
    }

    private LinearScoreDTO buildLinearDto(Long periodId, Long targetId, BigDecimal linearScore) {
        LinearScoreDTO dto = new LinearScoreDTO();
        dto.setPeriodId(periodId);
        dto.setTargetId(targetId);
        dto.setLinearRankScore(linearScore);
        return dto;
    }

    private List<LinearScoreVO> listExportRowsByUsers(Long periodId, Long deptId) {
        if (periodId == null) {
            throw new BusinessException(400, "\u5468\u671F\u4E0D\u80FD\u4E3A\u7A7A");
        }

        List<SysUser> users = userService.list(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getRole, "EMPLOYEE"));

        if (deptId != null) {
            users = users.stream()
                    .filter(u -> deptId.equals(u.getDeptId()))
                    .collect(Collectors.toList());
        }

        List<EvalRecord> records = evalRecordMapper.selectList(new LambdaQueryWrapper<EvalRecord>()
                .eq(EvalRecord::getPeriodId, periodId));
        Map<Long, EvalRecord> recordByTargetId = new HashMap<>();
        for (EvalRecord record : records) {
            if (record.getTargetId() != null) {
                recordByTargetId.put(record.getTargetId(), record);
            }
        }

        List<LinearScoreVO> result = new ArrayList<>();
        for (SysUser user : users) {
            LinearScoreVO vo = new LinearScoreVO();
            vo.setTargetId(user.getId());
            vo.setTargetName(user.getRealName());

            if (user.getDeptId() != null) {
                SysDepartment dept = deptService.getById(user.getDeptId());
                if (dept != null) {
                    vo.setDeptName(dept.getDeptName());
                }
            }

            if (user.getGroupId() != null) {
                SysGroup group = groupService.getById(user.getGroupId());
                if (group != null) {
                    vo.setGroupName(group.getGroupName());
                }
            }

            EvalRecord record = recordByTargetId.get(user.getId());
            if (record != null) {
                vo.setRecordId(record.getId());
                BigDecimal weightedScore = record.getWeightedScore();
                if (weightedScore == null) {
                    // Fallback for periods where weighted score has not been persisted yet.
                    weightedScore = nvl(record.getSelfScore())
                            .add(nvl(record.getPeerScore()))
                            .add(nvl(record.getGroupLeaderScore()))
                            .add(nvl(record.getDeptLeaderScore()))
                            .add(nvl(record.getAdminScore()));
                }
                vo.setWeightedScore(weightedScore);
                vo.setLinearRankScore(record.getLinearRankScore());
                vo.setDeptRank(record.getDeptRank());
            }

            result.add(vo);
        }

        return result;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
