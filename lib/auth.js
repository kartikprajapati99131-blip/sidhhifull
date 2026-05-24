import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.user.role !== "admin" && session.user.role !== "staff") {
    throw new Error("FORBIDDEN");
  }

  return session;
}