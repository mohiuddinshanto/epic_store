"use client";

import { Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { waNumber } from "../lib/wa";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CarouselSlider } from "./carousel-slider";
import { CatalogHome } from "./catalog-home";
import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiHeart,
  FiHome,
  FiLayers,
  FiMessageCircle,
  FiMessageSquare,
  FiMinus,
  FiNavigation,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTrash2,
  FiTruck,
  FiUser,
  FiX,
  FiMenu,
  FiZap,
  FiCheck,
  FiHeadphones,
} from "react-icons/fi";

const apiUrl = "";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  salePrice: string | null;
  description?: string;
  images: string[];
  categoryId: string;
  productType?: string;
  category: { id?: string; name: string; slug: string };
  attributes?: { id: string; name: string; values: { id: string; value: string }[] }[];
  variations?: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    salePrice: number | null;
    stock: number;
    image: string | null;
    attributes: { attributeId: string; valueId: string; value: { value: string } }[];
  }[];
};

type Variation = NonNullable<Product["variations"]>[number];

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  subCategories?: Category[];
};
type MenuItem = { id: string; label: string; type: "category" | "custom"; categoryId?: string; href?: string; children?: MenuItem[] };

type CartItem = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  price: number;
  categoryId: string;
  qty: number;
  variationId?: string;
  sku?: string;
};

type ChatConfig = {
  enabled?: boolean;
  whatsapp?: { enabled?: boolean; number?: string; template?: string };
  messenger?: { enabled?: boolean; url?: string };
  phone?: string;
};

type HomeSection = {
  id: string;
  title?: string;
  categoryIds: string[];
  mode: "carousel" | "grid" | "responsive";
  auto: boolean;
  seconds: number;
  perView: { mobile: number; tablet: number; desktop: number };
  pagination: boolean;
  loop: boolean;
  showViewAll: boolean;
};

type CategoryDisplayConfig = {
  mode?: "grid" | "carousel" | "loop";
  auto?: boolean;
  loop?: boolean;
  seconds?: number;
  pagination?: boolean;
  perView?: { mobile: number; tablet: number; desktop: number };
};

type FlashDealConfig = {
  enabled?: boolean;
  badge?: string;
  titlePrefix?: string;
  description?: string;
  buttonLabel?: string;
  productId?: string;
  autoPick?: boolean;
  countdownMode?: "midnight" | "hours";
  countdownHours?: number;
  showCountdown?: boolean;
};

type PromoBannerConfig = {
  enabled?: boolean;
  badge?: string;
  title?: string;
  accent?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonLink?: string;
  image?: string;
};

type TrustBadgeConfig = {
  enabled?: boolean;
  icon?: string;
  title?: string;
  subtitle?: string;
};

type HomePageConfig = {
  sections: HomeSection[];
  layout?: "classic" | "catalog";
  categories?: CategoryDisplayConfig & { eyebrow?: string; title?: string; accent?: string; countLabel?: string };
  flashDeal?: FlashDealConfig;
  promoBanners?: PromoBannerConfig[];
  trustBadges?: TrustBadgeConfig[];
  testimonials?: {
    enabled?: boolean;
    eyebrow?: string;
    title?: string;
    accent?: string;
    subtitle?: string;
    items?: { init?: string; image?: string; name?: string; role?: string; quote?: string; rating?: number }[];
  };
  newsletter?: {
    enabled?: boolean;
    badge?: string;
    title?: string;
    accent?: string;
    subtitle?: string;
    placeholder?: string;
    button?: string;
    note?: string;
  };
  footer?: {
    enabled?: boolean;
    copyright?: string;
    links?: { label?: string; url?: string }[];
  };
};

type HeroBannerConfig = {
  enabled?: boolean;
  image?: string | null;
  badge?: string | null;
  title?: string | null;
  accent?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  buttonLink?: string | null;
  secondaryLabel?: string | null;
  secondaryLink?: string | null;
  announceText?: string | null;
  announceBadge?: string | null;
  announceLinkLabel?: string | null;
  announceLink?: string | null;
  seconds?: number;
  trendingPill?: {
    enabled?: boolean;
    topText?: string | null;
    bottomText?: string | null;
  };
  slides?: {
    id: string;
    image?: string | null;
    badge?: string | null;
    title?: string | null;
    accent?: string | null;
    subtitle?: string | null;
    buttonLabel?: string | null;
    buttonLink?: string | null;
    secondaryLabel?: string | null;
    secondaryLink?: string | null;
  }[];
};

type HeroSlide = {
  id: string;
  image: string;
  badge: string | null;
  title: string | null;
  accent: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
  secondaryLabel: string | null;
  secondaryLink: string | null;
};

const DEFAULT_HERO: Required<Pick<HeroBannerConfig, "badge" | "title" | "accent" | "subtitle" | "buttonLabel" | "buttonLink" | "secondaryLabel" | "secondaryLink" | "announceText">> = {
  badge: "ঈদ ও উৎসব কালেকশন ২০২৬",
  title: "Objects for",
  accent: "a softer daily life.",
  subtitle:
    "Thoughtfully curated premium pieces designed to work beautifully every single day — from Dhaka to Dhaka, delivered everywhere in between.",
  buttonLabel: "Explore Collection",
  buttonLink: "/shop",
  secondaryLabel: "Shop by Category",
  secondaryLink: "#categories",
  announceText: "ঈদ ও উৎসব কালেকশন: ৳৩,০০০+ অর্ডারে ঢাকা ও চট্টগ্রামে ফ্রি এক্সপ্রেস ডেলিভারি",
};

const money = (v: number | string) => `৳ ${Number(v).toLocaleString("en-BD")}`;

