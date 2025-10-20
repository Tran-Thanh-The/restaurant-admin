import { UserRole } from '@/constants/auth';

// Check if user has permission to perform action
export function canCreate(role: UserRole): boolean {
  return ['admin', 'manager'].includes(role);
}

export function canEdit(role: UserRole): boolean {
  return ['admin', 'manager'].includes(role);
}

export function canDelete(role: UserRole): boolean {
  return ['admin', 'manager'].includes(role);
}

export function canView(): boolean {
  return true; // All roles can view
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isManager(role: UserRole): boolean {
  return role === 'manager';
}

export function isStaff(role: UserRole): boolean {
  return role === 'staff';
}
