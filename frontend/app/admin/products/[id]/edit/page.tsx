'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ProductEditorPage } from '@/components/admin/ProductEditorPage';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  return <ProductEditorPage mode="edit" productId={id} />;
}
