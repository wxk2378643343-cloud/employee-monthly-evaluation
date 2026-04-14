package com.eval.module.remind.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("remind_record")
public class RemindRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long periodId;

    private Long userId;

    /** SCORE / VOTE */
    private String remindType;

    /** DINGTALK / SYSTEM */
    private String remindWay;

    /** 0-待发送 1-已发送 2-发送失败 */
    private Integer sendStatus;

    private String content;

    private LocalDateTime sendTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