const TRUST_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  shield: FiShield,
  truck: FiTruck,
  refresh: FiRefreshCw,
  check: FiCheck,
  clock: FiClock,
  star: FiStar,
  headset: FiHeadphones,
  chat: FiMessageCircle,
};

const DEFAULT_TRUST_BADGES: TrustBadgeConfig[] = [
  { enabled: true, icon: "shield", title: "100% Genuine", subtitle: "Origin-checked quality" },
  { enabled: true, icon: "truck", title: "Express BD Delivery", subtitle: "All 64 districts in 2–4 days" },
  { enabled: true, icon: "check", title: "Flexible Payment", subtitle: "COD, bKash, Nagad, Cards" },
  { enabled: true, icon: "refresh", title: "Easy Exchange", subtitle: "7-day hassle-free returns" },
];

const DEFAULT_FOOTER_LINKS = [
  { label: "Privacy Notice", url: "/" },
  { label: "Terms of Service", url: "/" },
  { label: "Shipping", url: "#shop" },
  { label: "Contact", url: "/account" },
];

type Testimonial = { init?: string; image?: string; name?: string; role?: string; quote?: string; rating?: number };

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    init: "TM",
    name: "Tasnim Mahbub",
    role: "Verified Buyer • Dhaka",
    quote:
      "The linen shirt felt premium the moment I opened the box. Delivery to Dhanmondi took just two days — quality and speed both exceeded expectations.",
  },
  {
    init: "SR",
    name: "Sakib Rahman",
    role: "Verified Buyer • Chattogram",
    quote:
      "Ordered the sneakers during the festive drop and got a solid discount. Comfort is real — I wear them daily. bKash checkout was effortless.",
  },
  {
    init: "NF",
    name: "Nusrat Faria",
    role: "Boutique Owner • Sylhet",
    quote:
      "We stock EPIC essentials for our boutique clients. Consistent quality, honest pricing, and their exchange policy keeps our customers happy.",
  },
];

