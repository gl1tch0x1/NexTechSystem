'use client';

import { useParams } from 'next/navigation';
import { ProductEditorPage } from '@/components/admin/ProductEditorPage';

export default function ResellerNewProductPage() {
  const params = useParams();
  const code = (params?.code as string) || 'comnet101';

  return <ProductEditorPage mode="create" portal="reseller" resellerCode={code} />;
}
