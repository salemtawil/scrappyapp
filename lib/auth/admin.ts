import { getCurrentUser } from "@/lib/auth/session";

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return false;

  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}

export async function getAdminSession() {
  const { configured, user } = await getCurrentUser();

  return {
    configured,
    isAdmin: isAdminEmail(user?.email),
    user,
  };
}
