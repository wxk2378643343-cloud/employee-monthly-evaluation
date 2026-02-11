package com.eval.module.admin.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class LinearScoreDTO {

    @NotNull(message = "评价周期不能为空")
    private Long periodId;

    @NotNull(message = "被评价人不能为空")
    private Long targetId;

    @NotNull(message = "线性排名分不能为空")
    private BigDecimal linearRankScore;
}
