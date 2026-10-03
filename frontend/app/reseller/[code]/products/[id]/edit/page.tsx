'use client';

import { useParams } from 'next/navigation';
import { ProductEditorPage } from '@/components/admin/ProductEditorPage';

export default function ResellerEditProductPage() {
  const params = useParams();
  const code = (params?.code as string) || 'comnet101';
  const id = params?.id as string;

  return <ProductEditorPage mode="edit" productId={id} portal="reseller" resellerCode={code} />;
}
