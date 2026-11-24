"use client";

import { useEffect, useState } from "react";
import type { TreasurySnapshot } from "@/lib/treasury-revenue";
import { useProtocol } from "./ProtocolProvider";
import { TreasuryReadout } from "./TreasuryReadout";

export function ConsoleTreasury() {
  const { summary } = useProtocol();
  const [input, setInput] = useState("");
  const [round, setRound] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [inputError, setInputError] = useState("");
  const [result, setResult] = useState<{
    key: string;
    data: TreasurySnapshot | null;
    error: string | null;
  }>();
  const key = `${round}:${refresh}:${summary?.checkedAt ?? "initial"}`;
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (round) query.set("round", round);
    void fetch(`/api/treasury?${query}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok || !value.data)
          throw new Error(value.error ?? "Treasury unavailable");
        if (!controller.signal.aborted)
          setResult({ key, data: value.data, error: null });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            key,
            data: null,
            error:
              "Treasury accounting unavailable. Refresh to retry; missing data is not a zero balance.",
          });
      });
    return () => controller.abort();
  }, [key, round]);
  const current = result?.key === key ? result : undefined;
  return (
    <section className="surface-panel treasury-section" aria-label="Live FundingPool accounting">
      <form
        className="revenue-controls"
        onSubmit={(event) => {
          event.preventDefault();
          if (
            input &&
            (!/^[1-9]\d{0,77}$/.test(input) || BigInt(input) >= 2n ** 256n)
          ) {
            setInputError("Enter a positive uint256 round ID.");
            return;
          }
          setInputError("");
          setRound(input);
        }}
      >
        <label>
          Historical revenue snapshot
          <input
            aria-label="Revenue round ID"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Optional round ID"
          />
        </label>
        <button type="submit">Inspect round snapshot</button>
        <button type="button" onClick={() => setRefresh((value) => value + 1)}>
          Refresh accounting (read-only)
        </button>
      </form>
      <p>
        Direct RPC snapshot, separate from the indexer totals below. This
        console cannot sign, schedule settings or move funds.
      </p>
      {inputError && <p role="alert">{inputError}</p>}
      {!current && <p role="status">Reading treasury accounting...</p>}
      {current?.error && <p role="alert">{current.error}</p>}
      {current?.data && <TreasuryReadout snapshot={current.data} />}
    </section>
  );
}
