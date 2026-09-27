"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validations";
import { AlertCircle, X, Eye, EyeOff, Lock, Mail, User, CheckCircle2, Circle, ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Live Password Criteria Checks
  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { label: "One number (0-9)", valid: /[0-9]/.test(password) },
    { label: "One special character (!@#$%...)", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const isPasswordValid = passwordChecks.every((check) => check.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Validate inputs with Zod
    const validationResult = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const fieldErrors: {
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof typeof fieldErrors;
        if (fieldName) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/subjects",
      });

      if (error) {
        const errorMsg =
          error.message || error.statusText || "Failed to create account. Email may already be registered.";
        setServerError(errorMsg);
        toast.error(errorMsg);
      } else {
        // Automatically request verification OTP
        authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        }).catch(() => {});

        toast.success("Account created! A 6-digit OTP code has been sent to your email.");
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Unable to connect to the authentication service.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/70 p-4 text-slate-800 relative overflow-hidden py-12 [color-scheme:light]">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-300/15 blur-3xl rounded-full pointer-events-none" />

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h1>
          <p className="text-xs text-slate-500">
            Register as a teacher to start managing classes and taking attendance
          </p>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span>{serverError}</span>
            </div>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-500 hover:text-red-800 p-0.5 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prof. Jane Doe"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50/80 border ${
                  errors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200`}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email Address */}
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
                className={`w-full pl-10 pr-4 py-3 bg-slate-50/80 border ${
                  errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email}</p>
            )}
          </div>

          {/* First Password Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-11 py-3 bg-slate-50/80 border ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : isPasswordValid
                    ? "border-emerald-500 focus:ring-emerald-500"
                    : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password}</p>
            )}
            {isPasswordValid && !errors.password && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Password criteria met
              </p>
            )}

            {/* LIVE PASSWORD REQUIREMENTS CHECKLIST (HIDDEN ONCE ALL CONDITIONS MET) */}
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

          {/* Confirm Password Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-11 py-3 bg-slate-50/80 border ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : confirmPassword && confirmPassword === password
                    ? "border-emerald-500 focus:ring-emerald-500"
                    : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all duration-200`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.confirmPassword}</p>
            )}
            {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] font-bold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-bold transition-colors duration-200 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
