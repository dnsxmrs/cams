"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations";
import { AlertCircle, X, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Validate inputs with Zod
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0] === "email") fieldErrors.email = issue.message;
        if (issue.path[0] === "password") fieldErrors.password = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/subjects",
      });

      if (error) {
        const errorMsg =
          error.message || error.statusText || "Failed to log in. Please check your credentials.";
        setServerError(errorMsg);
        toast.error(errorMsg);

        if (errorMsg.toLowerCase().includes("verify") || errorMsg.toLowerCase().includes("email")) {
          setTimeout(() => {
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          }, 1500);
        }
      } else {
        toast.success("Logged in successfully!");
        router.push("/subjects");
        router.refresh();
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

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/forgot-password?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push("/forgot-password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/70 p-4 text-slate-800 relative overflow-hidden [color-scheme:light]">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-300/15 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 rounded-3xl shadow-xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-extrabold text-2xl mb-1 shadow-xs">
            CAMS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Login</h1>
          <p className="text-xs text-slate-500">
            Sign in to manage your subjects, student rosters, and attendance sessions
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

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-11 py-3 bg-slate-50/80 border ${
                  errors.password ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
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
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have a teacher account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:text-blue-700 font-bold transition-colors duration-200 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
