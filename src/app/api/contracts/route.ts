import { NextRequest, NextResponse } from "next/server";
import { monitoredProxies, protocol } from "@/lib/protocol";

export const dynamic = "force-dynamic";

const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const PAUSED_SELECTOR = "0x5c975abb";

async function rpc(method: string, params: unknown[], id: number) {
  const response = await fetch(protocol.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const result = await response.json();
  if (result.error || typeof result.result !== "string") {
    throw new Error(result.error?.message ?? "Invalid RPC response");
  }
  return result.result as string;
}

export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.has("fresh");
  const contracts = await Promise.all(
    monitoredProxies.map(async (contract, index) => {
      try {
        const [slot, pausedRaw] = await Promise.all([
          rpc(
            "eth_getStorageAt",
            [contract.address, IMPLEMENTATION_SLOT, "latest"],
            index * 2 + 1,
          ),
          contract.pausable
            ? rpc(
                "eth_call",
                [{ to: contract.address, data: PAUSED_SELECTOR }, "latest"],
                index * 2 + 2,
              )
            : Promise.resolve(null),
        ]);
        const implementation =
          slot.length >= 42 ? `0x${slot.slice(-40)}` : null;
        return {
          label: contract.label,
          address: contract.address,
          group: contract.group,
          implementation:
            implementation && !/^0x0+$/.test(implementation)
              ? implementation
              : null,
          paused: pausedRaw === null ? null : BigInt(pausedRaw) !== 0n,
          error: null,
        };
      } catch (error) {
        return {
          label: contract.label,
          address: contract.address,
          group: contract.group,
          implementation: null,
          paused: null,
          error: error instanceof Error ? error.message : "RPC unavailable",
        };
      }
    }),
  );
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), contracts },
    {
      headers: {
        "Cache-Control": fresh
          ? "no-store"
          : "public, s-maxage=120, stale-while-revalidate=120",
      },
    },
  );
}
