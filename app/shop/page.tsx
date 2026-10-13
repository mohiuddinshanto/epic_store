import { Suspense } from "react";
import { prisma } from "../../api/lib/prisma";
import { ShopView } from "../../components/shop-view";
import ShopLoading from "./loading";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  let initialLayout: "classic" | "catalog" = "classic";
  try {
    const config = await prisma.storeConfig.findUnique({
      where: { id: "store-config-singleton" },
      select: { homePageConfig: true },
    });
    const homeConfig = config?.homePageConfig as { layout?: "classic" | "catalog" } | null;
    if (homeConfig?.layout === "catalog") initialLayout = "catalog";
  } catch {
    /* fallback to classic */
  }
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopView initialLayout={initialLayout} />
    </Suspense>
  );
}