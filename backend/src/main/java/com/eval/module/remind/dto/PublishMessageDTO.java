package com.eval.module.remind.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
public class PublishMessageDTO {

    @NotEmpty(message = "Recipients cannot be empty")
    private List<Long> userIds;

    private Long periodId;

    @NotBlank(message = "Announcement content cannot be empty")
    private String content;
}
