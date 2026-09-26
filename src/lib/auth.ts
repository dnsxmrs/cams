import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireTeacherAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  return session;
}