import { NextRequest, NextResponse } from "next/server";
import { buildDatasetQuery, datasetById } from "@/lib/datasets";
import { protocol } from "@/lib/protocol";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const MAX_PAGE = 199;

export async function GET(request: NextRequest) {
  const dataset = datasetById.get(
    request.nextUrl.searchParams.get("dataset") ?? "",
  );
  const pageValue = request.nextUrl.searchParams.get("page") ?? "0";
  const page = Number(pageValue);
  if (
    !dataset ||
    !/^\d+$/.test(pageValue) ||
    !Number.isInteger(page) ||
    page > MAX_PAGE
  ) {
    return NextResponse.json(
      { error: "Unknown dataset or page." },
      { status: 400 },
    );
  }

  const query = buildDatasetQuery(dataset, page, PAGE_SIZE);
  const fresh = request.nextUrl.searchParams.has("fresh");

  try {
    const upstream = await fetch(protocol.subgraphs[dataset.source], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
      ...(fresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await upstream.json();
    if (
      !upstream.ok ||
      result.errors?.length ||
      !Array.isArray(result.data?.records)
    ) {
      throw new Error(
        result.errors?.[0]?.message ??
          `Indexer returned HTTP ${upstream.status}`,
      );
    }
    return NextResponse.json(
      {
        dataset: dataset.id,
        page,
        pageSize: PAGE_SIZE,
        records: result.data.records.slice(0, PAGE_SIZE),
        hasMore: result.data.records.length > PAGE_SIZE,
        block: result.data._meta?.block?.number ?? null,
        hasIndexingErrors: result.data._meta?.hasIndexingErrors ?? false,
        query,
      },
      {
        headers: {
          "Cache-Control": fresh
            ? "no-store"
            : "public, s-maxage=60, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Indexer unavailable" },
      { status: 502 },
    );
  }
}
