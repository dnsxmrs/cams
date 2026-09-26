"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  GraduationCap,
  User,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    { name: "Home", href: "/home", icon: LayoutDashboard },
    { name: "Subjects", href: "/subjects", icon: BookOpen },
    { name: "Students", href: "/students", icon: Users },
    { name: "Attendance", href: "/sessions", icon: Calendar },
    { name: "History", href: "/reports", icon: TrendingUp },
  ];

  const userName = session?.user?.name || "Teacher Profile";
  const userEmail = session?.user?.email || "teacher@school.edu";

  return (
    <>
      {/* Top Header - Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-8">
              <Link href="/home" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
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
                          ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile Silhouette Button & Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border shadow-xs ${
                  isProfileOpen
                    ? "bg-blue-50 border-blue-400 text-blue-600 ring-2 ring-blue-500/20"
                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
                aria-label="User Profile"
                title="Profile & Options"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Profile Dropdown Popup */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 px-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Info */}
                  <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{userName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                  </div>

                  {/* Profile Page Button (Disabled) */}
                  <button
                    disabled
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-50/80 rounded-xl opacity-60 cursor-not-allowed mb-1"
                    title="Profile page coming soon"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile Page</span>
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Disabled
                    </span>
                  </button>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        {navLinks.map((link) => {
          const IconComponent = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-blue-700 font-bold bg-blue-50/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? "text-blue-600 scale-110" : "text-slate-500"} transition-transform duration-200`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
