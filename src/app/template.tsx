export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-entry min-h-full flex flex-col flex-1">
      {children}
    </div>
  );
}
