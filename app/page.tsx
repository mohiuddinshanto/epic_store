import { prisma } from "../api/lib/prisma";
import { Storefront, type HomePageConfig } from "../components/storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialLayout: "classic" | "catalog" = "classic";
  let initialHomeConfig: HomePageConfig | null = null;
  try {
    const config = await prisma.storeConfig.findUnique({
      where: { id: "store-config-singleton" },
      select: { homePageConfig: true },
    });
    const homeConfig = (config?.homePageConfig ?? null) as HomePageConfig | null;
    if (homeConfig) {
      initialHomeConfig = homeConfig;
      if (homeConfig.layout === "catalog") initialLayout = "catalog";
    }
  } catch {
    /* fallback to classic */
  }

  return <Storefront initialLayout={initialLayout} initialHomeConfig={initialHomeConfig} />;
}
