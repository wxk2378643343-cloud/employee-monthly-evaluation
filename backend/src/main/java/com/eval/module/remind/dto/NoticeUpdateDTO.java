package com.eval.module.remind.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class NoticeUpdateDTO {

    @NotBlank(message = "Message content cannot be empty")
    private String content;
}
