export type SourceHealth = {
  ok: boolean;
  latencyMs: number;
  detail: string;
  block: number | null;
};
export type Health = {
  checkedAt: string;
  rpc: SourceHealth;
  v2: SourceHealth;
  v3: SourceHealth;
};
export type Meta = {
  block: { number: number; timestamp?: number | null };
  hasIndexingErrors: boolean;
};
export type V2Round = {
  id: string;
  startTime: string;
  endTime: string;
  active: boolean;
  ended: boolean;
  settled: boolean;
  cancelled: boolean;
  totalVotes: string;
  totalPledged: string;
  grossFunding: string;
  netFunding: string;
  winningIdeaId: string;
  backerMilestones: boolean;
};
export type V2Idea = {
  id: string;
  title: string;
  author: string | null;
  status: number;
  totalVotes: string;
  minimumNetFunding: string;
  roundId: string | null;
  createdAt: string;
};
export type V2Grant = {
  id: string;
  roundId: string;
  ideaId: string;
  totalGrant: string;
  released: string;
  initialClaimed: boolean;
};
export type V2Milestone = {
  id: string;
  roundId: string;
  ideaId: string;
  stage: number;
  active: boolean;
  approvals: number;
  rejections: number;
  backerApproveWeight: string;
  backerRejectWeight: string;
  graceDeadline: string;
  submittedAt: string;
};
export type Community = {
  id: string;
  communityId: string;
  name: string;
  active: boolean;
  status: number;
  treasury: string;
  hub: string | null;
  creator: string;
  createdAt: string;
};
export type CommunityProposal = {
  id: string;
  proposalId: string;
  status: string;
  mode: number;
  origin: number;
  executionAmount: string;
  accepted: boolean | null;
  settled: boolean;
  yesVotes: string;
  noVotes: string;
  bondAmount: string;
  createdAt: string;
  updatedAt: string;
  community: { id: string; name: string };
  round: { id: string; roundId: string } | null;
};
export type CommunitySlateRound = {
  id: string;
  roundId: string;
  origin: number;
  votingDeadline: string;
  totalVotes: string;
  winningProposalId: string | null;
  winningVotes: string;
  settled: boolean;
  executionAmount: string;
  createdAt: string;
  updatedAt: string;
  community: { id: string; name: string };
};
export type ExecutionPlan = {
  id: string;
  planId: string;
  status: string;
  budget: string;
  releasedAmount: string;
  currentMilestone: number;
  supporterCount: string;
  refundLiability: string;
  createdAt: string;
  updatedAt: string;
  community: { id: string; name: string };
};
export type MilestoneReview = {
  id: string;
  milestone: number;
  yesWeight: string;
  noWeight: string;
  reviewerCount: string;
  settled: boolean;
  approved: boolean | null;
  releasedAmount: string;
  closesAt: string | null;
  updatedAt: string;
  plan: { id: string; community: { name: string } };
};
export type CommunityMember = {
  id: string;
  account: string;
  active: boolean;
  isAdmin: boolean;
  isValidator: boolean;
  membershipStake: string;
  joinedAt: string;
  community: { id: string; name: string };
};
export type CommunityWithdrawal = {
  id: string;
  requestId: string;
  amount: string;
  cancelled: boolean;
  executed: boolean;
  createdAt: string;
  community: { name: string };
};
export type V2Data = {
  _meta: Meta;
  protocolStats: {
    totalTreasury: string;
    totalDeposited: string;
    totalDistributed: string;
    distributionCount: string;
    totalIdeas: string;
    totalRounds: string;
    activeRounds: string;
  } | null;
  rounds: V2Round[];
  ideas: V2Idea[];
  grantPayouts: V2Grant[];
  milestoneRequests: V2Milestone[];
};
export type V3Data = {
  _meta: Meta;
  communities: Community[];
  communityProposals: CommunityProposal[];
  communitySlateRounds: CommunitySlateRound[];
  communityExecutionPlans: ExecutionPlan[];
  communityMilestoneReviews: MilestoneReview[];
  communityMembers: CommunityMember[];
  communityWithdrawals: CommunityWithdrawal[];
};
export type Summary = {
  checkedAt: string;
  v2: { data: V2Data | null; error: string | null };
  v3: { data: V3Data | null; error: string | null };
};
