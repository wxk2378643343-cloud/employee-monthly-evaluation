package com.eval.module.system.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class UserImportResultVO {

    private Integer totalRows = 0;

    private Integer successCount = 0;

    private Integer createdCount = 0;

    private Integer updatedCount = 0;

    private Integer failedCount = 0;

    private List<String> errors = new ArrayList<>();
}
