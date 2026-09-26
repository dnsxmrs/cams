import Navbar from "@/components/Navbar";
import { requireTeacherAuth } from "@/lib/auth";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacherAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-16 md:pb-0 transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-entry">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        Class Attendance Management System (CAMS) &copy; {new Date().getFullYear()} &bull; Built with Next.js & Prisma
      </footer>
    </div>
  );
}
