import { HomeForm } from './HomeForm';

interface Props {
  initialCode?: string;
}

export function HomeShell({ initialCode }: Props) {
  return (
    <main className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 lg:p-8">

      {/* Decorative background orbs */}
      <div aria-hidden className="animate-float-slow pointer-events-none absolute -top-32 -left-32 size-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
      <div aria-hidden className="animate-float-medium pointer-events-none absolute -bottom-24 -right-24 size-[500px] rounded-full bg-fuchsia-600/15 blur-[100px]" style={{ animationDelay: '1.5s' }} />
      <div aria-hidden className="animate-float-slow pointer-events-none absolute top-1/2 left-1/2 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-700/10 blur-[80px]" style={{ animationDelay: '3s' }} />

      {/* Card — narrow on mobile, wider on desktop */}
      <div className="animate-card-in relative z-10 w-full max-w-sm lg:max-w-4xl">

        {/* Desktop: side-by-side; Mobile: stacked */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

          {/* Left: branding */}
          <div className="mb-8 text-center lg:mb-0 lg:flex-1 lg:text-left">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm ring-1 ring-white/20 lg:size-20 lg:text-4xl">
              ⚡
            </div>
            <h1 className="animate-shimmer bg-linear-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-5xl font-black tracking-tight text-transparent lg:text-7xl">
              QUIZZ
            </h1>
            <p className="mt-2 text-sm font-medium text-white/40 tracking-widest uppercase lg:text-base">
              Multiplayer · Real-time
            </p>
            <div className="mt-6 hidden lg:flex flex-col gap-3 text-left">
              <Feature icon="🎮" label="Create or join a game" />
              <Feature icon="⚡" label="Real-time multiplayer" />
              <Feature icon="🏆" label="Compete with friends" />
              <Feature icon="🗳️" label="Vote on categories" />
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:flex-1 lg:max-w-sm">
            <div className="rounded-2xl bg-white/8 p-6 backdrop-blur-xl ring-1 ring-white/12 lg:p-8">
              <HomeForm initialCode={initialCode} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-white/8 text-base ring-1 ring-white/10">
        {icon}
      </span>
      <span className="text-sm font-medium text-white/50">{label}</span>
    </div>
  );
}
