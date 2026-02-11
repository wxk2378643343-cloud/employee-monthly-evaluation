package com.eval.module.query.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EvalHistoryVO {

    private Long recordId;
    private Long periodId;
    private String periodName;
    private BigDecimal selfScore;
    private BigDecimal peerScore;
    private BigDecimal groupLeaderScore;
    private BigDecimal deptLeaderScore;
    private BigDecimal adminScore;
    private BigDecimal weightedScore;
    private BigDecimal linearRankScore;
    private Integer deptRank;
    private Integer isBottom3pct;
}
