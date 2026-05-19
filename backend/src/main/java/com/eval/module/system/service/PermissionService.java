package com.eval.module.system.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class PermissionService {

    private static final List<String> SYS_ADMIN_PERMISSIONS = Collections.unmodifiableList(Arrays.asList(
            "dept:manage",
            "group:manage",
            "user:manage",
            "user:group:view",
            "user:dept:view",
            "role:manage",
            "assign:manage",
            "linear:manage",
            "period:manage",
            "score:calculate",
            "remind:manage",
            "vote:view",
            "query:detail:view",
            "query:rank:view",
            "query:statistics:view"
    ));

    private static final List<String> DEPT_LEADER_PERMISSIONS = Collections.unmodifiableList(Arrays.asList(
            "user:group:view",
            "user:dept:view",
            "vote:view",
            "query:detail:view",
            "query:rank:view"
    ));

    private static final List<String> GROUP_LEADER_PERMISSIONS = Collections.unmodifiableList(Arrays.asList(
            "user:group:view",
            "vote:view",
            "query:detail:view"
    ));

    private static final List<String> LEADER_PERMISSIONS = Collections.unmodifiableList(Arrays.asList(
            "user:group:view",
            "user:dept:view",
            "vote:view",
            "query:detail:view",
            "query:rank:view",
            "query:statistics:view"
    ));

    public List<String> getPermissionsByRole(String roleCode) {
        if (roleCode == null) {
            return Collections.emptyList();
        }
        if ("SYS_ADMIN".equals(roleCode)) {
            return SYS_ADMIN_PERMISSIONS;
        }
        if ("LEADER".equals(roleCode)) {
            return LEADER_PERMISSIONS;
        }
        if ("DEPT_LEADER".equals(roleCode)) {
            return DEPT_LEADER_PERMISSIONS;
        }
        if ("GROUP_LEADER".equals(roleCode)) {
            return GROUP_LEADER_PERMISSIONS;
        }
        return new ArrayList<>();
    }
}
