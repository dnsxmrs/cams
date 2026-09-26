"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

function getFriendlyErrorMessage(error?: Error & { digest?: string }): string {
  if (!error?.message) {
    return "An unexpected error occurred while processing your request. Please try again or return to subjects.";
  }

  const msg = error.message;

  // Mask database, SQL, or raw stack traces / technical jargon
  if (
    msg.includes("Prisma") ||
    msg.includes("PostgreSQL") ||
    msg.includes("postgres") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("SELECT") ||
    msg.includes("INSERT") ||
    msg.includes("UPDATE") ||
    msg.includes("DELETE")
  ) {
    return "A temporary database issue occurred. Please try refreshing or try again shortly.";
  }

  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Network connection issue detected. Please check your internet connection.";
  }

  // If it's a short, clean custom message (like validation or auth message), display it
  if (msg.length < 120 && !msg.includes("\n") && !msg.includes("at ")) {
    return msg;
  }

  return "An unexpected error occurred while processing your request. Please try again or return to subjects.";
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full technical error to console for debugging
    console.error("Application Error Boundary caught error:", error);
  }, [error]);

  const friendlyMessage = getFriendlyErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Something went wrong!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {friendlyMessage}
          </p>

          {error?.digest && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 font-mono">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/subjects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            Subjects
          </Link>
        </div>
      </div>
    </div>
  );
}

