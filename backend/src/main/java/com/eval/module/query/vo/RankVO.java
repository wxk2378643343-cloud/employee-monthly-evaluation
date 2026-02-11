package com.eval.module.query.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RankVO {

    private Long targetId;
    private String targetName;
    private String deptName;
    private String groupName;
    private BigDecimal weightedScore;
    private BigDecimal linearRankScore;
    private Integer deptRank;
    private Integer isBottom3pct;
}
