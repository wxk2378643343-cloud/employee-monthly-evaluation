import type { User } from '@/types';

export const PermissionCode = {
  DEPT_MANAGE: 'dept:manage',
  GROUP_MANAGE: 'group:manage',
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  ASSIGN_MANAGE: 'assign:manage',
  LINEAR_MANAGE: 'linear:manage',
  PERIOD_MANAGE: 'period:manage',
  VOTE_VIEW: 'vote:view',
  QUERY_DETAIL_VIEW: 'query:detail:view',
  QUERY_RANK_VIEW: 'query:rank:view',
} as const;

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user || !Array.isArray(user.permissions) || permissions.length === 0) return false;
  return permissions.some((permission) => user.permissions!.includes(permission));
}
