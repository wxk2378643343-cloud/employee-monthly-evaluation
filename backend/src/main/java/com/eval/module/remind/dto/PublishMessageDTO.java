package com.eval.module.remind.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class PublishMessageDTO {

    @NotEmpty(message = "接收人不能为空")
    private List<Long> userIds;

    @NotNull(message = "评价周期不能为空")
    private Long periodId;

    @NotBlank(message = "消息内容不能为空")
    private String content;
}
