import type { DataSource } from "@/lib/protocol";

export type QueryPreset = {
  id: string;
  label: string;
  description: string;
  source: DataSource;
  query: string;
};

export const queryPresets: QueryPreset[] = [
  {
    id: "v3-communities",
    label: "Communities",
    description: "Latest V3.2 community deployments",
    source: "v3",
    query:
      "query Communities {\n  communities(first: 10, orderBy: createdAt, orderDirection: desc) {\n    id\n    communityId\n    name\n    active\n    treasury\n    hub\n    createdAt\n  }\n}",
  },
  {
    id: "v3-proposals",
    label: "Proposals",
    description: "Recent governance proposals",
    source: "v3",
    query:
      "query Proposals {\n  communityProposals(first: 10, orderBy: updatedAt, orderDirection: desc) {\n    proposalId\n    status\n    mode\n    origin\n    executionAmount\n    community { name }\n  }\n}",
  },
  {
    id: "v3-milestones",
    label: "Milestones",
    description: "Latest supporter reviews",
    source: "v3",
    query:
      "query Reviews {\n  communityMilestoneReviews(first: 10, orderBy: updatedAt, orderDirection: desc) {\n    milestone\n    settled\n    approved\n    yesWeight\n    noWeight\n    reviewerCount\n    plan { community { name } }\n  }\n}",
  },
  {
    id: "v3-members",
    label: "Members",
    description: "Recent community members",
    source: "v3",
    query:
      "query Members {\n  communityMembers(first: 10, orderBy: joinedAt, orderDirection: desc) {\n    account\n    active\n    isAdmin\n    isValidator\n    community { name }\n  }\n}",
  },
  {
    id: "v2-stats",
    label: "Protocol stats",
    description: "Funding totals and round count",
    source: "v2",
    query:
      'query ProtocolStats {\n  protocolStats(id: "current") {\n    totalTreasury\n    totalDeposited\n    totalDistributed\n    totalIdeas\n    totalRounds\n    activeRounds\n  }\n}',
  },
  {
    id: "v2-ideas",
    label: "Funding ideas",
    description: "Latest published ideas",
    source: "v2",
    query:
      "query Ideas {\n  ideas(first: 10, orderBy: createdAt, orderDirection: desc) {\n    id\n    title\n    author\n    minimumNetFunding\n    totalVotes\n  }\n}",
  },
  {
    id: "v2-rounds",
    label: "Voting rounds",
    description: "Round outcomes and pledged capital",
    source: "v2",
    query:
      "query Rounds {\n  rounds(first: 10, orderBy: id, orderDirection: desc) {\n    id\n    active\n    settled\n    totalPledged\n    winningIdeaId\n    backerMilestones\n  }\n}",
  },
];
