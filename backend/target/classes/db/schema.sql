SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

CREATE DATABASE IF NOT EXISTS eval_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE eval_db;

CREATE TABLE IF NOT EXISTS sys_department (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Department ID',
    dept_name   VARCHAR(100) NOT NULL COMMENT 'Department name',
    sort_order  INT DEFAULT 0 COMMENT 'Sort order',
    status      TINYINT DEFAULT 1 COMMENT 'Status 1-enabled 0-disabled',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted     TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Departments';

CREATE TABLE IF NOT EXISTS sys_group (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Grid ID',
    group_name  VARCHAR(100) NOT NULL COMMENT 'Grid name',
    dept_id     BIGINT NOT NULL COMMENT 'Department ID',
    sort_order  INT DEFAULT 0 COMMENT 'Sort order',
    status      TINYINT DEFAULT 1 COMMENT 'Status 1-enabled 0-disabled',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted     TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    INDEX idx_dept_id (dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Grids';

CREATE TABLE IF NOT EXISTS sys_user (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'User ID',
    username      VARCHAR(50) NOT NULL COMMENT 'Username / employee number',
    password      VARCHAR(255) NOT NULL COMMENT 'Password',
    real_name     VARCHAR(50) NOT NULL COMMENT 'Real name',
    dept_id       BIGINT COMMENT 'Department ID',
    group_id      BIGINT COMMENT 'Grid ID',
    role          VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE' COMMENT 'Role: SYS_ADMIN/LEADER/DEPT_LEADER/GROUP_LEADER/EMPLOYEE',
    phone         VARCHAR(20) COMMENT 'Phone',
    dingtalk_id   VARCHAR(100) COMMENT 'DingTalk user ID',
    status        TINYINT DEFAULT 1 COMMENT 'Status 1-enabled 0-disabled',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    UNIQUE INDEX uk_username (username),
    INDEX idx_dept_id (dept_id),
    INDEX idx_group_id (group_id),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Users';

CREATE TABLE IF NOT EXISTS eval_period (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Period ID',
    period_name VARCHAR(50) NOT NULL COMMENT 'Period name',
    year        INT NOT NULL COMMENT 'Year',
    month       INT NOT NULL COMMENT 'Month',
    status      TINYINT DEFAULT 0 COMMENT 'Status 0-not started 1-in progress 2-ended',
    start_time  DATETIME COMMENT 'Start time',
    end_time    DATETIME COMMENT 'End time',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted     TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    UNIQUE INDEX uk_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Evaluation periods';

CREATE TABLE IF NOT EXISTS eval_score_assign (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Assignment ID',
    period_id     BIGINT NOT NULL COMMENT 'Period ID',
    scorer_id     BIGINT NOT NULL COMMENT 'Scorer user ID',
    target_id     BIGINT NOT NULL COMMENT 'Target user ID',
    eval_type     VARCHAR(30) NOT NULL COMMENT 'Eval type: SELF/PEER/GROUP_LEADER/DEPT_LEADER/ADMIN',
    weight        DECIMAL(5,2) DEFAULT 0 COMMENT 'Weight percentage',
    status        TINYINT DEFAULT 0 COMMENT 'Status 0-pending 1-scored',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    INDEX idx_period_id (period_id),
    INDEX idx_scorer_id (scorer_id),
    INDEX idx_target_id (target_id),
    UNIQUE INDEX uk_assign (period_id, scorer_id, target_id, eval_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Score assignments';

CREATE TABLE IF NOT EXISTS eval_record (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Record ID',
    period_id           BIGINT NOT NULL COMMENT 'Period ID',
    target_id           BIGINT NOT NULL COMMENT 'Target user ID',
    self_score          DECIMAL(6,2) COMMENT 'Self score',
    peer_score          DECIMAL(6,2) COMMENT 'Peer score average',
    group_leader_score  DECIMAL(6,2) COMMENT 'Grid leader score average',
    dept_leader_score   DECIMAL(6,2) COMMENT 'Department leader score average',
    admin_score         DECIMAL(6,2) COMMENT 'Leader score',
    weighted_score      DECIMAL(6,2) COMMENT 'Weighted score',
    linear_rank_score   DECIMAL(6,2) COMMENT 'Linear rank score',
    dept_rank           INT COMMENT 'Department rank',
    is_bottom3pct       TINYINT DEFAULT 0 COMMENT 'Whether bottom 3 percent',
    create_time         DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted             TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    UNIQUE INDEX uk_period_target (period_id, target_id),
    INDEX idx_target_id (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Evaluation records';

CREATE TABLE IF NOT EXISTS eval_detail (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Detail ID',
    period_id     BIGINT NOT NULL COMMENT 'Period ID',
    scorer_id     BIGINT NOT NULL COMMENT 'Scorer user ID',
    target_id     BIGINT NOT NULL COMMENT 'Target user ID',
    eval_type     VARCHAR(30) NOT NULL COMMENT 'Eval type: SELF/PEER/GROUP_LEADER/DEPT_LEADER/ADMIN',
    score         DECIMAL(6,2) NOT NULL COMMENT 'Score',
    comment       TEXT COMMENT 'Comment',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    INDEX idx_period_id (period_id),
    INDEX idx_scorer_id (scorer_id),
    INDEX idx_target_id (target_id),
    UNIQUE INDEX uk_detail (period_id, scorer_id, target_id, eval_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Evaluation details';

CREATE TABLE IF NOT EXISTS eval_vote (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Vote ID',
    period_id     BIGINT NOT NULL COMMENT 'Period ID',
    voter_id      BIGINT NOT NULL COMMENT 'Voter user ID',
    candidate_id  BIGINT NOT NULL COMMENT 'Candidate user ID',
    vote_type     VARCHAR(20) NOT NULL COMMENT 'Vote type: EXCELLENT/POOR',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    INDEX idx_period_id (period_id),
    INDEX idx_voter_id (voter_id),
    INDEX idx_candidate_id (candidate_id),
    UNIQUE INDEX uk_vote (period_id, voter_id, candidate_id, vote_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Votes';

CREATE TABLE IF NOT EXISTS notice (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Notice ID',
    period_id     BIGINT COMMENT 'Period ID',
    content       VARCHAR(500) NOT NULL COMMENT 'Notice content',
    status        TINYINT DEFAULT 1 COMMENT 'Status 1-published 0-recalled',
    created_by    BIGINT COMMENT 'Creator user ID',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    recalled_time DATETIME COMMENT 'Recall time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    INDEX idx_period_id (period_id),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Notices';

CREATE TABLE IF NOT EXISTS remind_record (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Reminder ID',
    period_id     BIGINT COMMENT 'Period ID',
    user_id       BIGINT NOT NULL COMMENT 'Target user ID',
    notice_id     BIGINT COMMENT 'Notice ID',
    remind_type   VARCHAR(30) NOT NULL COMMENT 'Reminder type: SCORE/VOTE/NOTICE',
    remind_way    VARCHAR(20) NOT NULL COMMENT 'Reminder way: DINGTALK/SYSTEM',
    send_status   TINYINT DEFAULT 0 COMMENT 'Send status 0-pending 1-sent 2-failed',
    content       VARCHAR(500) COMMENT 'Message content',
    send_time     DATETIME COMMENT 'Send time',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    INDEX idx_period_id (period_id),
    INDEX idx_user_id (user_id),
    INDEX idx_notice_id (notice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Reminder records';

CREATE TABLE IF NOT EXISTS sys_role (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Role ID',
    role_code     VARCHAR(50) NOT NULL COMMENT 'Role code',
    role_name     VARCHAR(100) NOT NULL COMMENT 'Role name',
    sort_order    INT DEFAULT 0 COMMENT 'Sort order',
    status        TINYINT DEFAULT 1 COMMENT 'Status 1-enabled 0-disabled',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create time',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical delete 0-no 1-yes',
    UNIQUE INDEX uk_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='System roles';

INSERT INTO sys_user (username, password, real_name, role, phone, status)
VALUES ('admin', '$2a$10$n6iGSjgj87ygQPMhe7zgXe53mgCMmbxiWbPpfatH5n/xjS2MOchGy', 'System Admin', 'SYS_ADMIN', '13800000000', 1)
ON DUPLICATE KEY UPDATE password = VALUES(password),
                        real_name = VALUES(real_name),
                        role = VALUES(role),
                        phone = VALUES(phone),
                        status = VALUES(status);

INSERT INTO sys_role (role_code, role_name, sort_order, status)
VALUES ('SYS_ADMIN', CONVERT(0xE7B3BBE7BB9FE7AEA1E79086E59198 USING utf8mb4), 1, 1),
       ('LEADER', CONVERT(0xE9A286E5AFBC USING utf8mb4), 2, 1),
       ('DEPT_LEADER', CONVERT(0xE983A8E997A8E8B49FE8B4A3E4BABA USING utf8mb4), 3, 1),
       ('GROUP_LEADER', CONVERT(0xE7BD91E6A0BCE8B49FE8B4A3E4BABA USING utf8mb4), 4, 1),
       ('EMPLOYEE', CONVERT(0xE59198E5B7A5 USING utf8mb4), 5, 1)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name),
                        sort_order = VALUES(sort_order),
                        status = VALUES(status);
