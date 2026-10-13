"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Health, Summary } from "@/lib/types";

type ProtocolContextValue = {
  health: Health | null;
  summary: Summary | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};

const ProtocolContext = createContext<ProtocolContextValue | null>(null);

export function ProtocolProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const load = async (fresh = false) => {
      if (mounted) setRefreshing(true);
      const suffix = fresh ? "?fresh=1" : "";
      const results = await Promise.allSettled([
        fetch(`/api/health${suffix}`, {
          signal: controller.signal,
          cache: "no-store",
        }).then(async (response) => {
          if (!response.ok) throw new Error(`Health HTTP ${response.status}`);
          return response.json() as Promise<Health>;
        }),
        fetch(`/api/summary${suffix}`, {
          signal: controller.signal,
          cache: "no-store",
        }).then(async (response) => {
          if (!response.ok) throw new Error(`Summary HTTP ${response.status}`);
          return response.json() as Promise<Summary>;
        }),
      ]);
      if (!mounted) return;
      if (results[0].status === "fulfilled") setHealth(results[0].value);
      if (results[1].status === "fulfilled") setSummary(results[1].value);
      const failures = results.filter(
        (result) => result.status === "rejected",
      ) as PromiseRejectedResult[];
      setError(
        failures.length
          ? failures.map((failure) => String(failure.reason)).join("; ")
          : null,
      );
      setLoading(false);
      setRefreshing(false);
    };
    void load(refreshKey > 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 180_000);
    return () => {
      mounted = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  return (
    <ProtocolContext.Provider
      value={{
        health,
        summary,
        loading,
        refreshing,
        error,
        refresh: () => setRefreshKey((key) => key + 1),
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (!context)
    throw new Error("useProtocol must be called inside ProtocolProvider");
  return context;
}
