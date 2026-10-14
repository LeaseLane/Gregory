import { PageJuridique } from './PageJuridique';
export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string; ouvrir?: string }> }) { const { d, ouvrir } = await searchParams; return <PageJuridique vue="dossiers" id={d} ouvrir={!!ouvrir} />; }
