import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-entry">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        Class Attendance Management System (CAMS) &copy; {new Date().getFullYear()} &bull; Built with Next.js & Prisma
      </footer>
    </div>
  );
}
