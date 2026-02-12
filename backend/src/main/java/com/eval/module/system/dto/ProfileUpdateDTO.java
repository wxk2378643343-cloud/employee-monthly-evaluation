package com.eval.module.system.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class ProfileUpdateDTO {

    @NotBlank(message = "Real name is required")
    @Size(max = 50, message = "Real name must be at most 50 characters")
    private String realName;

    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;

    @Size(max = 100, message = "DingTalk ID must be at most 100 characters")
    private String dingtalkId;
}

