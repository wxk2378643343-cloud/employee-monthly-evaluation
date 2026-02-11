package com.eval.module.admin.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class AssignDTO {

    @NotNull(message = "评价周期不能为空")
    private Long periodId;

    @NotNull(message = "打分人不能为空")
    private Long scorerId;

    @NotNull(message = "被评价人不能为空")
    private Long targetId;

    @NotNull(message = "评价类型不能为空")
    private String evalType;

    private BigDecimal weight;
}
