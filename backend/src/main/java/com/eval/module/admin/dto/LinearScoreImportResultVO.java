package com.eval.module.admin.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class LinearScoreImportResultVO {
    private Integer totalRows = 0;
    private Integer successCount = 0;
    private Integer failedCount = 0;
    private List<String> errors = new ArrayList<>();
}
