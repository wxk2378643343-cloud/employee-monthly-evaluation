package com.eval.module.score.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class ScoreSubmitDTO {

    @NotNull(message = "评价周期不能为空")
    private Long periodId;

    @NotNull(message = "被评价人不能为空")
    private Long targetId;

    @NotNull(message = "评价类型不能为空")
    private String evalType;

    @NotNull(message = "评分不能为空")
    private BigDecimal score;

    private String comment;
}
