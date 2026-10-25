"use client";

import { Children, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Blocks,
  CalendarClock,
  CircleDollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Network,
  Search,
  RefreshCw,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { useProtocol } from "@/components/ProtocolProvider";
import {
  Address,
  Amount,
  EmptyPanel,
  ErrorPanel,
  ExternalTextLink,
  LoadingPanel,
  SectionHeader,
  StateBadge,
} from "@/components/ui";
import { formatCount, formatDate, relativeTime } from "@/lib/format";
import { protocol } from "@/lib/protocol";

type LiveContractState = {
  checkedAt: string;
  contracts: {
    label: string;
    address: string;
    implementation: string | null;
    paused: boolean | null;
    error: string | null;
  }[];
};

function PageTitle({
  overline,
  title,
  description,
  icon: Icon,
}: {
  overline: string;
  title: string;
  description: string;
  icon: typeof Blocks;
}) {
  return (
    <div className="page-title">
      <div>
        <p className="page-overline">{overline}</p>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{description}</p>
      </div>
      <div className="page-title-icon">
        <Icon size={45} strokeWidth={1.3} />
      </div>
    </div>
  );
}
function MiniStat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  icon: typeof Blocks;
}) {
  return (
    <div className="mini-stat">
      <span className="mini-stat-icon">
        <Icon size={18} />
      </span>
      <span className="mini-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <kbd>⌕</kbd>
    </label>
  );
}
function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tab-bar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === active}
          className={tab.id === active ? "active" : ""}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              title={`${tab.count} loaded records`}
              aria-label={`${tab.count} loaded records`}
            >
              {tab.count > 99 ? "99+" : tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
function DataTable({
  headings,
  children,
  pageSize = 6,
}: {
  headings: string[];
  children: React.ReactNode;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const rows = Children.toArray(children);
  const lastPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const visibleRows = rows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  return (
    <>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {headings.map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              visibleRows
            ) : (
              <tr>
                <td className="table-empty" colSpan={headings.length}>
                  No entries match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span>
          {rows.length
            ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, rows.length)}`
            : "0"}{" "}
          of {rows.length} loaded records
        </span>
        <div>
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span>
            Page {currentPage + 1} / {lastPage + 1}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= lastPage}
            onClick={() => setPage(currentPage + 1)}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

type FundingTab = "ideas" | "rounds" | "milestones" | "grants";
export function FundingPage() {
  const { summary, loading } = useProtocol();
  const data = summary?.v2.data;
  const [tab, setTab] = useState<FundingTab>("ideas");
  const [search, setSearch] = useState("");
  const match = (value: string) =>
    value.toLowerCase().includes(search.toLowerCase());
  return (
    <div className="page-enter funding-page">
      <PageTitle
        overline="FUNDING LAYER · V2.3"
        title="Funding intelligence"
        description="Track ideas, voting rounds, grant releases and backer milestones from the public indexer."
        icon={CircleDollarSign}
      />
      <div className="mini-stat-grid">
        <MiniStat
          label="TREASURY"
          value={<Amount value={data?.protocolStats?.totalTreasury} />}
          note="Indexed protocol total"
          icon={CircleDollarSign}
        />
        <MiniStat
          label="IDEAS CREATED"
          value={formatCount(data?.protocolStats?.totalIdeas)}
          note="All time"
          icon={Layers3}
        />
        <MiniStat
          label="ACTIVE ROUNDS"
          value={formatCount(data?.protocolStats?.activeRounds)}
          note="Currently accepting votes"
          icon={Vote}
        />
        <MiniStat
          label="DISTRIBUTED"
          value={<Amount value={data?.protocolStats?.totalDistributed} />}
          note="Across grants"
          icon={ShieldCheck}
        />
      </div>
      <section className="surface-panel explorer-panel">
        <SectionHeader
          eyebrow="ONCHAIN INDEX"
          title="Funding explorer"
          description={`Indexed to block ${formatCount(data?._meta.block.number)} · Tab counts describe only the latest loaded records, not protocol totals.`}
          action={
            <ExternalTextLink href={protocol.links.graphV2}>
              Open subgraph
            </ExternalTextLink>
          }
        />
        <div className="explorer-toolbar">
          <TabBar
            tabs={[
              { id: "ideas", label: "Ideas", count: data?.ideas.length },
              { id: "rounds", label: "Rounds", count: data?.rounds.length },
              {
                id: "milestones",
                label: "Milestones",
                count: data?.milestoneRequests.length,
              },
              {
                id: "grants",
                label: "Grants",
                count: data?.grantPayouts.length,
              },
            ]}
            active={tab}
            onChange={(next) => {
              setTab(next);
              setSearch("");
            }}
          />
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={`Search loaded ${tab}...`}
          />
        </div>
        {loading && !data ? (
          <LoadingPanel />
        ) : summary?.v2.error ? (
          <ErrorPanel
            title="Funding data unavailable"
            detail={summary.v2.error}
          />
        ) : !data ? (
          <EmptyPanel
            title="No funding data"
            description="The indexer has not returned a funding snapshot."
          />
        ) : (
          <>
            {tab === "ideas" && (
              <DataTable
                key={search}
                headings={[
                  "IDEA",
                  "AUTHOR",
                  "MINIMUM FUNDING",
                  "VOTES",
                  "CREATED",
                ]}
              >
                {data.ideas
                  .filter((item) =>
                    match(`${item.title} ${item.id} ${item.author ?? ""}`),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-primary">
                          <span className="row-avatar">
                            {item.title.slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>Idea #{item.id}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <Address value={item.author} />
                      </td>
                      <td>
                        <Amount value={item.minimumNetFunding} />
                      </td>
                      <td>{formatCount(item.totalVotes)}</td>
                      <td className="muted" title={formatDate(item.createdAt)}>
                        {relativeTime(item.createdAt)}
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "rounds" && (
              <DataTable
                key={search}
                headings={[
                  "ROUND",
                  "STATUS",
                  "TOTAL PLEDGED",
                  "WINNING IDEA",
                  "ENDS",
                ]}
              >
                {data.rounds
                  .filter((item) => match(item.id))
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Round #{item.id}</strong>
                        <small>
                          {item.backerMilestones
                            ? "Backer milestones"
                            : "Legacy flow"}
                        </small>
                      </td>
                      <td>
                        <StateBadge
                          label={
                            item.cancelled
                              ? "Cancelled"
                              : item.active
                                ? "Active"
                                : item.settled
                                  ? "Settled"
                                  : "Ended"
                          }
                          tone={
                            item.cancelled
                              ? "danger"
                              : item.active
                                ? "success"
                                : item.settled
                                  ? "info"
                                  : "neutral"
                          }
                        />
                      </td>
                      <td>
                        <Amount value={item.totalPledged} />
                      </td>
                      <td>
                        {item.winningIdeaId !== "0"
                          ? `#${item.winningIdeaId}`
                          : "—"}
                      </td>
                      <td className="muted">{formatDate(item.endTime)}</td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "milestones" && (
              <DataTable
                key={search}
                headings={[
                  "REQUEST",
                  "IDEA",
                  "STAGE",
                  "REVIEW WEIGHT",
                  "STATE",
                ]}
              >
                {data.milestoneRequests
                  .filter((item) => match(`${item.id} ${item.ideaId}`))
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.id}</strong>
                        <small>Round #{item.roundId}</small>
                      </td>
                      <td>Idea #{item.ideaId}</td>
                      <td>Stage {item.stage}</td>
                      <td>
                        <span className="review-yes">
                          {formatCount(item.backerApproveWeight)}
                        </span>{" "}
                        /{" "}
                        <span className="review-no">
                          {formatCount(item.backerRejectWeight)}
                        </span>
                      </td>
                      <td>
                        <StateBadge
                          label={item.active ? "Review open" : "Closed"}
                          tone={item.active ? "info" : "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "grants" && (
              <DataTable
                key={search}
                headings={[
                  "GRANT",
                  "ROUND",
                  "TOTAL GRANT",
                  "RELEASED",
                  "INITIAL CLAIM",
                ]}
              >
                {data.grantPayouts
                  .filter((item) => match(`${item.id} ${item.ideaId}`))
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Idea #{item.ideaId}</strong>
                      </td>
                      <td>Round #{item.roundId}</td>
                      <td>
                        <Amount value={item.totalGrant} />
                      </td>
                      <td>
                        <Amount value={item.released} />
                      </td>
                      <td>
                        <StateBadge
                          label={item.initialClaimed ? "Claimed" : "Pending"}
                          tone={item.initialClaimed ? "success" : "warning"}
                        />
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
          </>
        )}
      </section>
      <div className="helper-callout">
        <CalendarClock size={20} />
        <div>
          <strong>Need a specific round or historical record?</strong>
          <p>
            The tables show recent indexed entries. Query Studio lets you
            filter, page and export the full subgraph.
          </p>
        </div>
        <a href="/console">
          Open Studio <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}

type CommunityTab =
  | "communities"
  | "proposals"
  | "rounds"
  | "plans"
  | "reviews"
  | "members"
  | "withdrawals";
export function CommunitiesPage() {
  const { summary, loading } = useProtocol();
  const data = summary?.v3.data;
  const [tab, setTab] = useState<CommunityTab>("communities");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);
  const dismissDetail = () => {
    if (closingDetail) return;
    setClosingDetail(true);
    window.setTimeout(() => {
      setSelected(null);
      setClosingDetail(false);
    }, 240);
  };
  const match = (value: string) =>
    value.toLowerCase().includes(search.toLowerCase());
  const active = data?.communities.filter((item) => item.active).length;
  const selectedCommunity = data?.communities.find(
    (item) => item.id === selected,
  );
  return (
    <div className="page-enter community-page">
      <PageTitle
        overline="COMMUNITY LAYER · V3.2"
        title="Community intelligence"
        description="Watch new communities, governance proposals, milestone reviews and treasury execution."
        icon={Blocks}
      />
      <div className="mini-stat-grid">
        <MiniStat
          label="COMMUNITIES"
          value={data ? formatCount(data.communities.length) : "—"}
          note={
            data?.communities.length === 1000
              ? "First 1,000 indexed"
              : "Indexed on Arc"
          }
          icon={Blocks}
        />
        <MiniStat
          label="ACTIVE"
          value={active === undefined ? "—" : formatCount(active)}
          note="Live community spaces"
          icon={Network}
        />
        <MiniStat
          label="RECENT PROPOSALS"
          value={data ? formatCount(data.communityProposals.length) : "—"}
          note="Latest 24 indexed"
          icon={Vote}
        />
        <MiniStat
          label="SLATE ROUNDS"
          value={data ? formatCount(data.communitySlateRounds.length) : "—"}
          note="Latest 16 indexed"
          icon={Vote}
        />
      </div>
      <section className="surface-panel explorer-panel">
        <SectionHeader
          eyebrow="COMMUNITY INDEX"
          title="Community explorer"
          description={`Indexed to block ${formatCount(data?._meta.block.number)} · Tab counts describe recent records across all communities, not global totals. Select a community for details.`}
          action={
            <ExternalTextLink href={protocol.links.graphV3}>
              Open subgraph
            </ExternalTextLink>
          }
        />
        <div className="explorer-toolbar">
          <TabBar
            tabs={[
              {
                id: "communities",
                label: "Communities",
                count: data?.communities.length,
              },
              {
                id: "proposals",
                label: "Proposals",
                count: data?.communityProposals.length,
              },
              {
                id: "rounds",
                label: "Slate rounds",
                count: data?.communitySlateRounds.length,
              },
              {
                id: "plans",
                label: "Plans",
                count: data?.communityExecutionPlans.length,
              },
              {
                id: "reviews",
                label: "Reviews",
                count: data?.communityMilestoneReviews.length,
              },
              {
                id: "members",
                label: "Members",
                count: data?.communityMembers.length,
              },
              {
                id: "withdrawals",
                label: "Withdrawals",
                count: data?.communityWithdrawals.length,
              },
            ]}
            active={tab}
            onChange={(next) => {
              setTab(next);
              setSearch("");
            }}
          />
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={`Search loaded ${tab}...`}
          />
        </div>
        {tab === "members" && (
          <p className="scope-note">
            <Users size={15} /> Latest {data?.communityMembers.length ?? 0}{" "}
            membership records across all communities (up to 40 loaded). Not a
            protocol-wide total or unique wallets.{" "}
            <a href="/explore?dataset=v3-members">
              Browse all records <ArrowUpRight size={13} />
            </a>
          </p>
        )}
        {tab === "rounds" && (
          <p className="scope-note">
            <Vote size={15} /> Total staked is the sum of USDC votes across
            every candidate in a slate round. The execution budget is determined
            only when the round settles.
            <a href="/explore?dataset=v3-slate-votes">
              Inspect votes <ArrowUpRight size={13} />
            </a>
          </p>
        )}
        {loading && !data ? (
          <LoadingPanel />
        ) : summary?.v3.error ? (
          <ErrorPanel
            title="Community data unavailable"
            detail={summary.v3.error}
          />
        ) : !data ? (
          <EmptyPanel
            title="No community data"
            description="The indexer has not returned a community snapshot."
          />
        ) : (
          <>
            {tab === "communities" && (
              <DataTable
                key={search}
                headings={[
                  "COMMUNITY",
                  "STATUS",
                  "CREATOR",
                  "TREASURY",
                  "CREATED",
                ]}
              >
                {data.communities
                  .filter((item) =>
                    match(`${item.name} ${item.communityId} ${item.creator}`),
                  )
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="clickable-row"
                      onClick={() => {
                        setClosingDetail(false);
                        setSelected(item.id);
                      }}
                    >
                      <td>
                        <div className="table-primary">
                          <span className="row-avatar violet-avatar">
                            {item.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            <strong>{item.name}</strong>
                            <small>Community #{item.communityId}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <StateBadge
                          label={item.active ? "Active" : "Inactive"}
                          tone={item.active ? "success" : "neutral"}
                        />
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <Address value={item.creator} />
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <Address value={item.treasury} />
                      </td>
                      <td className="muted">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "proposals" && (
              <DataTable
                key={search}
                headings={[
                  "PROPOSAL",
                  "COMMUNITY",
                  "LANE",
                  "STATUS",
                  "VOTES",
                  "ROUND",
                  "EXECUTION BUDGET",
                ]}
              >
                {data.communityProposals
                  .filter((item) =>
                    match(
                      `${item.community.name} ${item.proposalId} ${item.status}`,
                    ),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Proposal #{item.proposalId}</strong>
                        <small title={formatDate(item.updatedAt)}>
                          {relativeTime(item.updatedAt)}
                        </small>
                      </td>
                      <td>{item.community.name}</td>
                      <td>
                        <StateBadge
                          label={`${item.origin === 0 ? "Admin" : "Member"} ${item.mode === 0 ? "Binary" : "Slate"}`}
                          tone="info"
                        />
                      </td>
                      <td>
                        <StateBadge
                          label={item.status}
                          tone={
                            item.accepted
                              ? "success"
                              : item.settled
                                ? "neutral"
                                : "warning"
                          }
                        />
                      </td>
                      <td>
                        {item.mode === 0 ? (
                          <span title="Binary proposal YES and NO stake">
                            <Amount value={item.yesVotes} /> yes /{" "}
                            <Amount value={item.noVotes} /> no
                          </span>
                        ) : item.status === "WonRound" &&
                          data.communitySlateRounds.some(
                            (round) =>
                              round.id === item.round?.id &&
                              round.winningProposalId === item.proposalId,
                          ) ? (
                          <span title="Stake voted for this winning slate candidate">
                            <Amount
                              value={
                                data.communitySlateRounds.find(
                                  (round) => round.id === item.round?.id,
                                )?.winningVotes
                              }
                            />{" "}
                            winner votes
                          </span>
                        ) : (
                          <span
                            className="muted"
                            title="Slate votes are allocated to candidates, not YES/NO. Open the vote ledger for individual votes; winner weight appears after settlement."
                          >
                            See slate votes
                          </span>
                        )}
                      </td>
                      <td>
                        {item.round ? (
                          <button
                            className="table-link"
                            type="button"
                            onClick={() => {
                              setTab("rounds");
                              setSearch(
                                `${item.community.name} #${item.round?.roundId ?? ""}`,
                              );
                            }}
                          >
                            #{item.round.roundId} <ArrowUpRight size={13} />
                          </button>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {item.mode === 1 ? (
                          item.status === "WonRound" ? (
                            <Amount value={item.executionAmount} />
                          ) : (
                            <span className="muted">No execution budget</span>
                          )
                        ) : item.settled ? (
                          <Amount value={item.executionAmount} />
                        ) : (
                          <span className="muted">Pending vote</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "rounds" && (
              <DataTable
                key={search}
                headings={[
                  "ROUND",
                  "COMMUNITY",
                  "ORIGIN",
                  "TOTAL STAKED",
                  "WINNER / WEIGHT",
                  "EXECUTION BUDGET",
                  "STATE",
                ]}
              >
                {data.communitySlateRounds
                  .filter((item) =>
                    match(`${item.community.name} #${item.roundId} ${item.id}`),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Round #{item.roundId}</strong>
                        <small>
                          Deadline {formatDate(item.votingDeadline)}
                        </small>
                      </td>
                      <td>{item.community.name}</td>
                      <td>{item.origin === 0 ? "Admin" : "Member"}</td>
                      <td>
                        <Amount value={item.totalVotes} />
                      </td>
                      <td>
                        {item.settled && item.winningProposalId !== null ? (
                          <>
                            <strong>Proposal #{item.winningProposalId}</strong>
                            <small>
                              <Amount value={item.winningVotes} /> winner votes
                            </small>
                          </>
                        ) : (
                          <span className="muted">Not settled</span>
                        )}
                      </td>
                      <td>
                        {item.settled ? (
                          <Amount value={item.executionAmount} />
                        ) : (
                          <span className="muted">Pending settlement</span>
                        )}
                      </td>
                      <td>
                        <StateBadge
                          label={
                            item.settled
                              ? "Settled"
                              : Number(data._meta.block.timestamp ?? 0) >=
                                  Number(item.votingDeadline)
                                ? "Awaiting settlement"
                                : "Voting open"
                          }
                          tone={item.settled ? "success" : "info"}
                        />
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "plans" && (
              <DataTable
                key={search}
                headings={["PLAN", "COMMUNITY", "BUDGET", "RELEASED", "STATUS"]}
              >
                {data.communityExecutionPlans
                  .filter((item) =>
                    match(
                      `${item.community.name} ${item.planId} ${item.status}`,
                    ),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Plan #{item.planId}</strong>
                        <small>
                          Milestone {item.currentMilestone} ·{" "}
                          {item.supporterCount} supporters
                        </small>
                      </td>
                      <td>{item.community.name}</td>
                      <td>
                        <Amount value={item.budget} />
                      </td>
                      <td>
                        <Amount value={item.releasedAmount} />
                      </td>
                      <td>
                        <StateBadge
                          label={item.status}
                          tone={
                            item.status.toLowerCase().includes("active")
                              ? "info"
                              : "neutral"
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "reviews" && (
              <DataTable
                key={search}
                headings={[
                  "MILESTONE",
                  "COMMUNITY",
                  "YES / NO WEIGHT",
                  "REVIEWERS",
                  "RESULT",
                ]}
              >
                {data.communityMilestoneReviews
                  .filter((item) =>
                    match(`${item.plan.community.name} ${item.id}`),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Milestone {item.milestone}</strong>
                        <small title={formatDate(item.updatedAt)}>
                          {relativeTime(item.updatedAt)}
                        </small>
                      </td>
                      <td>{item.plan.community.name}</td>
                      <td>
                        <span className="review-yes">
                          {formatCount(item.yesWeight)}
                        </span>{" "}
                        /{" "}
                        <span className="review-no">
                          {formatCount(item.noWeight)}
                        </span>
                      </td>
                      <td>{formatCount(item.reviewerCount)}</td>
                      <td>
                        <StateBadge
                          label={
                            !item.settled
                              ? "Review open"
                              : item.approved
                                ? "Approved"
                                : "Rejected"
                          }
                          tone={
                            !item.settled
                              ? "info"
                              : item.approved
                                ? "success"
                                : "danger"
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "members" && (
              <DataTable
                key={search}
                headings={["ACCOUNT", "COMMUNITY", "ROLE", "STAKE", "JOINED"]}
              >
                {data.communityMembers
                  .filter((item) =>
                    match(`${item.community.name} ${item.account}`),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Address value={item.account} />
                      </td>
                      <td>{item.community.name}</td>
                      <td>
                        <StateBadge
                          label={
                            item.isAdmin
                              ? "Admin"
                              : item.isValidator
                                ? "Validator"
                                : "Member"
                          }
                          tone={item.isAdmin ? "info" : "neutral"}
                        />
                      </td>
                      <td>
                        <Amount value={item.membershipStake} />
                      </td>
                      <td className="muted">{formatDate(item.joinedAt)}</td>
                    </tr>
                  ))}
              </DataTable>
            )}
            {tab === "withdrawals" && (
              <DataTable
                key={search}
                headings={[
                  "REQUEST",
                  "COMMUNITY",
                  "AMOUNT",
                  "STATUS",
                  "CREATED",
                ]}
              >
                {data.communityWithdrawals
                  .filter((item) =>
                    match(`${item.community.name} ${item.requestId}`),
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>Request #{item.requestId}</strong>
                      </td>
                      <td>{item.community.name}</td>
                      <td>
                        <Amount value={item.amount} />
                      </td>
                      <td>
                        <StateBadge
                          label={
                            item.cancelled
                              ? "Cancelled"
                              : item.executed
                                ? "Executed"
                                : "Pending"
                          }
                          tone={
                            item.cancelled
                              ? "danger"
                              : item.executed
                                ? "success"
                                : "warning"
                          }
                        />
                      </td>
                      <td className="muted">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
              </DataTable>
            )}
          </>
        )}
      </section>
      {selectedCommunity && (
        <div
          className={`detail-backdrop ${closingDetail ? "is-closing" : ""}`}
          onClick={dismissDetail}
        >
          <aside
            className="detail-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="drawer-close"
              onClick={dismissDetail}
              aria-label="Close details"
            >
              ×
            </button>
            <span className="page-overline">
              COMMUNITY #{selectedCommunity.communityId}
            </span>
            <h2>{selectedCommunity.name}</h2>
            <StateBadge
              label={selectedCommunity.active ? "Active" : "Inactive"}
              tone={selectedCommunity.active ? "success" : "neutral"}
            />
            <p>Deployed {formatDate(selectedCommunity.createdAt)}</p>
            <h3>Deployment addresses</h3>
            <div className="detail-row">
              <span>Community Hub</span>
              <Address value={selectedCommunity.hub} />
            </div>
            <div className="detail-row">
              <span>Treasury</span>
              <Address value={selectedCommunity.treasury} />
            </div>
            <div className="detail-row">
              <span>Creator</span>
              <Address value={selectedCommunity.creator} />
            </div>
            <div className="detail-row">
              <span>Factory</span>
              <Address value={protocol.contracts[0].address} />
            </div>
            <h3>Recent indexed activity</h3>
            <div className="detail-row">
              <span>Members in latest sample</span>
              <strong>
                {data?.communityMembers.filter(
                  (item) => item.community.id === selectedCommunity.id,
                ).length ?? 0}
              </strong>
            </div>
            <div className="detail-row">
              <span>Proposals in latest sample</span>
              <strong>
                {data?.communityProposals.filter(
                  (item) => item.community.id === selectedCommunity.id,
                ).length ?? 0}
              </strong>
            </div>
            <div className="detail-row">
              <span>Execution plans in latest sample</span>
              <strong>
                {data?.communityExecutionPlans.filter(
                  (item) => item.community.id === selectedCommunity.id,
                ).length ?? 0}
              </strong>
            </div>
            <a
              className="primary-button drawer-cta"
              href={`${protocol.links.dapp}/v3/communities/${selectedCommunity.communityId}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in dApp <ArrowUpRight size={15} />
            </a>
          </aside>
        </div>
      )}
    </div>
  );
}

export function DeploymentsPage() {
  const { health, summary } = useProtocol();
  const [search, setSearch] = useState("");
  const [live, setLive] = useState<LiveContractState | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/contracts${refreshKey ? "?fresh=1" : ""}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? `HTTP ${response.status}`);
        return data as LiveContractState;
      })
      .then(setLive)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setLiveError(
            cause instanceof Error ? cause.message : "RPC unavailable",
          );
      });
    return () => controller.abort();
  }, [refreshKey]);

  const implementationRows = (live?.contracts ?? [])
    .filter((item) => item.implementation)
    .map((item) => ({
      label: `${item.label} implementation`,
      address: item.implementation!,
      group:
        protocol.contracts.find(
          (contract) =>
            contract.address.toLowerCase() === item.address.toLowerCase(),
        )?.group ?? "Shared",
      kind: "Implementation",
    }));
  const contracts = [
    ...protocol.contracts.map((item) => ({
      ...item,
      kind: "Proxy / contract",
    })),
    ...implementationRows,
  ].filter((item) =>
    `${item.label} ${item.address} ${item.group} ${item.kind}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="page-enter deployments-page">
      <PageTitle
        overline="VERIFIED REFERENCES"
        title="Deployment registry"
        description="Addresses, indexer endpoints and network information in one place."
        icon={ShieldCheck}
      />
      <div className="deployment-grid">
        <div className="deployment-feature">
          <p className="page-overline">ACTIVE NETWORK</p>
          <h2>Arc Testnet</h2>
          <strong>5,042,002</strong>
          <span>Chain ID · USDC native · Public testing</span>
          <div>
            <StateBadge
              label={health?.rpc.ok ? "RPC connected" : "Checking RPC"}
              tone={health?.rpc.ok ? "success" : "warning"}
            />
            <span>Head block {formatCount(health?.rpc.block)}</span>
          </div>
        </div>
        <div className="deployment-source-card">
          <div>
            <span className="metric-icon blue">
              <CircleDollarSign size={21} />
            </span>
            <strong>V2.3 Funding</strong>
            <p>
              Indexed block {formatCount(summary?.v2.data?._meta.block.number)}
            </p>
          </div>
          <a href={protocol.links.graphV2} target="_blank" rel="noreferrer">
            Graph Studio <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="deployment-source-card">
          <div>
            <span className="metric-icon violet">
              <Blocks size={21} />
            </span>
            <strong>V3.2 Communities</strong>
            <p>
              Indexed block {formatCount(summary?.v3.data?._meta.block.number)}
            </p>
          </div>
          <a href={protocol.links.graphV3} target="_blank" rel="noreferrer">
            Graph Studio <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
      <section className="surface-panel live-contract-panel">
        <SectionHeader
          eyebrow="DIRECT ONCHAIN READ"
          title="Live proxy state"
          description="Current implementation slots and pause switches, read directly from Arc RPC. A deployed address alone does not prove a contract is safe."
          action={
            <button
              className="ledger-tool"
              onClick={() => {
                setLive(null);
                setLiveError(null);
                setRefreshKey((value) => value + 1);
              }}
            >
              <RefreshCw size={14} /> Refresh chain state
            </button>
          }
        />
        {liveError ? (
          <ErrorPanel title="RPC read failed" detail={liveError} />
        ) : !live ? (
          <LoadingPanel text="Reading proxy storage and pause switches..." />
        ) : (
          <div className="live-contract-scroll">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>CONTRACT</th>
                  <th>IMPLEMENTATION (EIP-1967)</th>
                  <th>PAUSE STATE</th>
                  <th>READ RESULT</th>
                </tr>
              </thead>
              <tbody>
                {live.contracts.map((item) => (
                  <tr key={item.address}>
                    <td>
                      <strong>{item.label}</strong>
                    </td>
                    <td>
                      <Address value={item.implementation} />
                    </td>
                    <td>
                      {item.paused === null ? (
                        <span className="muted">Not exposed</span>
                      ) : (
                        <StateBadge
                          label={item.paused ? "Paused" : "Active"}
                          tone={item.paused ? "warning" : "success"}
                        />
                      )}
                    </td>
                    <td>
                      {item.error ? (
                        <span className="onchain-error" title={item.error}>
                          {item.error}
                        </span>
                      ) : (
                        <StateBadge
                          label={
                            item.implementation
                              ? "Verified read"
                              : "No implementation"
                          }
                          tone={item.implementation ? "success" : "warning"}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="surface-panel explorer-panel">
        <SectionHeader
          eyebrow="CANONICAL ADDRESSES"
          title="Contract directory"
          description="Proxy and contract addresses, plus current implementation addresses read live from EIP-1967 slots. Implementations update after proxy upgrades."
          action={
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search contracts..."
            />
          }
        />
        <DataTable
          key={search}
          headings={["CONTRACT", "LAYER", "TYPE", "ADDRESS", "EXPLORER"]}
        >
          {contracts.map((item) => (
            <tr key={item.address}>
              <td>
                <strong>{item.label}</strong>
              </td>
              <td>
                <StateBadge
                  label={item.group}
                  tone={item.group.startsWith("V3.2") ? "info" : "neutral"}
                />
              </td>
              <td className="muted">{item.kind}</td>
              <td>
                <Address value={item.address} showExternal={false} />
              </td>
              <td>
                <a
                  className="table-link"
                  href={`${protocol.links.explorer}/address/${item.address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View contract <ArrowUpRight size={14} />
                </a>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
      <div className="helper-callout">
        <Filter size={20} />
        <div>
          <strong>Public data sources</strong>
          <p>
            Both subgraphs run in Graph Studio. The overview refreshes every 3
            minutes; indexing can lag behind the chain head. Contract state is
            read separately from Arc RPC.
          </p>
        </div>
      </div>
    </div>
  );
}
