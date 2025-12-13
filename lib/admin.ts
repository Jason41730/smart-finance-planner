/**
 * 管理員權限檢查
 * 
 * 透過環境變數 ADMIN_USER_IDS 設定管理員 ID
 * 格式：以逗號分隔的 LINE user_id 列表
 * 例如：ADMIN_USER_IDS=U1234567890abcdef,U0987654321fedcba
 * 
 * 注意：使用 LINE user_id（不是 web_user_id）
 */

const adminIds = new Set(
  (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

/**
 * 檢查使用者是否為管理員
 * @param lineUserId - LINE user_id
 * @returns 是否為管理員
 */
export function isAdmin(lineUserId?: string | null): boolean {
  if (!lineUserId) {
    return false;
  }
  return adminIds.has(lineUserId);
}

/**
 * 取得所有管理員 ID
 * @returns 管理員 ID 陣列
 */
export function getAdminIds(): string[] {
  return Array.from(adminIds);
}

