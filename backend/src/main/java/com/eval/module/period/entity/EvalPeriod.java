package com.eval.module.period.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("eval_period")
public class EvalPeriod {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String periodName;

    private Integer year;

    private Integer month;

    /** 0-未开始 1-进行中 2-已结束 */
    private Integer status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
