import { HomeForm } from './_components/HomeForm';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Quizz</h1>
          <p className="mt-2 text-zinc-500">Multiplayer quiz game</p>
        </div>

        <HomeForm />
      </div>
    </main>
  );
}
