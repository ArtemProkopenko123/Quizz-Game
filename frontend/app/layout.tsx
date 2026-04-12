import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Quizz',
  description: 'Multiplayer quiz game',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-dvh`}>
      <body className="h-full bg-zinc-50 font-sans antialiased">{children}</body>
    </html>
  );
}
