export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950">
      {/* Ambient orbs — fixed so they don't scroll */}
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none fixed -top-40 -left-40 size-[500px] rounded-full bg-violet-700/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-float-medium pointer-events-none fixed -bottom-32 -right-32 size-[420px] rounded-full bg-fuchsia-700/15 blur-[100px]"
        style={{ animationDelay: '2s' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
