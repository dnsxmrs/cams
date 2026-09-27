import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendEmail, getVerificationEmailTemplate } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      console.log(`[DEV VERIFICATION LINK] User: ${user.email} | URL: ${url}`);

      const html = getVerificationEmailTemplate({
        name: user.name,
        url,
      });

      await sendEmail({
        to: user.email,
        subject: "Verify your email address - CAMS",
        html,
      });
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        console.log(`[DEV VERIFICATION OTP] Email: ${email} | Type: ${type} | OTP: ${otp}`);

        const html = getVerificationEmailTemplate({
          name: "Teacher",
          otp,
        });

        await sendEmail({
          to: email,
          subject: `Your ${type === "email-verification" ? "Verification" : "Security"} Code: ${otp} - CAMS`,
          html,
        });
      },
    }),
    twoFactor({
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          console.log(`[DEV 2FA OTP] User: ${user.email} | OTP: ${otp}`);

          const html = getVerificationEmailTemplate({
            name: user.name,
            otp,
          });

          await sendEmail({
            to: user.email,
            subject: `Your 2FA Security Code: ${otp} - CAMS`,
            html,
          });
        },
      },
    }),
  ],
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
  // If email verification is required, check if user email is verified
  if (session.user.emailVerified === false) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
  }
  return session;
}