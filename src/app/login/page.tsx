"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations";
import { AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          }, 2000);
        }
      } else {
        toast.success("Logged in successfully!");
        router.push("/subjects");
        router.refresh();
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.toString() || "Unable to connect to the authentication service.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl space-y-6 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xl mb-2 shadow-sm transition-transform duration-300 hover:scale-105">
            CAMS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Login</h1>
          <p className="text-sm text-slate-500">
            Sign in to manage your subjects, students, and attendance
          </p>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span>{serverError}</span>
            </div>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-400 hover:text-red-600 p-0.5 rounded-md hover:bg-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${
                errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-600"
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 text-slate-900 placeholder-slate-400`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${
                errors.password ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-600"
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 text-slate-900 placeholder-slate-400`}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] font-semibold text-sm text-white rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
                Logging in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have a teacher account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

