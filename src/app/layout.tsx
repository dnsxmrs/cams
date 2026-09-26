import type { Metadata } from "next";
import { Inter, Krub } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const krub = Krub({
  weight: ["400", "500", "600", "700"],
  variable: "--font-krub",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Class Attendance Management System (CAMS)",
  description: "Manage subjects, enroll students, and record attendance seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${krub.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {children}
      </body>
    </html>
  );
}
