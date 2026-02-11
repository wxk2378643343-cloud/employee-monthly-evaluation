package com.eval.module.admin.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LinearScoreVO {

    private Long recordId;
    private Long targetId;
    private String targetName;
    private String deptName;
    private BigDecimal weightedScore;
    private BigDecimal linearRankScore;
    private Integer deptRank;
}
