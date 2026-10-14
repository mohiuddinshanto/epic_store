"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getStoreStatus } from "../lib/store-status";
import { waNumber } from "../lib/wa";

export type FooterSocial = {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  whatsapp?: string;
  phone?: string;
};

export type FooterContact = {
  address?: string;
  phone?: string;
  email?: string;
};

export type FooterConfig = {
  enabled?: boolean;
  brand?: string;
  logo?: string | null;
  slogan?: string;
  social?: FooterSocial;
  showCategories?: boolean;
  categoryTitle?: string;
  categoryLimit?: number;
  categories?: { label?: string; url?: string }[];
  contactTitle?: string;
  contact?: FooterContact;
  copyright?: string;
  links?: { label?: string; url?: string }[];
};

type FooterCategory = { name: string; slug: string; parentId?: string | null };

type Props = {
  config?: FooterConfig;
  storeName: string;
  storeLogo?: string | null;
  whatsappUrl?: string | null;
  phone?: string | null;
  categories: FooterCategory[];
};

const FOOTER_CSS = `
.ft{--bg:#0b1627;--bg2:#10213a;--card:rgba(255,255,255,.05);--line:rgba(255,255,255,.09);--text:#eef2f8;--muted:#a3b3ca;--accent:#f5b942;--accent2:#ff8a3d;
  position:relative;overflow:hidden;color:var(--text);font-family:"Hind Siliguri",system-ui,-apple-system,"Segoe UI",sans-serif;
  background:radial-gradient(900px 300px at 85% -10%,rgba(245,185,66,.14),transparent 70%),linear-gradient(180deg,var(--bg2),var(--bg));padding:72px 24px 0}
.ft::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent))}
.ft *{box-sizing:border-box;margin:0;padding:0}
.ft a{color:inherit;text-decoration:none}
.ft-wrap{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1.1fr;gap:56px}
.ft-wrap.two{grid-template-columns:1.6fr 1fr}
.ft-wrap.one{grid-template-columns:1fr;justify-items:center;text-align:center}
.ft-logo{display:inline-flex;align-items:center;gap:14px;font-size:26px;font-weight:700;letter-spacing:.3px}
.ft-logo img{width:56px;height:56px;border-radius:16px;object-fit:cover;background:var(--card);border:1px solid var(--line);padding:4px}
.ft-logo .ft-badge{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#111;font-size:26px;font-weight:800}
.ft-slogan{margin:18px 0 28px;color:var(--muted);line-height:1.8;font-size:15.5px;max-width:360px}
.ft-social{display:flex;gap:12px;flex-wrap:wrap}
.ft-social a{width:46px;height:46px;border-radius:14px;background:var(--card);border:1px solid var(--line);display:grid;place-items:center;transition:transform .25s,background .25s,border-color .25s,box-shadow .25s}
.ft-social svg{width:21px;height:21px;fill:currentColor}
.ft-social a:hover{transform:translateY(-4px);color:#fff;border-color:transparent;box-shadow:0 10px 22px rgba(0,0,0,.35)}
.ft-social .fb:hover{background:#1877f2}
.ft-social .yt:hover{background:#ff0000}
.ft-social .ig:hover{background:linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)}
.ft-social .wa:hover{background:#25d366}
.ft-social .ph:hover{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#111}
.ft h4{font-size:18px;font-weight:700;margin-bottom:24px;position:relative;padding-bottom:12px}
.ft h4::after{content:"";position:absolute;left:0;bottom:0;width:38px;height:3px;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.ft-cats{list-style:none;display:grid;grid-template-columns:1fr;gap:6px}
.ft-cats a{display:inline-flex;align-items:center;gap:10px;padding:8px 0;color:var(--muted);transition:color .2s,transform .2s}
.ft-cats a::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent);opacity:.45;transition:opacity .2s,transform .2s}
.ft-cats a:hover{color:var(--text);transform:translateX(4px)}
.ft-cats a:hover::before{opacity:1;transform:scale(1.3)}
.ft-info{list-style:none;display:grid;gap:16px}
.ft-info li{display:flex;align-items:center;gap:14px;color:var(--muted);line-height:1.5}
.ft-info i{flex:none;width:40px;height:40px;border-radius:12px;background:var(--card);border:1px solid var(--line);display:grid;place-items:center;color:var(--accent)}
.ft-info svg{width:18px;height:18px;fill:currentColor}
.ft-info a{color:var(--text);font-weight:600}
.ft-info a:hover{color:var(--accent)}
.ft-bottom{max-width:1160px;margin:56px auto 0;padding:22px 0;border-top:1px solid var(--line);text-align:center;color:var(--muted);font-size:14px}
.ft-bottom .ft-flinks{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;margin-bottom:10px}
.ft-bottom .ft-flinks a{transition:color .2s}
.ft-bottom .ft-flinks a:hover{color:var(--text)}
@media(max-width:900px){.ft-wrap{grid-template-columns:1fr 1fr;gap:44px}.ft-brand{grid-column:1/-1}}
@media(max-width:600px){
  .ft{padding-top:56px;text-align:center}
  .ft-wrap{grid-template-columns:1fr;gap:44px;justify-items:center}
  .ft-brand{display:flex;flex-direction:column;align-items:center}
  .ft-slogan{margin-left:auto;margin-right:auto}
  .ft-social{justify-content:center}
  .ft h4::after{left:50%;transform:translateX(-50%)}
  .ft-cats{justify-items:center}
  .ft-cats a:hover{transform:none}
  .ft-info{justify-items:center}
  .ft-info li{flex-direction:column;gap:8px;text-align:center}
  .ft-bottom{margin-top:44px}
}
`;

