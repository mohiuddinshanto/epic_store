import { prisma } from "../api/lib/prisma";
import { Storefront } from "../components/storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
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

  return <Storefront initialLayout={initialLayout} />;
}
