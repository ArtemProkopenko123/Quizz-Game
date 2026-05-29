export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950">
      {/* Ambient orbs */}
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none fixed -top-40 -left-40 size-[600px] rounded-full bg-violet-700/15 blur-[130px]"
      />
      <div
        aria-hidden
        className="animate-float-medium pointer-events-none fixed -bottom-32 -right-32 size-[500px] rounded-full bg-fuchsia-700/12 blur-[110px]"
        style={{ animationDelay: '2s' }}
      />
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none fixed bottom-1/2 right-1/4 size-[350px] rounded-full bg-indigo-700/10 blur-[90px]"
        style={{ animationDelay: '4s' }}
      />

      {/* Top nav bar */}
      <nav className="relative z-20 flex items-center justify-center border-b border-white/6 bg-slate-950/60 px-4 py-2.5 backdrop-blur-md">
        <span className="bg-linear-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-lg font-black tracking-tight text-transparent">
          QUIZZ
        </span>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
