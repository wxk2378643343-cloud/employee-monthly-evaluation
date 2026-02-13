// Shared domain models aligned with backend contracts

export type UserRole = string;

export const Role = {
  ADMIN: 'ADMIN',
  DEPT_LEADER: 'DEPT_LEADER',
  GROUP_LEADER: 'GROUP_LEADER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export const RoleLabel: Record<string, string> = {
  ADMIN: '管理员',
  DEPT_LEADER: '部门负责人',
  GROUP_LEADER: '小组负责人',
  EMPLOYEE: '员工',
};

export const isAdminRole = (role?: string) => role === Role.ADMIN;
export const isLeaderRole = (role?: string) => role === Role.DEPT_LEADER || role === Role.GROUP_LEADER;
export const isLeaderOrAdmin = (role?: string) => isLeaderRole(role) || isAdminRole(role);

export interface Department {
  id: number;
  deptName: string;
  sortOrder?: number;
  status: number;
}

export interface Group {
  id: number;
  groupName: string;
  deptId: number;
  sortOrder?: number;
  status: number;
}

export interface User {
  id: number;
  username: string;
  realName: string;
  deptId?: number;
  deptName?: string;
  groupId?: number;
  groupName?: string;
  role: UserRole;
  permissions?: string[];
  phone?: string;
  status?: number;
}

export interface SystemRole {
  id: number;
  roleCode: string;
  roleName: string;
  sortOrder?: number;
  status: number;
}

export interface UserImportResult {
  totalRows: number;
  successCount: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}

export interface EvalPeriod {
  id: number;
  periodName: string;
  year: number;
  month: number;
  status: PeriodStatus;
  startTime?: string;
  endTime?: string;
}

export enum PeriodStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  ENDED = 2,
}

export const PeriodStatusLabel: Record<PeriodStatus, string> = {
  [PeriodStatus.NOT_STARTED]: '未开始',
  [PeriodStatus.IN_PROGRESS]: '进行中',
  [PeriodStatus.ENDED]: '已结束',
};

export type EvalType = 'SELF' | 'PEER' | 'GROUP_LEADER' | 'DEPT_LEADER' | 'ADMIN';

export const EvalTypeLabel: Record<EvalType, string> = {
  SELF: '自评',
  PEER: '同级评价',
  GROUP_LEADER: '小组负责人评价',
  DEPT_LEADER: '部门负责人评价',
  ADMIN: '管理员评价',
};

export interface AssignRow {
  id?: number;
  periodId: number;
  scorerId: number;
  scorerName?: string;
  targetId: number;
  targetName?: string;
  evalType: EvalType;
  weight?: number;
  status?: number;
}

export interface LinearScore {
  recordId: number;
  targetId: number;
  targetName: string;
  deptName?: string;
  weightedScore?: number;
  linearRankScore?: number;
  deptRank?: number;
}

export interface PendingUser {
  assignId: number;
  targetId: number;
  targetName: string;
  deptName?: string;
  groupName?: string;
  evalType: EvalType;
  status: number;
}

export interface ScoreSubmit {
  periodId: number;
  targetId: number;
  evalType: EvalType;
  score: number;
  comment?: string;
}

export interface EvalHistory {
  recordId: number;
  periodId: number;
  periodName?: string;
  selfScore?: number;
  peerScore?: number;
  groupLeaderScore?: number;
  deptLeaderScore?: number;
  adminScore?: number;
  weightedScore?: number;
  linearRankScore?: number;
  deptRank?: number;
  isBottom3pct?: number;
}

export interface ScoreDetailItem {
  detailId: number;
  scorerName?: string;
  evalType: EvalType;
  score: number;
  comment?: string;
  createTime?: string;
}

export interface RankInfo {
  targetId: number;
  targetName: string;
  deptName?: string;
  groupName?: string;
  weightedScore?: number;
  linearRankScore?: number;
  deptRank?: number;
  isBottom3pct?: number;
}

export interface VoteRecord {
  candidateId: number;
  voteType: 'EXCELLENT' | 'POOR';
}

export interface VoteCandidate extends RankInfo {
  voted?: boolean;
  voteType?: 'EXCELLENT' | 'POOR';
}

export type RemindType = 'SCORE' | 'VOTE';

export interface Remind {
  id: number;
  periodId?: number;
  remindType: RemindType;
  remindWay?: string;
  sendStatus?: number;
  sendTime?: string;
  createTime?: string;
  isRead: boolean;
  remindContent: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
