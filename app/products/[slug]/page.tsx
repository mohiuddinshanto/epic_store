import { ProductView, type Product } from "../../../components/product-view";
import { fetchInternalJson } from "../../../lib/internal-fetch";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchInternalJson<Product>(`/api/products/${slug}`);
  return <ProductView key={slug} slug={slug} initialProduct={data} />;
}