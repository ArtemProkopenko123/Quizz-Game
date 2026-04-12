import { HomeForm } from './HomeForm';

interface Props {
  initialCode?: string;
}

export function HomeShell({ initialCode }: Props) {
  return (
    <main className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-slate-950 p-6">

      {/* Decorative background orbs */}
      <div aria-hidden className="animate-float-slow pointer-events-none absolute -top-32 -left-32 size-[480px] rounded-full bg-violet-600/25 blur-[96px]" />
      <div aria-hidden className="animate-float-medium pointer-events-none absolute -bottom-24 -right-24 size-[400px] rounded-full bg-fuchsia-600/20 blur-[80px]" style={{ animationDelay: '1.5s' }} />
      <div aria-hidden className="animate-float-slow pointer-events-none absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-700/15 blur-[72px]" style={{ animationDelay: '3s' }} />

      {/* Card */}
      <div className="animate-card-in relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex size-16 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm ring-1 ring-white/20">
            ⚡
          </div>
          <h1 className="animate-shimmer bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
            QUIZZ
          </h1>
          <p className="mt-2 text-sm font-medium text-white/40 tracking-widest uppercase">
            Multiplayer · Real-time
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white/8 p-6 backdrop-blur-xl ring-1 ring-white/12">
          <HomeForm initialCode={initialCode} />
        </div>

      </div>
    </main>
  );
}
