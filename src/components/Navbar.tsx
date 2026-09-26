"use client";

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
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    try {
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

  const userName = session?.user?.name || "Teacher";
  const userEmail = session?.user?.email || "teacher@school.edu";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Top Header - Desktop & Mobile Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-8">
              <Link href="/home" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
                    CAMS Portal
                  </span>
                  <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                    Teacher Workspace
                  </span>
                </div>
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

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pr-3 border-r border-slate-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-sm font-bold text-slate-800">{userName}</p>
                  <p className="text-xs text-slate-500 max-w-[150px] truncate">{userEmail}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
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
