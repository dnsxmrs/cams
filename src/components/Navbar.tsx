"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import {
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  GraduationCap,
  User,
  Sun,
  Moon,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme === "dark" || (!savedTheme && prefersDark);
  });

  // Sync class on document root when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setTheme = (toDark: boolean) => {
    setIsDarkMode(toDark);
    if (toDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      toast.success("Switched to Dark Mode");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      toast.success("Switched to Light Mode");
    }
  };

  const toggleThemeQuick = () => {
    setTheme(!isDarkMode);
  };

  const handleSignOut = async () => {
    try {
      setIsProfileOpen(false);
      await authClient.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const navLinks = [
    { name: "Subjects", href: "/subjects", icon: BookOpen },
    { name: "Students", href: "/students", icon: Users },
    { name: "History", href: "/history", icon: Calendar },
    { name: "Reports", href: "/reports", icon: TrendingUp },
  ];

  const userName = session?.user?.name || "Teacher Profile";
  const userEmail = session?.user?.email || "teacher@school.edu";

  return (
    <>
      {/* Top Header - Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-8">
              <Link href="/subjects" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                  CAMS Portal
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 font-semibold shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Header Actions & Profile Dropdown */}
            <div className="flex items-center gap-2">

              {/* Profile Silhouette Button & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border shadow-xs ${
                    isProfileOpen
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  aria-label="User Profile"
                  title="Profile & Options"
                >
                  <User className="w-5 h-5" />
                </button>

                {/* Profile Dropdown Popup */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 px-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Profile Info */}
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {userName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>

                    {/* Sleek Segmented Theme Toggle Switch */}
                    <div className="px-1 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 mb-1.5">
                        <span>Appearance</span>
                        <span className="font-mono text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                          {isDarkMode ? "Dark" : "Light"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                        <button
                          type="button"
                          onClick={() => setTheme(false)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !isDarkMode
                              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Sun className={`w-3.5 h-3.5 ${!isDarkMode ? "text-amber-500" : ""}`} />
                          <span>Light</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme(true)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isDarkMode
                              ? "bg-slate-900 text-white shadow-xs border border-slate-700"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Moon className={`w-3.5 h-3.5 ${isDarkMode ? "text-blue-400" : ""}`} />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg transition-colors">
        {navLinks.map((link) => {
          const IconComponent = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-blue-700 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/60"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <IconComponent
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600 dark:text-blue-400 scale-110" : "text-slate-500 dark:text-slate-400"
                } transition-transform duration-200`}
              />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
