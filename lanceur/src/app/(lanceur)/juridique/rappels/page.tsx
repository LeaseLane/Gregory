import { PageJuridique } from '../PageJuridique';
export default async function Page({ searchParams }: { searchParams: Promise<{ ouvrir?: string }> }) { const { ouvrir } = await searchParams; return <PageJuridique vue="rappels" ouvrir={!!ouvrir} />; }
