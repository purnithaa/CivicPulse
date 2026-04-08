/**
 * Shared staff password hashing — must match between signup/login and admin-created accounts.
 */
export async function hashStaffPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "civicpulse_staff_salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/** Default password for all staff. They can change it in Profile after login. */
export const DEFAULT_STAFF_PASSWORD = "Staff@123"
