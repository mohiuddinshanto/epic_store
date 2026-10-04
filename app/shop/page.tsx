import { Suspense } from "react";
import { ShopView } from "../../components/shop-view";
import { internalApiUrl } from "../../lib/internal-api";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  let initialLayout: "classic" | "catalog" = "classic";
  try {
    const res = await fetch(internalApiUrl("/api/store/status"), {
      cache: "no-store",
      signal: AbortSignal.timeout(1_500),
    });
    const data = await res.json();
    if (data?.config?.homePageConfig?.layout === "catalog") initialLayout = "catalog";
  } catch {
    /* fallback to classic */
  }
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-gray-600">শপ পেইজ লোড হচ্ছে...</p>
          </div>
        </main>
      }
    >
      <ShopView initialLayout={initialLayout} />
    </Suspense>
  );
}