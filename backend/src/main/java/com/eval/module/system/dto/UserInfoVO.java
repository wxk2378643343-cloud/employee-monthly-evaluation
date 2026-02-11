package com.eval.module.system.dto;

import lombok.Data;

@Data
public class UserInfoVO {

    private Long id;
    private String username;
    private String realName;
    private Long deptId;
    private String deptName;
    private Long groupId;
    private String groupName;
    private String role;
    private String phone;
}