const scrollToId = (link: string) => {
  const id = link.replace(/^#/, "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

function HeroCta({ label, link, secondary }: { label: string | null; link: string | null; secondary?: boolean }) {
  const text = label || (secondary ? "Shop by Category" : "Explore Collection");
  const href = link || (secondary ? "#categories" : "#categories");
  const content = secondary ? (
    <span className="inline-flex items-center gap-2">
      <FiLayers /> {text}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2">
      {text} <FiArrowRight className="ml-1 inline" />
    </span>
  );
  if (href.startsWith("#")) {
    return secondary ? (
      <button
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
        onClick={() => scrollToId(href)}
      >
        {content}
      </button>
    ) : (
      <Button
        color="primary"
        radius="full"
        size="lg"
        className="px-8 font-bold shadow-lg shadow-indigo-500/20"
        onPress={() => scrollToId(href)}
      >
        {content}
      </Button>
    );
  }
  const isExternal = /^https?:/.test(href);
  const cls = secondary
    ? "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
    : "inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark";
  return (
    <Link href={href} target={isExternal ? "_blank" : undefined} className={cls}>
      {content}
    </Link>
  );
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fashion: <FiShoppingBag size={24} />,
  footwear: <FiNavigation size={24} />,
  home: <FiHome size={24} />,
  lifestyle: <FiLayers size={24} />,
};

export function Storefront() {
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [homeConfig, setHomeConfig] = useState<HomePageConfig | null>(null);
  const [bannerConfig, setBannerConfig] = useState<HeroBannerConfig | null>(null);
  const [navMenus, setNavMenus] = useState<MenuItem[]>([]);
  const [storeName, setStoreName] = useState("EPIC");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [allowAddToCart, setAllowAddToCart] = useState(true);
  const [bottomNav, setBottomNav] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/products?home=1`).then((r) => r.json()),
      fetch(`${apiUrl}/api/categories`).then((r) => r.json()),
      fetch(`${apiUrl}/api/store/status`).then((r) => r.json()),
    ])
      .then(([p, c, status]) => {
        if (Array.isArray(p)) setProducts(p);
        if (Array.isArray(c)) setCategories(c);
        if (status?.config?.chatConfig) setChatConfig(status.config.chatConfig);
        if (status?.config?.homePageConfig) setHomeConfig(status.config.homePageConfig);
        if (status?.config?.heroBannerConfig) setBannerConfig(status.config.heroBannerConfig);
        if (status?.config?.navigationConfig?.menus?.[0]?.items) setNavMenus(status.config.navigationConfig.menus[0].items);
        if (typeof status?.config?.storeName === "string" && status.config.storeName.trim()) setStoreName(status.config.storeName.trim());
        if (status?.config?.logoUrl) setLogoUrl(status.config.logoUrl);
        setAllowAddToCart(status?.config?.featureFlags?.addToCart !== false);
        setBottomNav(status?.config?.featureFlags?.bottomNav !== false);
      })
      .catch(() => {});

    const stored = localStorage.getItem("epic-cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("epic-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const token = localStorage.getItem("epic-customer-token");
    if (!token) return;
    fetch(`${apiUrl}/api/wishlist`, { headers: { Authorization: "Bearer " + token } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Array<{ productId: string }>) => setWishlist(list.map((i) => i.productId)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cfg = homeConfig?.flashDeal;
    const mode = cfg?.countdownMode ?? "midnight";
    const hours = Math.min(168, Math.max(1, Number(cfg?.countdownHours) || 1));
    const tick = () => {
      const now = new Date();
      let target: Date;
      if (mode === "hours") {
        target = new Date(now.getTime() + hours * 3600 * 1000);
      } else {
        target = new Date(now);
        target.setHours(24, 0, 0, 0);
      }
      setCountdown(Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [homeConfig?.flashDeal?.countdownMode, homeConfig?.flashDeal?.countdownHours]);

  const categorySections = useMemo(
    () =>
      categories
        .filter((c) => products.some((p) => p.category.slug === c.slug))
        .map((c) => ({
          ...c,
          items: products.filter((p) => p.category.slug === c.slug),
        })),
    [categories, products]
  );

  type GroupedSection = HomeSection & { items: Product[]; name: string; slug: string | null };

  const defaultSections = useMemo<GroupedSection[]>(
    () =>
      categorySections.map((c) => ({
        id: `cat-${c.slug}`,
        title: "",
        categoryIds: [c.id],
        mode: "carousel" as const,
        auto: true,
        seconds: 3,
        perView: { mobile: 1, tablet: 2, desktop: 4 },
        pagination: false,
        loop: false,
        showViewAll: true,
        items: c.items,
        name: c.name,
        slug: c.slug,
      })),
    [categorySections]
  );

  const homeSections = useMemo<GroupedSection[]>(() => {
    if (!homeConfig?.sections?.length) return defaultSections;
    return homeConfig.sections
      .map((s) => {
        const cats = categories.filter((c) => s.categoryIds.includes(c.id));
        const items = products.filter((p) => s.categoryIds.includes(p.categoryId));
        return {
          ...s,
          items,
          name: (s.title && s.title.trim()) || cats.map((c) => c.name).join(" + "),
          slug: cats.length === 1 ? cats[0].slug : null,
        };
      })
      .filter((s) => s.items.length > 0);
  }, [homeConfig, categories, products, defaultSections]);

  const featuredDeal = useMemo(() => {
    const cfg = homeConfig?.flashDeal;
    const auto = cfg?.autoPick !== false;
    if (!auto && cfg?.productId) {
      const picked = products.find((p) => p.id === cfg.productId || p.slug === cfg.productId);
      if (picked) return picked;
    }
    return products.find((p) => p.salePrice && Number(p.salePrice) < Number(p.price)) ?? products[0];
  }, [products, homeConfig?.flashDeal?.autoPick, homeConfig?.flashDeal?.productId]);

  const heroImage = useMemo(
    () =>
      products.find((p) => p.slug === "signature-linen-shirt")?.images[0] ??
      products[0]?.images[0] ??
      FALLBACK_IMG,
    [products]
  );

  const activeLayout = homeConfig?.layout ?? "classic";

  const categoryConfig = homeConfig?.categories ?? {};
  const categoryMode: "grid" | "carousel" | "loop" = categoryConfig.mode ?? "grid";

  const hero = useMemo(() => {
    const fallbackSlide: HeroSlide = {
      id: "fallback",
      image: bannerConfig?.image || heroImage,
      badge: bannerConfig?.badge ?? DEFAULT_HERO.badge,
      title: bannerConfig?.title ?? DEFAULT_HERO.title,
      accent: bannerConfig?.accent ?? DEFAULT_HERO.accent,
      subtitle: bannerConfig?.subtitle ?? DEFAULT_HERO.subtitle,
      buttonLabel: bannerConfig?.buttonLabel ?? DEFAULT_HERO.buttonLabel,
      buttonLink: bannerConfig?.buttonLink ?? DEFAULT_HERO.buttonLink,
      secondaryLabel: bannerConfig?.secondaryLabel ?? DEFAULT_HERO.secondaryLabel,
      secondaryLink: bannerConfig?.secondaryLink ?? DEFAULT_HERO.secondaryLink,
    };
    const rawSlides = bannerConfig?.slides;
    const slides: HeroSlide[] =
      rawSlides && rawSlides.length > 0
        ? rawSlides.map((s, i) => ({
            id: s.id || `slide-${i}`,
            image: s.image || heroImage,
            badge: s.badge ?? fallbackSlide.badge,
            title: s.title ?? fallbackSlide.title,
            accent: s.accent ?? fallbackSlide.accent,
            subtitle: s.subtitle ?? fallbackSlide.subtitle,
            buttonLabel: s.buttonLabel ?? fallbackSlide.buttonLabel,
            buttonLink: s.buttonLink ?? fallbackSlide.buttonLink,
            secondaryLabel: s.secondaryLabel ?? fallbackSlide.secondaryLabel,
            secondaryLink: s.secondaryLink ?? fallbackSlide.secondaryLink,
          }))
        : [fallbackSlide];
    return {
      enabled: bannerConfig?.enabled !== false,
      announceText: bannerConfig?.announceText ?? DEFAULT_HERO.announceText,
      announceBadge: bannerConfig?.announceBadge ?? "Festive Drop 2026",
      announceLinkLabel: bannerConfig?.announceLinkLabel ?? "Explore Drops",
      announceLink: bannerConfig?.announceLink ?? "#categories",
      seconds: Math.max(2, Math.min(30, Number(bannerConfig?.seconds) || 6)),
      trendingPill: bannerConfig?.trendingPill ?? {},
      slides,
    };
  }, [bannerConfig, heroImage]);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalCount = cart.reduce((s, i) => s + i.qty, 0);
  const dealHasSale = Boolean(
    featuredDeal?.salePrice && Number(featuredDeal.salePrice) < Number(featuredDeal?.price)
  );
  const flashDealCfg = homeConfig?.flashDeal ?? {};
  const hours = String(Math.floor(countdown / 3600)).padStart(2, "0");
  const mins = String(Math.floor((countdown % 3600) / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");

  function add(p: Product, variation?: Variation) {
    if (p.productType === "VARIABLE" && !variation) {
      window.location.href = "/products/" + p.slug;
      return;
    }
    const price = variation
      ? Number(variation.salePrice && variation.salePrice < variation.price ? variation.salePrice : variation.price)
      : Number(p.salePrice ?? p.price);
    const cartId = variation ? `${p.id}__${variation.id}` : p.id;
    const displayName = variation ? `${p.name} (${variation.name})` : p.name;
    const sku = variation?.sku ?? undefined;
    const variationId = variation?.id ?? undefined;
    setCart((old) =>
      old.some((i) => i.id === cartId)
        ? old.map((i) => (i.id === cartId ? { ...i, qty: i.qty + 1 } : i))
        : [
            ...old,
            {
              id: cartId,
              slug: p.slug,
              name: displayName,
              images: variation?.image ? [variation.image, ...p.images.filter((i) => i !== variation.image)] : p.images,
              price,
              categoryId: p.category.slug,
              qty: 1,
              variationId,
              sku,
            },
          ]
    );
    setOpen(true);
  }

  function buyNow(p: Product, variation?: Variation) {
    if (p.productType === "VARIABLE" && !variation) {
      window.location.href = "/products/" + p.slug;
      return;
    }
    const price = variation
      ? Number(variation.salePrice && variation.salePrice < variation.price ? variation.salePrice : variation.price)
      : Number(p.salePrice ?? p.price);
    const cartId = variation ? `${p.id}__${variation.id}` : p.id;
    const displayName = variation ? `${p.name} (${variation.name})` : p.name;
    const sku = variation?.sku ?? undefined;
    const variationId = variation?.id ?? undefined;
    const old = JSON.parse(localStorage.getItem("epic-cart") ?? "[]") as Array<{ id: string; qty: number }>;
    const hit = old.find((i) => i.id === cartId);
    localStorage.setItem(
      "epic-cart",
      JSON.stringify(
        hit
          ? old.map((i) => (i.id === cartId ? { ...i, qty: i.qty + 1 } : i))
          : [
              ...old,
              {
                id: cartId,
                slug: p.slug,
                name: displayName,
                images: variation?.image ? [variation.image, ...p.images.filter((i) => i !== variation.image)] : p.images,
                price,
                categoryId: p.category.slug,
                qty: 1,
                variationId,
                sku,
              },
            ]
      )
    );
    setCart((old2) =>
      old2.some((i) => i.id === cartId)
        ? old2.map((i) => (i.id === cartId ? { ...i, qty: i.qty + 1 } : i))
        : [
            ...old2,
            {
              id: cartId,
              slug: p.slug,
              name: displayName,
              images: variation?.image ? [variation.image, ...p.images.filter((i) => i !== variation.image)] : p.images,
              price,
              categoryId: p.category.slug,
              qty: 1,
              variationId,
              sku,
            },
          ]
    );
    window.location.href = "/checkout";
  }

  function updateQty(id: string, delta: number) {
    setCart((old) =>
      old
        .map((i) => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null)
    );
  }

  function toggleWishlist(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("epic-customer-token");
    if (!token) {
      window.location.href = "/account";
      return;
    }
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    fetch(`${apiUrl}/api/wishlist/${id}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    }).catch(() => {});
  }

  const whatsappUrl = chatConfig?.whatsapp?.number
    ? `https://wa.me/${waNumber(chatConfig.whatsapp.number)}?text=${encodeURIComponent(chatConfig.whatsapp.template ?? "Hello, I have an inquiry about your store.")}`
    : null;

  return (
    <main>
      {/* Top Announcement Bar */}
      {hero.announceText && (
        <aside className="flex flex-wrap items-center justify-center gap-3 border-b border-slate-200/70 bg-slate-50 px-4 py-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            {hero.announceBadge}
          </span>
          <span className="text-[0.8rem] font-medium text-slate-500">
            {hero.announceText}
          </span>
          <Link
            href={hero.announceLink}
            className="inline-flex items-center gap-1 text-[0.8rem] font-bold text-primary hover:underline"
          >
            {hero.announceLinkLabel} <FiArrowRight size={13} />
          </Link>
        </aside>
      )}

      {/* Site Header */}
      <nav className="site-nav">
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <Link href="/" className="brand">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="mr-2 inline-block h-9 w-9 rounded-xl object-contain" />
          ) : (
            <span className="mr-2 inline-block h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-center font-display text-lg font-black leading-9 text-white shadow-md shadow-indigo-500/30">
              {storeName.charAt(0).toUpperCase()}
            </span>
          )}
          {storeName}
        </Link>

        <div className="nav-links">
          <Link href="/shop" className={`shop-nav-link ${pathname === "/shop" ? "active" : ""}`}>
            <FiShoppingBag size={14} /> Shop
          </Link>
          {navMenus.length > 0
            ? navMenus.map((item) => <NavItem key={item.id} item={item} categories={categories} pathname={pathname} />)
            : categories.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className={pathname === `/categories/${c.slug}` ? "active" : ""}
                >
                  {c.name}
                </Link>
              ))}
        </div>

        <div className="nav-actions">
          <label className="search" htmlFor="search-input">
            <FiSearch />
            <input
              id="search-input"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search store…"
            />
          </label>

          <Link href="/account" className="icon-btn" aria-label="Account">
            <FiUser />
          </Link>

          <button className="bag-button" onClick={() => setOpen(true)}>
            <FiShoppingBag />
            <span>{totalCount}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileNavOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-inner">
            <label className="search mobile-search">
              <FiSearch />
              <input
                aria-label="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search store…"
              />
            </label>

            <Link
              href="/shop"
              className={`mobile-link ${pathname === "/shop" ? "active" : ""}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <FiShoppingBag size={15} /> Shop
            </Link>

            {navMenus.length > 0
              ? navMenus.map((item) => (
                  <MobileNavLink
                    key={item.id}
                    item={item}
                    categories={categories}
                    pathname={pathname}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                ))
              : categories.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className={`mobile-link ${pathname === `/categories/${c.slug}` ? "active" : ""}`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))}

            <Link
              href="/account"
              className="mobile-link mobile-account"
              onClick={() => setMobileNavOpen(false)}
            >
              <FiUser /> My Account
            </Link>
          </div>
        </div>
      )}

      {activeLayout === "catalog" ? (
        <CatalogHome
          products={products}
          categories={categories}
          heroSlides={hero.slides}
          heroSeconds={hero.seconds}
          allowAddToCart={allowAddToCart}
          whatsapp={chatConfig?.whatsapp?.enabled && chatConfig.whatsapp.number ? `https://wa.me/${waNumber(chatConfig.whatsapp.number)}` : null}
          add={add}
          buyNow={buyNow}
          sections={homeConfig?.sections}
          promoBanners={homeConfig?.promoBanners}
          trustBadges={homeConfig?.trustBadges}
        />
      ) : (
        <>
      {/* Hero Banner Carousel */}
      {hero.enabled && hero.slides.length > 0 && (
        <section className="relative border-b border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-[1400px] px-[6vw] py-6 lg:py-10">
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
              <CarouselSlider
                items={hero.slides.map((slide) => (
                  <div key={slide.id} className="relative flex min-h-[320px] items-center sm:min-h-[440px] lg:min-h-[480px]">
                    <Image
                      src={slide.image}
                      alt={slide.title || "Banner"}
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/40" />
                    <div className="relative z-10 w-full max-w-2xl space-y-4 p-5 sm:p-10 lg:p-14">
                      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 backdrop-blur-md">
                        <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
                        <span className="text-xs font-semibold text-primary">
                          {slide.badge}
                        </span>
                      </div>
                      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                        {slide.title} <br />
                        <span className="gradient-text">{slide.accent}</span>
                      </h1>
                      <p className="max-w-md text-[0.95rem] leading-relaxed text-slate-500">
                        {slide.subtitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 max-w-full">
                        <HeroCta label={slide.buttonLabel} link={slide.buttonLink} />
                        <HeroCta label={slide.secondaryLabel} link={slide.secondaryLink} secondary />
                      </div>
                    </div>

                    {hero.trendingPill?.enabled !== false && (
                      <div className="absolute right-3 top-3 z-10 animate-float sm:right-8 sm:top-8">
                        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/60 bg-white/85 px-2.5 py-2 backdrop-blur-md sm:flex-row sm:gap-3 sm:p-3.5 sm:pr-5 sm:px-3.5">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-lg text-white sm:h-11 sm:w-11 sm:text-xl">
                            🔥
                          </div>
                          <div className="max-w-[120px] text-center sm:max-w-none sm:text-left">
                            <strong className="block text-[0.7rem] leading-tight text-slate-900 sm:text-sm">
                              {hero.trendingPill?.topText || "Trending Item"}
                            </strong>
                            <span className="text-[0.65rem] text-slate-400 sm:text-xs">
                              {hero.trendingPill?.bottomText || "Rated 4.9 ★ by customers"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                seconds={hero.seconds}
                auto={hero.slides.length > 1}
                loop={hero.slides.length > 1}
                perView={{ mobile: 1, tablet: 1, desktop: 1 }}
                pagination={hero.slides.length > 1}
                spaceBetween={0}
              />
            </div>
          </div>
        </section>
      )}

      {/* Trust & Value Propositions */}
      <section className="border-b border-slate-100 bg-white py-6">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 px-[6vw] md:grid-cols-4">
          {(homeConfig?.trustBadges && homeConfig.trustBadges.length > 0 ? homeConfig.trustBadges : DEFAULT_TRUST_BADGES)
              .filter((t) => t.enabled !== false)
              .map((t) => {
                const Icon = TRUST_ICONS[t.icon ?? "shield"] ?? FiShield;
                return (
                  <div key={t.title || t.icon} className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-primary">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      <p className="text-xs text-slate-400">{t.subtitle}</p>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Shop by Category */}
      <section id="categories" className="mx-auto max-w-[1400px] px-[6vw] py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="eyebrow">{categoryConfig.eyebrow ?? "SHOP BY CATEGORY"}</span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
              {categoryConfig.title ?? "Curated collections,"}
              <span className="gradient-text"> {categoryConfig.accent ?? "organized for you."}</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-400">
              {categorySections.length} {categoryConfig.countLabel ?? "CATEGORIES"}
            </span>
          </div>
        </div>
                {categoryMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {categorySections.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-cyan/10">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-primary transition-transform group-hover:scale-110">
                      {CATEGORY_ICONS[c.slug.toLowerCase()] ?? <FiShoppingBag size={24} />}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{c.name}</span>
                <span className="mt-0.5 text-xs text-primary">
                  {c.items.length} ITEMS
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <CarouselSlider
            key={`cat-${categoryMode}`}
            ariaLabel="Shop by category"
            items={categorySections.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group flex h-full flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-cyan/10">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-primary transition-transform group-hover:scale-110">
                      {CATEGORY_ICONS[c.slug.toLowerCase()] ?? <FiShoppingBag size={24} />}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{c.name}</span>
                <span className="mt-0.5 text-xs text-primary">
                  {c.items.length} ITEMS
                </span>
              </Link>
            ))}
            seconds={categoryConfig.seconds ?? 3}
            auto={categoryMode === "loop" ? true : (categoryConfig.auto ?? false)}
            perView={categoryConfig.perView ?? { mobile: 1, tablet: 2, desktop: 4 }}
            pagination={categoryConfig.pagination ?? false}
            loop={categoryMode === "loop" ? true : (categoryConfig.loop ?? false)}
          />
        )}
      </section>

      {/* Category Sections (carousel / grid / responsive — configurable) */}
      {homeSections.map((s) => {
        const cards = s.items.map((p) => (
          <MiniProductCard
            key={p.id}
            p={p}
            fill
            onAdd={() => add(p)}
            buyNow={() => buyNow(p)}
            allowAddToCart={allowAddToCart}
            wishlisted={wishlist.includes(p.id)}
            onWishlist={toggleWishlist}
          />
        ));
        const carousel = (
          <CarouselSlider
            key={`${s.id}-c`}
            ariaLabel={`${s.name} products`}
            items={cards}
            seconds={s.seconds}
            auto={s.auto}
            perView={s.perView}
            pagination={s.pagination}
            loop={s.loop}
          />
        );
        return (
          <section key={s.id} className="border-y border-slate-100">
            <div className="mx-auto max-w-[1400px] px-[6vw] py-10">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <FiShoppingBag size={12} />
                      {s.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-400">
                      {s.items.length} ITEMS
                    </span>
                  </div>
                  <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                    {s.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {s.items.length} products in this collection — tap to explore.
                  </p>
                </div>

                {s.showViewAll && s.slug && (
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/categories/${s.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                    >
                      View All <FiChevronRight />
                    </Link>
                  </div>
                )}
              </div>

              {s.mode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{cards}</div>
              ) : s.mode === "responsive" ? (
                <>
                  <div className="grid grid-cols-2 gap-4 md:hidden">{cards}</div>
                  <div className="hidden md:block">{carousel}</div>
                </>
              ) : (
                carousel
              )}
            </div>
          </section>
        );
      })}

      {/* Flash Deal Banner */}
      {featuredDeal && homeConfig?.flashDeal?.enabled !== false && (
        <section className="relative overflow-hidden bg-white py-12">
          <div className="mx-auto max-w-[1400px] px-[6vw]">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8 shadow-inner lg:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-primary/15 to-cyan/15 blur-3xl"
              />
              <div className="relative grid items-center gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    {flashDealCfg.badge ?? "Limited Time Offer"}
                  </span>
                  <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">
                    {flashDealCfg.titlePrefix ?? "Daily drop:"} <span className="gradient-text">{featuredDeal.name}</span>
                  </h2>
                  <p className="max-w-lg text-[0.95rem] leading-relaxed text-slate-500">
                    {flashDealCfg.description ?? "One standout piece at a standout price, refreshed every day. Valid till midnight."}
                  </p>
                  {flashDealCfg.showCountdown !== false && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-1 sm:gap-3">
                    {[
                      { v: hours, l: "Hours" },
                      { v: mins, l: "Mins" },
                      { v: secs, l: "Secs" },
                    ].map((t, i) => (
                      <div key={t.l} className="flex items-center gap-2 sm:gap-3">
                        <div className="grid min-w-[52px] place-items-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm sm:min-w-[64px] sm:px-3 sm:py-2">
                          <span className="font-mono text-lg font-bold text-primary sm:text-2xl">{t.v}</span>
                          <span className="text-xs uppercase tracking-wider text-slate-400 sm:text-[0.75rem]">
                            {t.l}
                          </span>
                        </div>
                        {i < 2 && <span className="font-mono text-lg font-bold text-slate-300 sm:text-2xl">:</span>}
                      </div>
                    ))}
                  </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {dealHasSale ? money(featuredDeal.salePrice!) : money(featuredDeal.price)}
                      </span>
                      {dealHasSale && (
                        <span className="text-sm text-slate-400 line-through">
                          {money(featuredDeal.price)}
                        </span>
                      )}
                    </div>
                    <Button
                      color="primary"
                      radius="full"
                      size="lg"
                      className="font-bold shadow-lg shadow-indigo-500/30"
                      onPress={() => add(featuredDeal)}
                    >
                      <FiShoppingBag /> {flashDealCfg.buttonLabel ?? "Claim Deal"}
                    </Button>
                  </div>
                </div>
                <div className="relative lg:col-span-5">
                  <Link href={`/products/${featuredDeal.slug}`} className="group relative block">
                    <div className="overflow-hidden rounded-2xl border border-white/70 shadow-xl shadow-indigo-500/10">
                      <div className="relative aspect-video">
                        <Image
                          src={featuredDeal.images[0] || FALLBACK_IMG}
                          alt={featuredDeal.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute bottom-3 left-3 rounded-full border border-white/60 bg-white/85 px-3 py-1 text-xs font-bold text-slate-700 backdrop-blur-md">
                        Save {dealHasSale ? Math.round((1 - Number(featuredDeal.salePrice) / Number(featuredDeal.price)) * 100) : 0}% today
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      {(() => {
        const cfg = homeConfig?.testimonials ?? {};
        const items = cfg.items && cfg.items.length > 0 ? cfg.items : DEFAULT_TESTIMONIALS;
        if (cfg.enabled === false || !items.length) return null;
        return (
          <section className="border-t border-slate-100 bg-slate-50 py-16">
            <div className="mx-auto max-w-[1400px] px-[6vw]">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <span className="eyebrow justify-center">{cfg.eyebrow ?? "CUSTOMER CHRONICLES"}</span>
                <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">
                  {cfg.title ?? "Loved by"} <span className="gradient-text">{cfg.accent ?? "thousands."}</span>
                </h2>
                <p className="muted mt-2">
                  {cfg.subtitle ?? "Real stories from customers across Bangladesh and beyond."}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {items.map((r) => (
                  <div
                    key={r.name || r.quote}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-center gap-1 text-amber-400">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <FiStar key={i} fill="currentColor" />
                      ))}
                    </div>
                    <p className="mb-6 text-[0.95rem] italic leading-relaxed text-slate-600">
                      “{r.quote}”
                    </p>
                    <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                      {r.image ? (
                        <img src={r.image} alt={r.name ?? "customer"} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan font-mono text-xs font-bold text-white">
                          {r.init || r.name?.slice(0, 2).toUpperCase() || "A"}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{r.name}</h4>
                        <p className="text-xs text-slate-400">{r.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Newsletter */}
      {(() => {
        const cfg = homeConfig?.newsletter ?? {};
        if (cfg.enabled === false) return null;
        return (
          <section className="border-t border-slate-100 bg-white py-16">
            <div className="mx-auto max-w-2xl space-y-5 px-[6vw] text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <FiCheckCircle size={13} /> {cfg.badge ?? "Exclusive drops"}
              </span>
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900">
                {cfg.title ?? "Private sale"} <span className="gradient-text">{cfg.accent ?? "alerts & offers."}</span>
              </h2>
              <p className="muted mx-auto max-w-lg">
                {cfg.subtitle ?? "Early access to limited drops, restocks, and members-only discounts — straight to your inbox."}
              </p>
              <NewsletterForm config={cfg} />
              <p className="text-xs text-slate-500">
                {cfg.note ?? "No spam. One-click unsubscribe anytime."}
              </p>
            </div>
          </section>
        );
      })()}
        </>
      )}

      {/* Footer */}
      {(() => {
        const cfg = homeConfig?.footer ?? {};
        if (cfg.enabled === false) return null;
        const links = cfg.links && cfg.links.length > 0 ? cfg.links : DEFAULT_FOOTER_LINKS;
        return (
          <footer className="border-t border-slate-200 bg-slate-50 pb-16 md:pb-0">
            <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-[6vw] py-8 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-3">
                <Link href="/" className="brand">
                  {storeName}
                </Link>
                <span className="hidden text-slate-300 sm:inline">•</span>
                <p className="text-sm text-slate-400">
                  {cfg.copyright ?? `© ${new Date().getFullYear()} ${storeName}. Everyday premium essentials from Bangladesh.`}
                </p>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-6">
                {links.map((l) => (
                  <Link
                    key={l.label || l.url}
                    href={l.url || "/"}
                    onClick={(e) => {
                      const href = l.url || "/";
                      if (href.startsWith("#")) {
                        e.preventDefault();
                        const id = href.slice(1);
                        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-sm text-slate-400 transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          </footer>
        );
      })()}

      {/* Floating Customer Chat Widget */}
      {chatConfig?.enabled !== false && (chatConfig?.whatsapp?.number || chatConfig?.messenger?.url || chatConfig?.phone) && (
      <div className="chat-widget" style={{ position: "fixed", bottom: bottomNav ? "calc(64px + env(safe-area-inset-bottom, 0px))" : "max(28px, env(safe-area-inset-bottom, 0px))", right: "16px", zIndex: 45 }}>
        {chatOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "70px",
              right: 0,
              width: "min(280px, calc(100vw - 32px))",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <strong style={{ fontSize: "1rem", color: "var(--ink)" }}>Need Help? Chat With Us</strong>
              <button
                onClick={() => setChatOpen(false)}
                style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <FiX />
              </button>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  background: "#25d366",
                  color: "#ffffff",
                  borderRadius: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                <FiMessageCircle style={{ fontSize: "1.2rem" }} /> Chat on WhatsApp
              </a>
            )}

            {chatConfig?.messenger?.url && (
              <a
                href={chatConfig.messenger.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  background: "#0084ff",
                  color: "#ffffff",
                  borderRadius: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                <FiMessageSquare style={{ fontSize: "1.2rem" }} /> Facebook Messenger
              </a>
            )}

            {chatConfig?.phone && (
              <a
                href={`tel:${chatConfig.phone}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  background: "var(--surface-alt)",
                  color: "var(--ink)",
                  borderRadius: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  border: "1px solid var(--border)",
                }}
              >
                <FiPhone style={{ fontSize: "1.2rem" }} /> Call {chatConfig.phone}
              </a>
            )}
          </div>
        )}

        <button
          onClick={() => setChatOpen((v) => !v)}
          aria-label="Customer Support Chat"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            color: "#ffffff",
            border: 0,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 10px 25px rgba(79, 70, 229, 0.4)",
            fontSize: "1.5rem",
          }}
        >
          {chatOpen ? <FiX /> : <FiMessageCircle />}
        </button>
      </div>
      )}

      {/* Cart Slide-over Panel */}
      {open && (
        <>
          <div className="backdrop" onClick={() => setOpen(false)} />
          <aside className="cart-panel">
            <div className="cart-header">
              <h2>
                <FiShoppingBag /> Your Bag ({totalCount})
              </h2>
              <button onClick={() => setOpen(false)}>
                <FiX />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: "center", margin: "auto 0", padding: "40px 0" }}>
                <FiShoppingBag style={{ fontSize: "3rem", color: "#cbd5e1", marginBottom: "16px" }} />
                <h4 style={{ margin: "0 0 8px" }}>Your bag is empty</h4>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Explore our collection and add your favorite items.
                </p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((i) => (
                    <div className="cart-item" key={i.id}>
                      <Image
                        src={i.images[0] || FALLBACK_IMG}
                        alt={i.name}
                        width={65}
                        height={75}
                      />
                      <div className="cart-item-details">
                        <strong>{i.name}</strong>
                        <div className="price">{money(i.price)}</div>

                        <div className="qty-control">
                          <button onClick={() => updateQty(i.id, -1)}>
                            <FiMinus />
                          </button>
                          <span>{i.qty}</span>
                          <button onClick={() => updateQty(i.id, 1)}>
                            <FiPlus />
                          </button>
                        </div>
                      </div>

                      <button
                        style={{ border: 0, background: "none", color: "#ef4444", cursor: "pointer", padding: "8px" }}
                        onClick={() => setCart((old) => old.filter((x) => x.id !== i.id))}
                        aria-label="Remove item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                    Taxes and shipping calculated at checkout.
                  </p>

                  <Link href="/checkout" style={{ textDecoration: "none" }}>
                    <Button color="primary" fullWidth size="lg" className="font-bold shadow-lg">
                      Proceed to Checkout <FiArrowRight className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </main>
  );
}

function resolveCategoryHref(item: MenuItem, categories: Category[]): string {
  if (item.type === "custom") return item.href ?? "#";
  const cat = categories.find((c) => c.id === item.categoryId);
  return cat ? `/categories/${cat.slug}` : "#";
}

function NavItem({ item, categories, pathname }: { item: MenuItem; categories: Category[]; pathname: string }) {
  const hasKids = (item.children?.length ?? 0) > 0;
  const href = resolveCategoryHref(item, categories);
  const labelNode = (
    <>
      {item.label}
      {hasKids && <span className="nav-caret">▾</span>}
    </>
  );
  const cls = pathname === href ? "active" : "";
  if (!hasKids) {
    return (
      <Link href={href} className={cls}>
        {item.label}
      </Link>
    );
  }
  return (
    <div className="nav-dd">
      <Link href={href} className={cls}>
        {labelNode}
      </Link>
      <div className="nav-dd-panel">
        {item.children!.map((sub) => (
          <NavSub key={sub.id} item={sub} categories={categories} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

function NavSub({ item, categories, pathname }: { item: MenuItem; categories: Category[]; pathname: string }) {
  const hasKids = (item.children?.length ?? 0) > 0;
  const href = resolveCategoryHref(item, categories);
  const link = (
    <Link href={href} className={pathname === href ? "active" : ""}>
      {item.label}
    </Link>
  );
  if (!hasKids) {
    return <div className="nav-dd-row">{link}</div>;
  }
  return (
    <div className="nav-dd-row">
      {link}
      <div className="nav-dd-sub">
        {item.children!.map((leaf) => (
          <NavSub key={leaf.id} item={leaf} categories={categories} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

function MobileNavLink({ item, categories, pathname, onNavigate }: { item: MenuItem; categories: Category[]; pathname: string; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasKids = (item.children?.length ?? 0) > 0;
  const href = resolveCategoryHref(item, categories);
  const cls = pathname === href ? "active" : "";
  const link = (
    <Link href={href} className={`mobile-link ${cls}`} onClick={onNavigate}>
      {item.label}
    </Link>
  );
  if (!hasKids) return link;
  return (
    <div className={`mobile-acc ${expanded ? "open" : ""}`}>
      <div className="mobile-acc-row">
        {link}
        <button
          type="button"
          aria-label={`Toggle ${item.label}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((o) => !o);
          }}
          className="mobile-acc-icon"
        >
          <FiChevronDown />
        </button>
      </div>
      {expanded && (
        <div className="mobile-sub">
          {item.children!.map((sub) => (
            <MobileNavLink key={sub.id} item={sub} categories={categories} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MiniProductCard({
  p,
  onAdd,
  buyNow,
  allowAddToCart,
  wishlisted,
  onWishlist,
  fill,
}: {
  p: Product;
  onAdd: () => void;
  buyNow: () => void;
  allowAddToCart: boolean;
  wishlisted: boolean;
  onWishlist: (id: string, e: React.MouseEvent) => void;
  fill?: boolean;
}) {
  const hasSale = Boolean(p.salePrice && Number(p.salePrice) < Number(p.price));
  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md ${
        fill ? "w-full h-full" : "min-w-[240px] max-w-[260px] snap-start sm:min-w-[270px]"
      }`}
    >
      <Link href={`/products/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-slate-100">
        <Image
          src={p.images[0] || FALLBACK_IMG}
          alt={p.name}
          fill
          sizes="(max-width: 650px) 55vw, 280px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hasSale && (
          <span className="absolute left-3 top-3 rounded-full border border-rose-500/30 bg-rose-500/90 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-md">
            SALE
          </span>
        )}
        <button
          onClick={(e) => onWishlist(p.id, e)}
          aria-label="Wishlist"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-white/85 text-slate-500 backdrop-blur-md transition-all hover:text-rose-500"
          style={{ color: wishlisted ? "#ef4444" : "inherit" }}
        >
          <FiHeart size={16} fill={wishlisted ? "#ef4444" : "none"} />
        </button>
      </Link>

      <div className="space-y-1.5 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-bold text-primary">
            {money(p.salePrice ?? p.price)}
          </span>
          {hasSale && (
            <span className="text-sm text-slate-400 line-through">{money(p.price)}</span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-primary">
          {p.name}
        </h3>
        {p.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{p.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 max-sm:flex-col max-sm:items-start">
          <span className="text-xs font-medium text-slate-500">
            {p.category.name}
          </span>
          <button
            onClick={allowAddToCart ? onAdd : buyNow}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98] max-sm:w-full max-sm:justify-center ${
              allowAddToCart
                ? "bg-slate-100 text-slate-700 hover:bg-gradient-to-r hover:from-primary hover:to-indigo-600 hover:text-white"
                : "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm hover:shadow-md"
            }`}
          >
            {allowAddToCart ? (
              <>
                <FiShoppingBag size={13} /> Quick Add
              </>
            ) : (
              <>
                <FiZap size={13} /> Order Now
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function NewsletterForm({ config }: { config: NonNullable<HomePageConfig["newsletter"]> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setEmail("");
      toast.success("ধন্যবাদ! VIP তালিকায় আপনার ইমেইল যুক্ত হয়েছে।");
    } catch {
      setStatus("error");
      toast.error("সাবস্ক্রিপশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    }
  }
  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 sm:flex-row"
    >
      <div className="relative w-full">
        <FiSend className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={config.placeholder ?? "আপনার ইমেইল দিন (Enter your email)..."}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
      >
        {config.button ?? "Subscribe"} <FiArrowRight size={16} />
      </button>
    </form>
  );
}