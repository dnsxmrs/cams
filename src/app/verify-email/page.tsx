"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { checkUserStatus } from "@/actions/auth";
import { KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, UserX } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialEmail = searchParams.get("email") || "";
  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate user existence on load
  useEffect(() => {
    let ignore = false;
    async function validateAccount() {
      if (!email || !email.trim()) {
        setUserNotFound(true);
        setErrorMsg("No email address provided for verification.");
        setCheckingAccount(false);
        return;
      }

      const userStatus = await checkUserStatus(email);
      if (ignore) return;

      if (!userStatus.exists) {
        setUserNotFound(true);
        setErrorMsg(userStatus.error || `No registered account found with email '${email}'. Please create an account.`);
      } else if (userStatus.emailVerified) {
        setIsVerified(true);
      }
      setCheckingAccount(false);
    }

    validateAccount();
    return () => {
      ignore = true;
    };
  }, [email]);

  // Handle OTP Submission
  const handleOtpVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    // Server check to ensure user still exists
    const userStatus = await checkUserStatus(email);
    if (!userStatus.exists) {
      const msg = userStatus.error || "No registered account found. Please sign up first.";
      setErrorMsg(msg);
      // toast.error(msg);
      setUserNotFound(true);
      return;
    }

    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Verify email via OTP
      const { error } = await authClient.emailOtp.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (error) {
        const msg = error.message || "Invalid or expired OTP code.";
        setErrorMsg(msg);
        // toast.error(msg);
      } else {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        setTimeout(() => {
          router.push("/subjects");
          router.refresh();
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify OTP code.";
      setErrorMsg(msg);
      // toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Auto Submit when 6th digit typed
  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setOtp(cleaned);
    if (cleaned.length === 6 && !isLoading && !userNotFound) {
      setTimeout(() => {
        handleOtpVerify();
      }, 100);
    }
  };

  // Request Resend OTP
  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsResending(true);
    setErrorMsg(null);

    try {
      // 1. Validate if user exists before sending OTP
      const userStatus = await checkUserStatus(email);
      if (!userStatus.exists) {
        const msg = userStatus.error || "No account found for this email address. Please sign up.";
        setErrorMsg(msg);
        // toast.error(msg);
        setUserNotFound(true);
        return;
      }

      // 2. Send OTP
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "email-verification",
      });

      if (error) {
        toast.error(error.message || "Failed to resend OTP.");
      } else {
        toast.success("A new 6-digit OTP code has been sent to your email!");
      }
    } catch {
      toast.error("Unable to resend OTP code.");
    } finally {
      setIsResending(false);
    }
  };

  if (checkingAccount) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 rounded-3xl shadow-xl text-center space-y-3 relative z-10">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Verifying account registration...</p>
      </div>
    );
  }

  if (userNotFound) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 rounded-3xl shadow-xl text-center space-y-4 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-600 mb-2">
          <UserX className="w-9 h-9 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Account Not Found</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          {errorMsg || `No registered teacher account was found for '${email}'. Please create an account to get started.`}
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-colors"
          >
            Create an Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 rounded-3xl shadow-xl text-center space-y-4 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mb-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Email Verified!</h1>
        <p className="text-xs text-slate-500">
          Your teacher account has been verified. Redirecting you to your subjects dashboard...
        </p>
        <div className="pt-4">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-colors"
          >
            Go to Subjects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 rounded-3xl shadow-xl space-y-6 relative z-10">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-1">
          <div className="w-16 h-16 rounded-2xl bg-blue-50/80 border border-blue-100/80 p-2.5 shadow-xs flex items-center justify-center">
            <Image
              src="/attendance logo1.webp"
              alt="CAMS Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify Your Account</h1>
        <p className="text-xs text-slate-500">
          Enter the 6-digit security OTP code sent to your email address.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleOtpVerify} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            disabled
            placeholder="teacher@school.edu"
            required
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 placeholder-slate-400 transition-all disabled:opacity-75 disabled:cursor-not-allowed select-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            6-Digit Verification Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-3xl tracking-[0.5em] font-mono font-extrabold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 text-center">
            Check your inbox or spam folder for the code.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length < 6}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] font-bold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Verifying OTP...</span>
            </>
          ) : (
            <>
              <span>Verify Code</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={isResending}
          className="text-blue-600 hover:text-blue-700 font-bold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isResending ? "Sending new code..." : "Resend 6-Digit OTP Code"}
        </button>
        <Link href="/login" className="text-slate-500 hover:text-slate-700 transition-colors mt-1 font-medium">
          Back to Teacher Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/70 p-4 text-slate-800 relative overflow-hidden [color-scheme:light]">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-300/15 blur-3xl rounded-full pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-slate-500">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
