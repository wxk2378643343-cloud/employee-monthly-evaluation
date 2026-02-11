package com.eval.module.query.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ScoreDetailVO {

    private Long detailId;
    private String scorerName;
    private String evalType;
    private BigDecimal score;
    private String comment;
    private LocalDateTime createTime;
}
