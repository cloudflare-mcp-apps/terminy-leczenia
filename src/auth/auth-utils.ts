/**
 * Authentication Utilities for MCP Server
 *
 * User lookup functions for D1 database.
 */

import { logger } from '../shared/logger';

export async function getUserByWorkosId(
  db: D1Database,
  workosUserId: string
): Promise<{ user_id: string; email: string; is_deleted: number } | null> {
  try {
    const result = await db
      .prepare('SELECT user_id, email, is_deleted FROM users WHERE workos_user_id = ? AND is_deleted = 0')
      .bind(workosUserId)
      .first<{ user_id: string; email: string; is_deleted: number }>();
    if (!result) {
      logger.warn({
        event: 'auth_attempt',
        method: 'oauth',
        success: false,
        reason: 'user_not_found_or_deleted',
      });
      return null;
    }
    return result;
  } catch (error) {
    logger.error({
      event: 'auth_attempt',
      method: 'oauth',
      success: false,
      reason: `d1_error:${error instanceof Error ? error.message : String(error)}`,
    });
    return null;
  }
}
