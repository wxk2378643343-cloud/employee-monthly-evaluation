package com.eval.module.system.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
public class BatchResetPasswordDTO {

    @NotEmpty(message = "User ids cannot be empty")
    private List<Long> userIds;

    @NotBlank(message = "New password cannot be empty")
    private String newPassword;
}
