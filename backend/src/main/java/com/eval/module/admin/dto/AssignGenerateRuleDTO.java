package com.eval.module.admin.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class AssignGenerateRuleDTO {

    @NotNull(message = "Period is required")
    private Long periodId;

    private Boolean replaceExisting = Boolean.TRUE;

    private Boolean enableSelf = Boolean.TRUE;
    private Boolean enablePeer = Boolean.TRUE;
    private Boolean enableGroupLeader = Boolean.TRUE;
    private Boolean enableDeptLeader = Boolean.TRUE;
    private Boolean enableAdmin = Boolean.FALSE;

    private BigDecimal selfWeight = BigDecimal.ZERO;
    private BigDecimal peerWeight = BigDecimal.ZERO;
    private BigDecimal groupLeaderWeight = BigDecimal.ZERO;
    private BigDecimal deptLeaderWeight = BigDecimal.ZERO;
    private BigDecimal adminWeight = BigDecimal.ZERO;
}
