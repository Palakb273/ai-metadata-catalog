import { v4 as uuidv4 } from 'uuid'

const USER_ID_KEY = 'metacatalog_user_id'

/**
 * Get or create a unique user ID stored in localStorage.
 * Generated once on first visit, persists across sessions.
 */
export function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = uuidv4()
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}
