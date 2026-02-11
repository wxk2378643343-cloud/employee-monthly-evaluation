package com.eval.module.score.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("eval_record")
public class EvalRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long periodId;

    private Long targetId;

    private BigDecimal selfScore;

    private BigDecimal peerScore;

    private BigDecimal groupLeaderScore;

    private BigDecimal deptLeaderScore;

    private BigDecimal adminScore;

    private BigDecimal weightedScore;

    private BigDecimal linearRankScore;

    private Integer deptRank;

    /** 0-否 1-是 */
    private Integer isBottom3pct;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
