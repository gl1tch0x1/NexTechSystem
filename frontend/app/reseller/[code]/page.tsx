import { redirect } from 'next/navigation';

export default async function ResellerRootPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/reseller/${code}/dashboard`);
}
