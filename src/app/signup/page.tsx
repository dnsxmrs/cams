"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validations";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs with Zod
    const validationResult = signUpSchema.safeParse({ name, email, password });
    if (!validationResult.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } =
        {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0] === "name") fieldErrors.name = issue.message;
        if (issue.path[0] === "email") fieldErrors.email = issue.message;
        if (issue.path[0] === "password") fieldErrors.password = issue.message;
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
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message || "Failed to create account. Please try again.");
      } else {
        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xl mb-2 shadow-sm">
            CAMS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h1>
          <p className="text-sm text-slate-500">
            Register as a teacher to get started with CAMS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prof. Jane Doe"
              className={`w-full px-4 py-2.5 bg-slate-50 border ${
                errors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-600"
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 placeholder-slate-400`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>
            )}
          </div>

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
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 placeholder-slate-400`}
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
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 placeholder-slate-400`}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] font-semibold text-sm text-white rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
