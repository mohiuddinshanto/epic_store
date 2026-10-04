"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiShoppingBag, FiUser } from "react-icons/fi";

const apiUrl = "";

export function SiteHeader() {
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(apiUrl + "/api/store/status")
      .then((r) => r.json())
      .then((data) => {
        setStoreName(data.config?.storeName ?? "");
        setLogoUrl(data.config?.logoUrl ?? "");
      })
      .catch(() => setStoreName(""));
    const syncCart = () => {
      try {
        setCount((JSON.parse(localStorage.getItem("epic-cart") ?? "[]") as unknown[]).length);
      } catch {
        setCount(0);
      }
    };
    syncCart();
  }, []);

  return (
    <nav className="site-nav">
      <Link href="/" className="brand">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName} className="mr-2 inline-block h-9 w-9 rounded-xl object-contain" />
        ) : (
          <span className="mr-2 inline-block h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-center font-display text-lg font-black leading-9 text-white shadow-md shadow-indigo-500/30">
            {(storeName || "E").charAt(0).toUpperCase()}
          </span>
        )}
        {storeName}
      </Link>

      <div className="nav-links">
        <Link href="/">হোম</Link>
        <Link href="/shop">শপ</Link>
        <Link href="/account">প্রোফাইল</Link>
      </div>

      <div className="nav-actions">
        <Link href="/account" className="icon-btn" aria-label="Account">
          <FiUser />
        </Link>
        <Link href="/checkout" className="bag-button" aria-label="Bag">
          <FiShoppingBag />
          <span>{count}</span>
        </Link>
      </div>
    </nav>
  );
}