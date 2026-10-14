import { ProductView, type Product } from "../../../components/product-view";
import { SiteFooter } from "../../../components/store-footer";
import { fetchInternalJson } from "../../../lib/internal-fetch";

export const dynamic = "force-dynamic";

type Status = { config?: Record<string, any> | null } | null;
type Categories = { name: string; slug: string; parentId?: string | null }[];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, status, categories] = await Promise.all([
    fetchInternalJson<Product>(`/api/products/${slug}`),
    fetchInternalJson<Status>("/api/store/status"),
    fetchInternalJson<Categories>("/api/categories"),
  ]);
  return (
    <>
      <ProductView key={slug} slug={slug} initialProduct={data} />
      <SiteFooter initialStatus={status} initialCategories={categories} />
    </>
  );
}