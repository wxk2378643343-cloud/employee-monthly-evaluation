package com.eval.module.vote.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("eval_vote")
public class EvalVote {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long periodId;

    private Long voterId;

    private Long candidateId;

    /** EXCELLENT / POOR */
    private String voteType;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
