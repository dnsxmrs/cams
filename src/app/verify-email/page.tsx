"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialEmail = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automatically verify if URL contains token from email link
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      authClient
        .verifyEmail({
          query: { token, callbackURL: "/subjects" },
        })
        .then(({ error }) => {
          if (error) {
            setErrorMsg(error.message || "Email verification link expired or invalid.");
            toast.error("Verification failed");
          } else {
            setIsVerified(true);
            toast.success("Email verified successfully!");
            setTimeout(() => {
              router.push("/subjects");
              router.refresh();
            }, 1500);
          }
        })
        .catch((err) => {
          setErrorMsg(err.message || "Failed to verify token.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token, router]);

  // Handle OTP Submission
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
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
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otp.trim(),
      });

      if (error) {
        const msg = error.message || "Invalid or expired OTP code.";
        setErrorMsg(msg);
        toast.error(msg);
      } else {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        setTimeout(() => {
          router.push("/subjects");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to verify OTP code.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
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
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        toast.error(error.message || "Failed to resend OTP.");
      } else {
        toast.success("A new 6-digit OTP code has been sent to your email!");
      }
    } catch (err: any) {
      toast.error("Unable to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // Request Resend Email Link
  const handleResendLink = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsResending(true);
    setErrorMsg(null);

    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/subjects",
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification link.");
      } else {
        toast.success("Verification email link sent!");
      }
    } catch (err: any) {
      toast.error("Unable to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Email Verified!</h1>
        <p className="text-sm text-slate-600">
          Your account has been successfully verified. Redirecting you to your dashboard...
        </p>
        <div className="pt-4">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 mb-2">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify Your Email</h1>
        <p className="text-sm text-slate-500">
          We sent a verification link and a 6-digit OTP code to your inbox.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleOtpVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@school.edu"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            6-Digit OTP Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl tracking-[0.4em] font-mono font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Check your email inbox or spam folder for the code.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length < 6}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] font-semibold text-sm text-white rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            "Verify OTP Code"
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50"
          >
            Resend OTP Code
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={handleResendLink}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50"
          >
            Resend Email Link
          </button>
        </div>
        <Link href="/login" className="text-slate-500 hover:text-slate-700 transition-colors mt-2">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 text-slate-800">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
