import { NextRequest, NextResponse } from "next/server";
import { protocol } from "@/lib/protocol";

export const dynamic = "force-dynamic";

type SourceHealth = {
  ok: boolean;
  latencyMs: number;
  detail: string;
  block: number | null;
};

async function check(
  label: string,
  endpoint: string,
  body: object,
  fresh: boolean,
  isRpc = false,
): Promise<SourceHealth> {
  const startedAt = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      ...(fresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: 120 } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
    const result = await response.json();
    if (result.errors?.length || result.error)
      throw new Error(
        result.errors?.[0]?.message ?? result.error.message ?? "Source error",
      );
    const block = isRpc
      ? Number.parseInt(result.result, 16)
      : Number(result.data?._meta?.block?.number);
    if (!Number.isFinite(block)) throw new Error("Invalid block response");
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      detail: "Connected",
      block,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : "Unavailable",
      block: null,
    };
  }
}

export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.has("fresh");
  const [rpc, v2, v3] = await Promise.all([
    check(
      "RPC",
      protocol.rpcUrl,
      { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] },
      fresh,
      true,
    ),
    check(
      "V2",
      protocol.subgraphs.v2,
      { query: "{ _meta { block { number } } }" },
      fresh,
    ),
    check(
      "V3.2",
      protocol.subgraphs.v3,
      { query: "{ _meta { block { number } } }" },
      fresh,
    ),
  ]);
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), rpc, v2, v3 },
    {
      headers: {
        "Cache-Control": fresh
          ? "no-store"
          : "public, s-maxage=120, stale-while-revalidate=120",
      },
    },
  );
}
