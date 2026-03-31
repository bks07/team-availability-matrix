import type { User } from './api.models';

/**
 * Derive display name from structured fields: [title] firstName [middleName] lastName
 */
export function deriveDisplayName(user: Pick<User, 'title' | 'firstName' | 'middleName' | 'lastName'>): string {
  const parts: string[] = [];
  if (user.title?.trim()) parts.push(user.title.trim());
  parts.push(user.firstName.trim());
  if (user.middleName?.trim()) parts.push(user.middleName.trim());
  parts.push(user.lastName.trim());
  return parts.join(' ');
}

/**
 * Get initials from first name + last name (uppercase)
 */
export function getInitials(user: Pick<User, 'firstName' | 'lastName'>): string {
  const f = user.firstName?.trim();
  const l = user.lastName?.trim();
  return `${f ? f[0].toUpperCase() : ''}${l ? l[0].toUpperCase() : ''}`;
}

/**
 * Get compact display label: displayName if present, otherwise firstName
 * Used for space-constrained contexts like matrix headers
 */
export function getDisplayLabel(user: Pick<User, 'displayName' | 'firstName'>): string {
  if (user.displayName?.trim()) return user.displayName;
  return user.firstName?.trim() || '';
}
