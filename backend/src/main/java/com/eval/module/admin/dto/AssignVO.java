package com.eval.module.admin.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AssignVO {

    private Long id;
    private Long periodId;
    private Long scorerId;
    private String scorerName;
    private Long targetId;
    private String targetName;
    private String evalType;
    private BigDecimal weight;
    private Integer status;
}
