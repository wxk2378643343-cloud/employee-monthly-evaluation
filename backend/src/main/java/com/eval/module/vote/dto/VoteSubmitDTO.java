package com.eval.module.vote.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class VoteSubmitDTO {

    @NotNull(message = "评价周期不能为空")
    private Long periodId;

    @NotNull(message = "被投票人不能为空")
    private Long candidateId;

    @NotNull(message = "投票类型不能为空")
    private String voteType;
}
