package com.eval.module.score.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("eval_detail")
public class EvalDetail {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long periodId;

    private Long scorerId;

    private Long targetId;

    /** SELF/PEER/GROUP_LEADER/DEPT_LEADER/ADMIN */
    private String evalType;

    private BigDecimal score;

    private String comment;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
