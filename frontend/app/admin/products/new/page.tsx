
import { ProductEditorPage } from '@/components/admin/ProductEditorPage';

export const metadata = {
  title: 'Add New Hardware SKU | NexTech Admin',
  description: 'Configure and publish enterprise computer hardware SKUs with multi-variant options and warehouse tracking',
};

export default function NewProductPage() {
  return <ProductEditorPage mode="create" />;
}
