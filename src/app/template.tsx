export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col flex-1">
      {children}
    </div>
  );
}
