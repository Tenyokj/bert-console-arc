import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { protocol } from "@/lib/protocol";
import { readTreasurySnapshot } from "@/lib/treasury-revenue";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const round = request.nextUrl.searchParams.get("round") ?? "";
  if (
    round &&
    (!/^[1-9]\d{0,77}$/.test(round) || BigInt(round) >= 2n ** 256n)
  ) {
    return NextResponse.json(
      { data: null, error: "Invalid positive uint256 round ID" },
      { status: 400 },
    );
  }
  const pool =
    process.env.BERT_FUNDING_POOL_ADDRESS ??
    "0x5eDdccd772a9E0F079cC6646b529C20e3D46e585";
  try {
    if (!isAddress(pool))
      throw new Error("Invalid configured FundingPool address");
    const client = createPublicClient({
      transport: http(protocol.rpcUrl, { timeout: 10_000, retryCount: 1 }),
    });
    const data = await readTreasurySnapshot(
      client,
      pool,
      protocol.chainId,
      round ? BigInt(round) : undefined,
    );
    return NextResponse.json(
      { data, error: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
        },
      },
    );
  } catch {
    // Do not expose provider URLs or credentials embedded in transport exceptions.
    return NextResponse.json(
      {
        data: null,
        error:
          "Treasury reads failed validation or the RPC is unavailable. No amounts have been inferred.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