const IconFacebook = (
  <svg viewBox="0 0 24 24"><path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22h3.4z" /></svg>
);
const IconYoutube = (
  <svg viewBox="0 0 24 24"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3-5.2 3z" /></svg>
);
const IconInstagram = (
  <svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.3-.6.7-.8 1.2-.2.4-.3 1-.4 2.1C2.7 9.8 2.7 10.2 2.7 12s0 3.1.1 4.3c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.3.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.3.6-.7.8-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.3s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.3-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z" /></svg>
);
const IconWhatsapp = (
  <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.4.1.1.1.8-.1 1.5z" /></svg>
);
const IconPhone = (
  <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" /></svg>
);
const IconPin = (
  <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
);
const IconMail = (
  <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.2-8 5-8-5V6l8 5 8-5v2.2z" /></svg>
);

export function StoreFooter({ config, storeName, storeLogo, whatsappUrl, phone, categories }: Props) {
  const cfg = config ?? {};
  if (cfg.enabled === false) return null;

  const brand = cfg.brand?.trim() || storeName || "Store";
  const logo = (cfg.logo?.trim() || storeLogo || "").trim();
  const slogan = cfg.slogan?.trim();
  const social = cfg.social ?? {};
  const contact = cfg.contact ?? {};

  const socialEntries: { key: string; href: string; label: string; cls: string; icon: ReactNode }[] = [];
  if (social.facebook?.trim()) socialEntries.push({ key: "fb", href: social.facebook.trim(), label: "Facebook", cls: "fb", icon: IconFacebook });
  if (social.youtube?.trim()) socialEntries.push({ key: "yt", href: social.youtube.trim(), label: "YouTube", cls: "yt", icon: IconYoutube });
  if (social.instagram?.trim()) socialEntries.push({ key: "ig", href: social.instagram.trim(), label: "Instagram", cls: "ig", icon: IconInstagram });
  const waHref = social.whatsapp?.trim() || whatsappUrl || "";
  if (waHref) socialEntries.push({ key: "wa", href: waHref, label: "WhatsApp", cls: "wa", icon: IconWhatsapp });
  const tel = social.phone?.trim() || contact.phone?.trim() || phone?.trim() || "";
  if (tel) socialEntries.push({ key: "ph", href: tel.startsWith("tel:") ? tel : `tel:${tel}`, label: "Phone", cls: "ph", icon: IconPhone });

  const showCategories = cfg.showCategories !== false;
  const limit = Math.min(20, Math.max(1, Number(cfg.categoryLimit) || 6));
  const manualCats = (cfg.categories ?? []).filter((c) => c.label?.trim() || c.url?.trim());
  const autoCats = categories
    .filter((c) => !c.parentId)
    .slice(0, limit)
    .map((c) => ({ label: c.name, url: `/categories/${c.slug}` }));
  const catItems = manualCats.length ? manualCats : autoCats;

  const contactLines = [contact.address?.trim(), contact.phone?.trim(), contact.email?.trim()].filter(Boolean) as string[];
  const showContact = contactLines.length > 0;

  const links = (cfg.links ?? []).filter((l) => l.label?.trim());
  const copyright = cfg.copyright?.trim() || `© ${new Date().getFullYear()} ${brand}. All rights reserved.`;

  const colCount = (showCategories ? 1 : 0) + (showContact ? 1 : 0);
  const wrapClass = `ft-wrap${colCount === 2 ? " two" : colCount === 1 ? " one" : ""}`;

  const isExternal = (u: string) => /^(https?:)?\/\//.test(u) || u.startsWith("mailto:") || u.startsWith("tel:");

  return (
    <footer className="ft">
      <style dangerouslySetInnerHTML={{ __html: FOOTER_CSS }} />
      <div className={wrapClass}>
        <div className="ft-brand">
          <Link href="/" className="ft-logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={brand} />
            ) : (
              <span className="ft-badge">{brand.charAt(0).toUpperCase()}</span>
            )}
            <span>{brand}</span>
          </Link>
          {slogan && <p className="ft-slogan">{slogan}</p>}
          {socialEntries.length > 0 && (
            <div className="ft-social">
              {socialEntries.map((s) => (
                <a key={s.key} className={s.cls} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        {showCategories && catItems.length > 0 && (
          <div>
            <h4>{cfg.categoryTitle?.trim() || "ক্যাটাগরি"}</h4>
            <ul className="ft-cats">
              {catItems.map((c, i) => (
                <li key={`${c.label}-${i}`}>
                  {isExternal(c.url || "#") ? (
                    <a href={c.url || "#"}>{c.label}</a>
                  ) : (
                    <Link href={c.url || "/shop"}>{c.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showContact && (
          <div>
            <h4>{cfg.contactTitle?.trim() || "যোগাযোগ"}</h4>
            <ul className="ft-info">
              {contact.address?.trim() && (
                <li>
                  <i>{IconPin}</i>
                  <span>{contact.address.trim()}</span>
                </li>
              )}
              {contact.phone?.trim() && (
                <li>
                  <i>{IconPhone}</i>
                  <a href={`tel:${contact.phone.trim()}`}>{contact.phone.trim()}</a>
                </li>
              )}
              {contact.email?.trim() && (
                <li>
                  <i>{IconMail}</i>
                  <a href={`mailto:${contact.email.trim()}`}>{contact.email.trim()}</a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="ft-bottom">
        {links.length > 0 && (
          <div className="ft-flinks">
            {links.map((l, i) =>
              isExternal(l.url || "") ? (
                <a key={i} href={l.url || "#"}>{l.label}</a>
              ) : (
                <Link key={i} href={l.url || "/"}>{l.label}</Link>
              ),
            )}
          </div>
        )}
        {copyright}
      </div>
    </footer>
  );
}

/**
 * Self-loading footer for pages that do not already bootstrap the store config
 * (shop, category, product). Pass `initialStatus`/`initialCategories` from the
 * server for an SSR-rendered footer; otherwise it loads them client-side using
 * the shared, de-duplicated store status loader.
 */
export function SiteFooter({
  initialStatus,
  initialCategories,
}: {
  initialStatus?: { config?: Record<string, any> | null } | null;
  initialCategories?: FooterCategory[] | null;
} = {}) {
  const [config, setConfig] = useState<Record<string, any> | null>(
    (initialStatus?.config as Record<string, any> | null) ?? null,
  );
  const [categories, setCategories] = useState<FooterCategory[]>(initialCategories ?? []);

  useEffect(() => {
    let alive = true;
    if (!initialStatus) {
      getStoreStatus()
        .then((s) => {
          if (alive) setConfig((s.config as Record<string, any> | null) ?? null);
        })
        .catch(() => {});
    }
    if (!initialCategories) {
      fetch("/api/categories")
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => {
          if (alive && Array.isArray(list)) setCategories(list);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [initialStatus, initialCategories]);

  if (!config) return null;

  const chat = (config.chatConfig ?? {}) as {
    whatsapp?: { enabled?: boolean; number?: string };
    phone?: string;
  };
  const whatsappUrl =
    chat.whatsapp?.enabled && chat.whatsapp.number
      ? `https://wa.me/${waNumber(chat.whatsapp.number)}`
      : null;

  return (
    <StoreFooter
      config={config.homePageConfig?.footer}
      storeName={config.storeName ?? ""}
      storeLogo={config.logoUrl ?? null}
      whatsappUrl={whatsappUrl}
      phone={chat.phone ?? null}
      categories={categories}
    />
  );
}
