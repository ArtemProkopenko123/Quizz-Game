import { SessionView } from './_components/SessionView';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { code } = await params;
  return <SessionView code={code} />;
}
