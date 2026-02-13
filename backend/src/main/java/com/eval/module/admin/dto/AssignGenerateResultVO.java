package com.eval.module.admin.dto;

import lombok.Data;

@Data
public class AssignGenerateResultVO {
    private Integer deletedCount;
    private Integer createdCount;
    private Integer skippedCount;
    private Integer totalAfterGenerate;
}
