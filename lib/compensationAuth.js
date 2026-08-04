import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Roles allowed to add / edit / delete Compensation records.
// Kept in one place so every compensation route checks the same list.
const COMPENSATION_MANAGER_ROLES = ["admin", "subadmin"];

/**
 * Returns the logged-in user from the server session, or null.
 * Never trust anything the client sends — this is always derived
 * from the verified session.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * True only for Admin / Sub Admin. Used to gate create/edit/delete
 * and to decide whether a GET request may see all employees'
 * records or only the caller's own.
 */
export function canManageCompensation(user) {
  return !!user && COMPENSATION_MANAGER_ROLES.includes(user.role);
}
