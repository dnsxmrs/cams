"use server";

import { prisma } from "@/lib/prisma";

/**
 * Server Action: Validates whether a teacher user account exists in the database
 */
export async function checkUserExists(email: string) {
  try {
    if (!email || !email.trim()) {
      return { exists: false, error: "Please enter your email address." };
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return {
        exists: false,
        error: "No registered account found with this email address. Please check your spelling or register a new account.",
      };
    }

    return { exists: true, user };
  } catch (error: unknown) {
    console.error("Error verifying user existence in database:", error);
    return {
      exists: false,
      error: "Unable to connect to user database. Please try again.",
    };
  }
}
