import bcrypt from 'bcrypt';
import type { UserRole } from '@prisma/client';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'OWNER') return true;
  return userRole === requiredRole;
}

export function isOwner(role: UserRole): boolean {
  return role === 'OWNER';
}

export function isSeller(role: UserRole): boolean {
  return role === 'SELLER';
}

// Permission definitions
export const PERMISSIONS = {
  // Owner only
  MANAGE_USERS: 'MANAGE_USERS',
  APPROVE_EXPENSES: 'APPROVE_EXPENSES',
  VOID_SALES: 'VOID_SALES',
  ADJUST_STOCK: 'ADJUST_STOCK',
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_PROFIT: 'VIEW_PROFIT',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  
  // Both roles
  CREATE_SALE: 'CREATE_SALE',
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  CREATE_EXPENSE: 'CREATE_EXPENSE',
  PERFORM_CLOSING: 'PERFORM_CLOSING',
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  OWNER: Object.values(PERMISSIONS),
  SELLER: [
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.PERFORM_CLOSING,
  ],
};

export function hasPermissionFor(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
