package com.eval.module.score.dto;

import lombok.Data;

@Data
public class PendingUserVO {

    private Long assignId;
    private Long targetId;
    private String targetName;
    private String deptName;
    private String groupName;
    private String evalType;
    private Integer status;
}
