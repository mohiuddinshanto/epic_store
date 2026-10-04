"use client";

import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiTag,
  FiUser,
} from "react-icons/fi";

const apiUrl = "";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  categoryId: string;
  images?: string[];
  variationId?: string;
  sku?: string;
};

type Method = { id: string; label: string };

type CheckoutField = { enabled: boolean; required: boolean; label: string; placeholder: string };
type CheckoutForm = Record<string, CheckoutField>;

const DEFAULT_CHECKOUT_FORM: CheckoutForm = {
  name: { enabled: true, required: true, label: "Full name", placeholder: "Rahim Ahmed" },
  phone: { enabled: true, required: true, label: "Mobile number", placeholder: "01712345678" },
  email: { enabled: true, required: false, label: "Email address (optional)", placeholder: "you@example.com" },
  address: { enabled: true, required: true, label: "Delivery address", placeholder: "House 12, Road 5, Block B" },
  district: { enabled: true, required: true, label: "District", placeholder: "Dhaka" },
  division: { enabled: true, required: true, label: "Division", placeholder: "Dhaka" },
};

const FIELD_META: Record<string, { icon?: ReactNode; full?: boolean }> = {
  name: { icon: <FiUser className="text-gray-400" /> },
  phone: { icon: <FiPhone className="text-gray-400" /> },
  email: { icon: <FiMail className="text-gray-400" /> },
  address: { icon: <FiMapPin className="text-gray-400" />, full: true },
  district: {},
  division: {},
};

const money = (value: number) => "৳ " + value.toLocaleString("en-BD");

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("COD");
  const [saving, setSaving] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(DEFAULT_CHECKOUT_FORM);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal ? 80 : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shipping);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("epic-cart") ?? "[]");
      setCart(stored);
    } catch {}

    fetch(apiUrl + "/api/store/checkout-options")
      .then((response) => response.json())
      .then((data) => {
        const fetchedMethods = data.methods ?? [];
        if (fetchedMethods.length) {
          setMethods(fetchedMethods);
          setSelectedMethod(fetchedMethods[0].id);
        } else {
          setMethods([{ id: "COD", label: "Cash on delivery" }]);
        }
        const savedForm = data.form ?? {};
        const mergedForm = Object.fromEntries(
          Object.keys(DEFAULT_CHECKOUT_FORM).map((key) => [
            key,
            { ...DEFAULT_CHECKOUT_FORM[key], ...(savedForm[key] ?? {}) },
          ]),
        );
        if (Object.keys(mergedForm).length) setForm(mergedForm);
      })
      .catch(() => {
        setMethods([{ id: "COD", label: "Cash on delivery" }]);
      });
  }, []);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const categoryIds = cart.map((i) => i.categoryId);
      const res = await fetch(apiUrl + "/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal, categoryIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid coupon");

      setDiscountAmount(data.discount);
      setCouponId(data.id);
      toast.success(`কুপন প্রয়োগ করা হয়েছে! ৳ ${data.discount} ছাড় পেয়েছেন।`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Coupon invalid");
      setDiscountAmount(0);
      setCouponId(null);
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your bag is empty");
      return;
    }
    const enabledFields = Object.entries(form).filter(([, field]) => field.enabled);
    if (!enabledFields.length) {
      toast.error("Checkout form is not loaded. Please refresh and try again.");
      return;
    }

    setSaving(true);
    const fd = new FormData(event.currentTarget);

    try {
      const response = await fetch(apiUrl + "/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("epic-customer-token")
            ? { Authorization: "Bearer " + localStorage.getItem("epic-customer-token") }
            : {}),
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          subtotal,
          shippingCharge: shipping,
          discountAmount: discountAmount || undefined,
          couponId: couponId || undefined,
          totalAmount,
          shippingDetails: Object.fromEntries(
            enabledFields
              .map(([key]) => [key, fd.get(key)]),
          ),
          orderItems: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
            categoryId: item.categoryId,
            variationId: item.variationId,
            sku: item.sku,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? data.error ?? "Order creation failed");

      localStorage.removeItem("epic-cart");
      setCart([]);
      sessionStorage.setItem("epic-last-order", JSON.stringify(data));
      toast.success("অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!");
      window.location.href = "/order-success";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "অর্ডার করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="checkout-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" className="brand">
          EPIC<span>.</span>
        </Link>
        <Link href="/" className="back-link" style={{ margin: 0 }}>
          <FiArrowLeft /> Return to Store
        </Link>
      </div>

      <div className="checkout-grid">
        {/* Left Column: Shipping & Payment Form */}
        <div className="checkout-card">
          <span className="eyebrow">
            <FiLock /> SECURE CHECKOUT
          </span>
          <h2>Shipping & Payment Details</h2>

          <form onSubmit={submit} style={{ display: "grid", gap: "24px" }}>
            <div className="form-grid">
              {Object.entries(form)
                .filter(([, field]) => field.enabled)
                .map(([key, field]) => (
                  <Input
                    key={key}
                    className={FIELD_META[key]?.full ? "full" : undefined}
                    {...(key === "email" ? { type: "email" } : {})}
                    name={key}
                    label={field.label}
                    placeholder={field.placeholder}
                    isRequired={Boolean(field.required)}
                    startContent={FIELD_META[key]?.icon}
                  />
                ))}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px" }}>
                Select Payment Method
              </label>
              <div className="payment-methods-grid">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className={`payment-card ${selectedMethod === method.id ? "selected" : ""}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <FiCreditCard />
                    <span>{method.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              color="primary"
              size="lg"
              fullWidth
              isLoading={saving}
              isDisabled={!cart.length}
              className="font-bold shadow-lg mt-4"
            >
              Place Order — {money(totalAmount)}
            </Button>
          </form>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <aside className="order-summary">
          <h2>Order Summary</h2>

          {cart.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Your bag is empty.</p>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.92rem",
                  }}
                >
                  <div>
                    <strong style={{ display: "block" }}>{item.name}</strong>
                    <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Qty: {item.qty}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{money(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Coupon Code Field */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <Input
              placeholder="Promo / Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              startContent={<FiTag />}
            />
            <Button
              variant="flat"
              color="primary"
              isLoading={validatingCoupon}
              onPress={applyCoupon}
              isDisabled={!couponCode.trim()}
            >
              Apply
            </Button>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          {discountAmount > 0 && (
            <div className="summary-row" style={{ color: "#059669" }}>
              <span>Discount</span>
              <strong>- {money(discountAmount)}</strong>
            </div>
          )}

          <div className="summary-row">
            <span>Nationwide Delivery</span>
            <strong>{money(shipping)}</strong>
          </div>

          <div className="summary-row total">
            <span>Total Amount</span>
            <strong style={{ color: "var(--primary)" }}>{money(totalAmount)}</strong>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "14px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.8rem",
              color: "var(--muted)",
            }}
          >
            <FiShield style={{ color: "#059669", fontSize: "1.3rem" }} />
            <span>Encrypted checkout. Your personal data is protected.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
