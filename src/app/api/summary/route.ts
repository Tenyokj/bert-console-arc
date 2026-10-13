import { NextRequest, NextResponse } from "next/server";
import { protocol } from "@/lib/protocol";

export const dynamic = "force-dynamic";

const V2_QUERY = `{
  _meta { block { number timestamp } hasIndexingErrors }
  protocolStats(id: "current") {
    totalTreasury totalDeposited totalDistributed distributionCount totalIdeas totalRounds activeRounds
  }
  rounds(first: 12, orderBy: id, orderDirection: desc) {
    id startTime endTime active ended settled cancelled totalVotes totalPledged
    grossFunding netFunding winningIdeaId backerMilestones
  }
  ideas(first: 20, orderBy: createdAt, orderDirection: desc) {
    id title author status totalVotes minimumNetFunding roundId createdAt
  }
  grantPayouts(first: 12, orderBy: id, orderDirection: desc) {
    id roundId ideaId totalGrant released initialClaimed
  }
  milestoneRequests(first: 12, orderBy: id, orderDirection: desc) {
    id roundId ideaId stage active approvals rejections backerApproveWeight
    backerRejectWeight graceDeadline submittedAt
  }
}`;

const V3_QUERY = `{
  _meta { block { number timestamp } hasIndexingErrors }
  communities(first: 1000, orderBy: createdAt, orderDirection: desc) {
    id communityId name active status treasury hub creator createdAt
  }
  communityProposals(first: 24, orderBy: updatedAt, orderDirection: desc) {
    id proposalId status mode origin executionAmount accepted settled
    yesVotes noVotes bondAmount createdAt updatedAt
    community { id name }
    round { id roundId }
  }
  communitySlateRounds(first: 16, orderBy: updatedAt, orderDirection: desc) {
    id roundId origin votingDeadline totalVotes winningProposalId
    winningVotes settled executionAmount createdAt updatedAt
    community { id name }
  }
  communityExecutionPlans(first: 16, orderBy: updatedAt, orderDirection: desc) {
    id planId status budget releasedAmount currentMilestone supporterCount
    refundLiability createdAt updatedAt community { id name }
  }
  communityMilestoneReviews(first: 16, orderBy: updatedAt, orderDirection: desc) {
    id milestone yesWeight noWeight reviewerCount settled approved releasedAmount
    closesAt updatedAt plan { id community { name } }
  }
  communityMembers(first: 40, orderBy: joinedAt, orderDirection: desc) {
    id account active isAdmin isValidator membershipStake joinedAt community { id name }
  }
  communityWithdrawals(first: 8, orderBy: updatedAt, orderDirection: desc) {
    id requestId amount cancelled executed createdAt community { name }
  }
}`;

async function query(endpoint: string, graphQuery: string, fresh: boolean) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: graphQuery }),
      ...(fresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: 120 } }),
      signal: AbortSignal.timeout(12_000),
    });
    const result = await response.json();
    if (!response.ok || result.errors)
      throw new Error(
        result.errors?.[0]?.message ??
          `Indexer returned HTTP ${response.status}`,
      );
    return { data: result.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Indexer unavailable",
    };
  }
}

export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.has("fresh");
  const [v2, v3] = await Promise.all([
    query(protocol.subgraphs.v2, V2_QUERY, fresh),
    query(protocol.subgraphs.v3, V3_QUERY, fresh),
  ]);
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), v2, v3 },
    {
      headers: {
        "Cache-Control": fresh
          ? "no-store"
          : "public, s-maxage=120, stale-while-revalidate=120",
      },
    },
  );
}
