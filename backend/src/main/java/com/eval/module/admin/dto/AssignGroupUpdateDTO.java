package com.eval.module.admin.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Data
public class AssignGroupUpdateDTO {

    @NotNull
    private Long periodId;

    @NotNull
    private Long groupId;

    @Valid
    private List<AssignDTO> assignments = new ArrayList<>();
}
