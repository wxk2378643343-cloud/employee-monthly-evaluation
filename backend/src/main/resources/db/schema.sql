-- 员工月度评价系统 数据库建表SQL
-- MySQL 5.7+

CREATE DATABASE IF NOT EXISTS eval_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE eval_db;

-- 1. 部门表
CREATE TABLE IF NOT EXISTS sys_department (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '部门ID',
    dept_name   VARCHAR(100) NOT NULL COMMENT '部门名称',
    sort_order  INT DEFAULT 0 COMMENT '排序',
    status      TINYINT DEFAULT 1 COMMENT '状态 1-正常 0-停用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 2. 网格表
CREATE TABLE IF NOT EXISTS sys_group (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '网格ID',
    group_name  VARCHAR(100) NOT NULL COMMENT '网格名称',
    dept_id     BIGINT NOT NULL COMMENT '所属部门ID',
    sort_order  INT DEFAULT 0 COMMENT '排序',
    status      TINYINT DEFAULT 1 COMMENT '状态 1-正常 0-停用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    INDEX idx_dept_id (dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='网格表';

-- 3. 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username      VARCHAR(50) NOT NULL COMMENT '用户名/工号',
    password      VARCHAR(255) NOT NULL COMMENT '密码',
    real_name     VARCHAR(50) NOT NULL COMMENT '真实姓名',
    dept_id       BIGINT COMMENT '部门ID',
    group_id      BIGINT COMMENT '网格ID',
    role          VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE' COMMENT '角色: ADMIN/DEPT_LEADER/GROUP_LEADER/EMPLOYEE',
    phone         VARCHAR(20) COMMENT '手机号',
    dingtalk_id   VARCHAR(100) COMMENT '钉钉用户ID',
    status        TINYINT DEFAULT 1 COMMENT '状态 1-正常 0-停用',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    UNIQUE INDEX uk_username (username),
    INDEX idx_dept_id (dept_id),
    INDEX idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 4. 评价周期表
CREATE TABLE IF NOT EXISTS eval_period (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '周期ID',
    period_name VARCHAR(50) NOT NULL COMMENT '周期名称，如2024年1月',
    year        INT NOT NULL COMMENT '年份',
    month       INT NOT NULL COMMENT '月份',
    status      TINYINT DEFAULT 0 COMMENT '状态 0-未开始 1-进行中 2-已结束',
    start_time  DATETIME COMMENT '开始时间',
    end_time    DATETIME COMMENT '截止时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    UNIQUE INDEX uk_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价周期表';

-- 5. 评分分配表（管理员配置谁给谁打分）
CREATE TABLE IF NOT EXISTS eval_score_assign (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分配ID',
    period_id     BIGINT NOT NULL COMMENT '评价周期ID',
    scorer_id     BIGINT NOT NULL COMMENT '打分人ID',
    target_id     BIGINT NOT NULL COMMENT '被评价人ID',
    eval_type     VARCHAR(30) NOT NULL COMMENT '评价类型: SELF/PEER/GROUP_LEADER/DEPT_LEADER/ADMIN',
    weight        DECIMAL(5,2) DEFAULT 0 COMMENT '权重（百分比）',
    status        TINYINT DEFAULT 0 COMMENT '状态 0-未评价 1-已评价',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    INDEX idx_period_id (period_id),
    INDEX idx_scorer_id (scorer_id),
    INDEX idx_target_id (target_id),
    UNIQUE INDEX uk_assign (period_id, scorer_id, target_id, eval_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评分分配表';

-- 6. 评价记录表（每人每周期一条汇总记录）
CREATE TABLE IF NOT EXISTS eval_record (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    period_id           BIGINT NOT NULL COMMENT '评价周期ID',
    target_id           BIGINT NOT NULL COMMENT '被评价人ID',
    self_score          DECIMAL(6,2) COMMENT '自评得分',
    peer_score          DECIMAL(6,2) COMMENT '互评得分（均值）',
    group_leader_score  DECIMAL(6,2) COMMENT '网格长评分（均值）',
    dept_leader_score   DECIMAL(6,2) COMMENT '分管领导评分（均值）',
    admin_score         DECIMAL(6,2) COMMENT '管理员评分',
    weighted_score      DECIMAL(6,2) COMMENT '加权综合得分',
    linear_rank_score   DECIMAL(6,2) COMMENT '线性排名分（管理员手动设置）',
    dept_rank           INT COMMENT '部门排名',
    is_bottom3pct       TINYINT DEFAULT 0 COMMENT '是否后3% 0-否 1-是',
    create_time         DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted             TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    UNIQUE INDEX uk_period_target (period_id, target_id),
    INDEX idx_target_id (target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价记录表';

-- 7. 评价明细表（每次打分一条记录）
CREATE TABLE IF NOT EXISTS eval_detail (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '明细ID',
    period_id     BIGINT NOT NULL COMMENT '评价周期ID',
    scorer_id     BIGINT NOT NULL COMMENT '打分人ID',
    target_id     BIGINT NOT NULL COMMENT '被评价人ID',
    eval_type     VARCHAR(30) NOT NULL COMMENT '评价类型: SELF/PEER/GROUP_LEADER/DEPT_LEADER/ADMIN',
    score         DECIMAL(6,2) NOT NULL COMMENT '评分',
    comment       TEXT COMMENT '评语',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    INDEX idx_period_id (period_id),
    INDEX idx_scorer_id (scorer_id),
    INDEX idx_target_id (target_id),
    UNIQUE INDEX uk_detail (period_id, scorer_id, target_id, eval_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价明细表';

-- 8. 投票表
CREATE TABLE IF NOT EXISTS eval_vote (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '投票ID',
    period_id     BIGINT NOT NULL COMMENT '评价周期ID',
    voter_id      BIGINT NOT NULL COMMENT '投票人ID',
    candidate_id  BIGINT NOT NULL COMMENT '被投票人ID',
    vote_type     VARCHAR(20) NOT NULL COMMENT '投票类型: EXCELLENT/POOR',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    INDEX idx_period_id (period_id),
    INDEX idx_voter_id (voter_id),
    INDEX idx_candidate_id (candidate_id),
    UNIQUE INDEX uk_vote (period_id, voter_id, candidate_id, vote_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投票表';

-- 9. 提醒记录表
CREATE TABLE IF NOT EXISTS remind_record (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '提醒ID',
    period_id     BIGINT NOT NULL COMMENT '评价周期ID',
    user_id       BIGINT NOT NULL COMMENT '被提醒用户ID',
    remind_type   VARCHAR(30) NOT NULL COMMENT '提醒类型: SCORE/VOTE',
    remind_way    VARCHAR(20) NOT NULL COMMENT '提醒方式: DINGTALK/SYSTEM',
    send_status   TINYINT DEFAULT 0 COMMENT '发送状态 0-待发送 1-已发送 2-发送失败',
    content       VARCHAR(500) COMMENT '消息内容',
    send_time     DATETIME COMMENT '发送时间',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted       TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    INDEX idx_period_id (period_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提醒记录表';

-- 初始化管理员账号（密码: admin123，BCrypt加密）
INSERT INTO sys_user (username, password, real_name, role, status)
VALUES ('admin', '$2a$10$n6iGSjgj87ygQPMhe7zgXe53mgCMmbxiWbPpfatH5n/xjS2MOchGy', 'System Admin', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE password = '$2a$10$n6iGSjgj87ygQPMhe7zgXe53mgCMmbxiWbPpfatH5n/xjS2MOchGy';

CREATE TABLE IF NOT EXISTS sys_role (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Role ID',
    role_code     VARCHAR(50) NOT NULL COMMENT 'Role Code',
    role_name     VARCHAR(100) NOT NULL COMMENT 'Role Name',
    sort_order    INT DEFAULT 0 COMMENT 'Sort Order',
    status        TINYINT DEFAULT 1 COMMENT 'Status 1-Enabled 0-Disabled',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Create Time',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update Time',
    deleted       TINYINT DEFAULT 0 COMMENT 'Logical Delete',
    UNIQUE INDEX uk_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='System Roles';

INSERT INTO sys_role (role_code, role_name, sort_order, status)
VALUES ('ADMIN', '管理员', 1, 1),
       ('DEPT_LEADER', '部门负责人', 2, 1),
       ('GROUP_LEADER', '网格负责人', 3, 1),
       ('EMPLOYEE', '员工', 4, 1)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), sort_order = VALUES(sort_order), status = VALUES(status);
