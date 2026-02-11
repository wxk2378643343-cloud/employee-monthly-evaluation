package com.eval.module.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("eval_score_assign")
public class EvalScoreAssign {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long periodId;

    private Long scorerId;

    private Long targetId;

    /** SELF/PEER/GROUP_LEADER/DEPT_LEADER/ADMIN */
    private String evalType;

    private BigDecimal weight;

    /** 0-未评价 1-已评价 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
