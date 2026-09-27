"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle OTP Submission
  const handleOtpVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      const { error } = await authClient.emailOtp.verifyEmail({
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
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify OTP code.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Auto Submit when 6th digit typed
  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setOtp(cleaned);
    if (cleaned.length === 6) {
      // Small timeout for user UX before auto submitting
      setTimeout(() => {
        if (!isLoading) {
          authClient.emailOtp
            .verifyEmail({
              email,
              otp: cleaned,
            })
            .then(({ error }) => {
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
                }, 1200);
              }
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : "Failed to verify OTP code.";
              setErrorMsg(msg);
              toast.error(msg);
            });
        }
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
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
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

  if (isVerified) {
    return (
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
        <p className="text-xs text-slate-400">
          Your teacher account has been verified. Redirecting you to your subjects dashboard...
        </p>
        <div className="pt-4">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg transition-colors"
          >
            Go to Subjects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-1 shadow-inner">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Verify Your Account</h1>
        <p className="text-xs text-slate-400">
          Enter the 6-digit security OTP code sent to your email address.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs font-semibold text-red-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleOtpVerify} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@school.edu"
            required
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            6-Digit Verification Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-3xl tracking-[0.5em] font-mono font-extrabold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            />
            <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 text-center">
            Check your inbox or spam folder for the code.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length < 6}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] font-bold text-sm text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
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

      <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={isResending}
          className="text-blue-400 hover:text-blue-300 font-bold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isResending ? "Sending new code..." : "Resend 6-Digit OTP Code"}
        </button>
        <Link href="/login" className="text-slate-500 hover:text-slate-300 transition-colors mt-1">
          Back to Teacher Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-slate-100 relative overflow-hidden">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
