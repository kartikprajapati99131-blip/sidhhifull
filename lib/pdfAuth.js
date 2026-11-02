import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Who may upload / edit / delete PDFs. Change this one line to add roles.
export const PDF_MANAGER_ROLES = ["admin", "subadmin"];

export async function getPdfManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session || !PDF_MANAGER_ROLES.includes(session.user?.role)) return null;
  return session;
}
