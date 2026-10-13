import { NextRequest, NextResponse } from "next/server";
import { Kind, parse, visit } from "graphql";
import { protocol, type DataSource } from "@/lib/protocol";

const MAX_QUERY_LENGTH = 8_000;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    source?: DataSource;
    query?: string;
    variables?: Record<string, unknown>;
  } | null;
  if (
    !body ||
    (body.source !== "v2" && body.source !== "v3") ||
    typeof body.query !== "string"
  ) {
    return NextResponse.json(
      { error: "Provide a source (v2 or v3) and GraphQL query." },
      { status: 400 },
    );
  }
  if (!body.query.trim() || body.query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query must be between 1 and ${MAX_QUERY_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (
    body.variables &&
    (typeof body.variables !== "object" ||
      Array.isArray(body.variables) ||
      JSON.stringify(body.variables).length > 10_000)
  ) {
    return NextResponse.json(
      { error: "Variables must be a JSON object smaller than 10 KB." },
      { status: 400 },
    );
  }

  try {
    const document = parse(body.query);
    if (
      document.definitions.some(
        (definition) =>
          definition.kind === Kind.OPERATION_DEFINITION &&
          definition.operation !== "query",
      )
    ) {
      return NextResponse.json(
        { error: "Only read-only GraphQL queries are allowed." },
        { status: 400 },
      );
    }
    let depth = 0;
    let maxDepth = 0;
    let fields = 0;
    visit(document, {
      Field: {
        enter(node) {
          depth += 1;
          maxDepth = Math.max(maxDepth, depth);
          fields += 1;
          if (
            node.name.value.startsWith("__") &&
            node.name.value !== "__typename"
          )
            throw new Error(
              "Schema introspection is disabled in this public console.",
            );
          const first = node.arguments?.find(
            (argument) => argument.name.value === "first",
          );
          if (first?.value.kind === Kind.INT && Number(first.value.value) > 100)
            throw new Error("The first argument is limited to 100 records.");
        },
        leave() {
          depth -= 1;
        },
      },
    });
    if (fields > 120 || maxDepth > 8)
      throw new Error("Query exceeds the public field or depth limit.");
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid GraphQL query.",
      },
      { status: 400 },
    );
  }

  const endpoint = protocol.subgraphs[body.source];
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: body.query,
        variables: body.variables ?? {},
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json();
    if (JSON.stringify(result).length > 2_000_000)
      return NextResponse.json(
        { error: "Response is too large. Request fewer fields or records." },
        { status: 413 },
      );
    return NextResponse.json(result, {
      status: response.ok ? 200 : response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Subgraph request failed.",
      },
      { status: 502 },
    );
  }
}
