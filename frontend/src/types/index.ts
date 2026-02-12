// 用户相关类型
export interface User {
  id: number;
  username: string;
  realName: string;
  phone?: string;
  deptId: number;
  deptName?: string;
  groupId?: number;
  groupName?: string;
  roleType: RoleType;
  status: number;
}

export enum RoleType {
  EMPLOYEE = 1,     // 普通员工
  TEAM_LEADER = 2,  // 小组长
  SUPERVISOR = 3,   // 分管领导
  UNIT_LEADER = 4,  // 单位领导
  ADMIN = 5,        // 管理员
}

export const RoleTypeLabel: Record<RoleType, string> = {
  [RoleType.EMPLOYEE]: '普通员工',
  [RoleType.TEAM_LEADER]: '小组长',
  [RoleType.SUPERVISOR]: '分管领导',
  [RoleType.UNIT_LEADER]: '单位领导',
  [RoleType.ADMIN]: '管理员',
};

// 部门
export interface Department {
  id: number;
  parentId: number;
  deptName: string;
  deptCode?: string;
  leaderId?: number;
  status: number;
}

// 小组
export interface Group {
  id: number;
  groupName: string;
  deptId: number;
  deptName?: string;
  leaderId?: number;
  leaderName?: string;
  status: number;
  userCount?: number;
}

// 评价周期
export interface EvalPeriod {
  id: number;
  periodName: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
}

export enum PeriodStatus {
  NOT_STARTED = 0,  // 未开始
  ROUND_ONE = 1,    // 第一轮进行中
  ROUND_TWO = 2,    // 第二轮进行中
  ENDED = 3,        // 已结束
}

export const PeriodStatusLabel: Record<PeriodStatus, string> = {
  [PeriodStatus.NOT_STARTED]: '未开始',
  [PeriodStatus.ROUND_ONE]: '第一轮进行中',
  [PeriodStatus.ROUND_TWO]: '第二轮进行中',
  [PeriodStatus.ENDED]: '已结束',
};

// 打分分配
export interface ScoreAssign {
  evaluatorId: number;
  evaluatorName?: string;
  evaluatorType: RoleType;
  evaluatorTypeName?: string;
  groupIds: number[];
  groupNames?: string[];
}

// 待评价人员
export interface PendingUser {
  userId: number;
  realName: string;
  deptName: string;
  groupName: string;
  evalType: string;
  scored: boolean;
}

// 评分提交
export interface ScoreSubmit {
  periodId: number;
  targetUserId: number;
  workRecordScore: number;
  keyIndicatorScore: number;
  keyWorkScore: number;
  comment?: string;
}

// 评价记录
export interface EvalRecord {
  id: number;
  periodId: number;
  periodName?: string;
  targetUserId: number;
  userName?: string;
  deptId: number;
  deptName?: string;
  groupId: number;
  groupName?: string;
  peerScore: number;
  teamLeaderScore: number;
  supervisorScore: number;
  unitLeaderScore: number;
  linearRankScore: number;
  totalScore: number;
  deptRank: number;
  isBottom: boolean;
  isWarning: boolean;
}

// 互评历史
export interface EvalHistory {
  periodName: string;
  evaluatorName: string;
  comment?: string;
  createTime: string;
}

// 排名信息
export interface RankInfo {
  rank: number;
  userId: number;
  userName: string;
  groupName: string;
  totalScore: number;
  isBottom: boolean;
  isWarning: boolean;
}

// 线性排名分
export interface LinearScore {
  userId: number;
  userName: string;
  groupName: string;
  linearRankScore: number;
}

// 投票候选人
export interface VoteCandidate {
  userId: number;
  userName: string;
  groupName: string;
  totalScore: number;
  deptRank: number;
  voted: boolean;
  voteResult?: number;
}

// 提醒
export interface Remind {
  id: number;
  remindType: RemindType;
  remindTypeName?: string;
  remindContent: string;
  isRead: boolean;
  createTime: string;
}

export enum RemindType {
  PENDING = 1,    // 待评价
  DEADLINE = 2,   // 即将截止
  VOTE = 3,       // 投票
  WARNING = 4,    // 预警
}

export const RemindTypeLabel: Record<RemindType, string> = {
  [RemindType.PENDING]: '待评价',
  [RemindType.DEADLINE]: '即将截止',
  [RemindType.VOTE]: '投票',
  [RemindType.WARNING]: '预警',
};

// API响应
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 分页参数
export interface PageParams {
  pageNum: number;
  pageSize: number;
}

// 分页结果
export interface PageResult<T> {
  total: number;
  list: T[];
}
