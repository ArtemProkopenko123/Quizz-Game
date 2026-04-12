import { HomeShell } from '@/app/_components/HomeShell';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  return <HomeShell initialCode={code.toUpperCase()} />;
}
