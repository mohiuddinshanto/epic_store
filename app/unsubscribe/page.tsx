"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type State = "ready" | "missing" | "sending" | "ok" | "error";

export default function UnsubscribePage() {
  const [state, setState] = useState<State>("ready");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!value) {
      setState("missing");
      return;
    }
    setToken(value);
  }, []);

  async function unsubscribe() {
    setState("sending");
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setMessage(data.error ?? "Could not unsubscribe.");
        return;
      }
      setState("ok");
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      {state === "missing" && (
        <>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Invalid link</h1>
          <p className="mt-3 text-sm text-slate-500">The unsubscribe link is missing its token.</p>
          <Link href="/" className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white">
            Back to store
          </Link>
        </>
      )}
      {(state === "ready" || state === "sending") && (
        <>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Unsubscribe from newsletter?</h1>
          <p className="mt-3 text-sm text-slate-500">You will no longer receive our marketing emails. Order updates will still be sent.</p>
          <button
            type="button"
            disabled={state === "sending"}
            onClick={unsubscribe}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {state === "sending" ? "Unsubscribing…" : "Yes, unsubscribe me"}
          </button>
        </>
      )}
      {state === "ok" && (
        <>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Unsubscribed</h1>
          <p className="mt-3 text-sm text-slate-500">You have been removed from our newsletter. Sorry to see you go.</p>
          <Link href="/" className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white">
            Back to store
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-500">{message}</p>
          <Link href="/" className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white">
            Back to store
          </Link>
        </>
      )}
    </main>
  );
}
