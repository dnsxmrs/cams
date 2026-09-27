"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import {
  KeyRound,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Circle,
  ArrowLeft,
} from "lucide-react";

import { checkUserExists } from "@/actions/auth";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Request OTP, 2 = Enter OTP & New Password

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Password Criteria Checks
  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { label: "One number (0-9)", valid: /[0-9]/.test(password) },
    { label: "One special character (!@#$%...)", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const isPasswordValid = passwordChecks.every((check) => check.valid);

  // Step 1: Send Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Validate if user exists via Server Action
      const userCheck = await checkUserExists(email);
      if (!userCheck.exists) {
        const msg = userCheck.error || "No registered account found with this email address.";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      // 2. User exists: send verification OTP
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "forget-password",
      });

      if (error) {
        const msg = error.message || "Failed to send reset code. Please check your email address.";
        setErrorMsg(msg);
        toast.error(msg);
      } else {
        toast.success("A 6-digit password reset code has been sent to your email!");
        setStep(2);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to connect to authentication server.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }
    if (!isPasswordValid) {
      toast.error("Please ensure your new password meets all security requirements.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
      });

      if (error) {
        const msg = error.message || "Failed to reset password. OTP code may be invalid or expired.";
        setErrorMsg(msg);
        toast.error(msg);
      } else {
        toast.success("Password reset successfully! You can now sign in with your new password.");
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(email)}`);
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Reset Code
  const handleResendOTP = async () => {
    if (!email) return;
    setIsResending(true);
    setErrorMsg(null);

    try {
      const userCheck = await checkUserExists(email);
      if (!userCheck.exists) {
        toast.error(userCheck.error || "No registered account found with this email address.");
        return;
      }

      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "forget-password",
      });

      if (error) {
        toast.error(error.message || "Failed to resend code.");
      } else {
        toast.success("A new 6-digit code has been sent to your email!");
      }
    } catch {
      toast.error("Unable to resend reset code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 rounded-3xl shadow-xl space-y-6 relative z-10">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-extrabold text-2xl mb-1 shadow-xs">
          <KeyRound className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {step === 1 ? "Forgot Password?" : "Reset Password"}
        </h1>
        <p className="text-xs text-slate-500">
          {step === 1
            ? "Enter your registered teacher email to receive a 6-digit reset code"
            : `Enter the code sent to ${email} and create your new password`}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMsg}</div>
        </div>
      )}

      {step === 1 ? (
        /* STEP 1: Email Request Form */
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] font-bold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Reset Code</span>
                {/* <ArrowRight className="w-4 h-4" /> */}
              </>
            )}
          </button>
        </form>
      ) : (
        /* STEP 2: OTP + New Password Form */
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Target Email (Disabled) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              {/* <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Change Email
              </button> */}
            </div>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed select-none"
            />
          </div>

          {/* 6-Digit OTP Code */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              6-Digit Reset Code
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl tracking-[0.4em] font-mono font-extrabold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-10 pr-11 py-3 bg-slate-50/80 border ${
                  isPasswordValid
                    ? "border-emerald-500 focus:ring-emerald-500"
                    : "border-slate-300 focus:ring-blue-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isPasswordValid && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Password criteria met
              </p>
            )}

            {!isPasswordValid && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  {passwordChecks.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 transition-colors ${
                        item.valid ? "text-emerald-600 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {item.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-10 pr-11 py-3 bg-slate-50/80 border ${
                  confirmPassword && confirmPassword === password
                    ? "border-emerald-500 focus:ring-emerald-500"
                    : "border-slate-300 focus:ring-blue-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword === password && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !otp || !isPasswordValid || password !== confirmPassword}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] font-bold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isResending ? "Sending code..." : "Resend 6-Digit Reset Code"}
            </button>
          </div>
        </form>
      )}

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-bold transition-colors duration-200"
        >
          {/* <ArrowLeft className="w-3.5 h-3.5" /> */}
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/70 p-4 text-slate-800 relative overflow-hidden [color-scheme:light]">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-300/15 blur-3xl rounded-full pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-slate-500">Loading...</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
