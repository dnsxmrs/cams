"use server";

import { prisma } from "@/lib/prisma";

export interface UserStatusResult {
  exists: boolean;
  emailVerified: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
  error?: string;
}

/**
 * Server Action: Validates whether a user exists in the database and their email verification status
 */
export async function checkUserStatus(email: string): Promise<UserStatusResult> {
  try {
    if (!email || !email.trim()) {
      return { exists: false, emailVerified: false, error: "Please enter a valid email address." };
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        exists: false,
        emailVerified: false,
        error: `No registered account found with email '${cleanEmail}'. Please check your spelling or create an account.`,
      };
    }

    return {
      exists: true,
      emailVerified: Boolean(user.emailVerified),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: Boolean(user.emailVerified),
      },
    };
  } catch (error: unknown) {
    console.error("Error verifying user status in database:", error);
    return {
      exists: false,
      emailVerified: false,
      error: "Unable to verify account with database. Please try again.",
    };
  }
}

/**
 * Legacy wrapper for backward compatibility
 */
export async function checkUserExists(email: string) {
  const status = await checkUserStatus(email);
  return {
    exists: status.exists,
    error: status.error,
    user: status.user,
  };
}
