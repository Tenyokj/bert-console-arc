"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  ChevronRight,
  CircleDollarSign,
  Code2,
  Database,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useProtocol } from "@/components/ProtocolProvider";

const HeroLogo3D = dynamic(() => import("@/components/HeroLogo3D"), {
  ssr: false,
});
import {
  Amount,
  EmptyPanel,
  Eyebrow,
  ErrorPanel,
  LoadingPanel,
  SectionHeader,
  StateBadge,
} from "@/components/ui";
import {
  formatAmount,
  formatCount,
  formatDate,
  relativeTime,
} from "@/lib/format";
import { protocol } from "@/lib/protocol";

export function Dashboard() {
  const { health, summary, loading, error } = useProtocol();
  const v2 = summary?.v2.data;
  const v3 = summary?.v3.data;
  const healthy = !!health && health.rpc.ok && health.v2.ok && health.v3.ok;
  const latestProposals = v3?.communityProposals.slice(0, 4) ?? [];
  const latestIdeas = v2?.ideas.slice(0, 4) ?? [];
  const capitalTargets = [...(v2?.ideas ?? [])]
    .sort((a, b) => {
      const left = BigInt(a.minimumNetFunding);
      const right = BigInt(b.minimumNetFunding);
      return left === right ? 0 : left > right ? -1 : 1;
    })
    .slice(0, 5);
  const largestTarget = capitalTargets.reduce((largest, idea) => {
    const target = BigInt(idea.minimumNetFunding);
    return target > largest ? target : largest;
  }, 1n);
  const now = summary
    ? new Date(summary.checkedAt)
    : new Date("2026-01-01T00:00:00Z");
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - 6 + index);
    const key = date.toISOString().slice(0, 10);
    const ideas = (v2?.ideas ?? []).filter(
      (item) =>
        new Date(Number(item.createdAt) * 1000).toISOString().slice(0, 10) ===
        key,
    ).length;
    const proposals = (v3?.communityProposals ?? []).filter(
      (item) =>
        new Date(Number(item.createdAt) * 1000).toISOString().slice(0, 10) ===
        key,
    ).length;
    return {
      key,
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      ideas,
      proposals,
    };
  });
  const peakDay = Math.max(
    1,
    ...recentDays.map((day) => day.ideas + day.proposals),
  );

  return (
    <div className="page-enter">
      <section className="overview-hero">
        <div className="hero-copy">
          <Eyebrow>THE PUBLIC PROTOCOL VIEW</Eyebrow>
          <h1>
            Every move.
            <br />
            <em>In the open.</em>
          </h1>
          <p>
            Follow BERT&apos;s funding rounds, community governance and
            execution milestones as they appear on Arc Testnet.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/explore">
              Explore all data <ArrowRight size={16} />
            </Link>
            <Link className="secondary-button" href="/console">
              Open Query Studio <Code2 size={16} />
            </Link>
          </div>
          <div className="hero-proof">
            <span className={healthy ? "small-dot ok" : "small-dot"} />
            {healthy
              ? "All data sources connected"
              : health
                ? "Some sources need attention"
                : "Connecting to Arc Testnet"}
            <i />
            Auto refresh every 3 min
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <HeroLogo3D />
          <div className="art-chip top">
            <Network size={15} /> ARC <strong>5042002</strong>
          </div>
          <div className="art-chip bottom">
            <Activity size={15} /> BLOCK{" "}
            <strong>{formatCount(health?.rpc.block)}</strong>
          </div>
          <span className="art-spark one" />
          <span className="art-spark two" />
          <span className="art-spark three" />
        </div>
      </section>

      {error && (
        <div className="inline-alert">Could not refresh all data: {error}</div>
      )}
      <section className="stats-grid" aria-label="Protocol metrics">
        <div className="metric-card">
          <div className="metric-top">
            <span>V2.3 / FUNDING</span>
            <span className="metric-icon blue">
              <CircleDollarSign size={18} />
            </span>
          </div>
          <strong>
            {v2?.protocolStats ? (
              <Amount value={v2.protocolStats.totalTreasury} />
            ) : (
              "—"
            )}
          </strong>
          <p>Indexed protocol treasury</p>
          <div className="metric-bottom">
            <TrendingUp size={14} />{" "}
            {formatCount(v2?.protocolStats?.totalIdeas)} ideas created
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span>V2.3 / ROUNDS</span>
            <span className="metric-icon violet">
              <Layers3 size={18} />
            </span>
          </div>
          <strong>{formatCount(v2?.protocolStats?.totalRounds)}</strong>
          <p>Total funding rounds</p>
          <div className="metric-bottom">
            <span className="small-dot ok" />{" "}
            {formatCount(v2?.protocolStats?.activeRounds)} active now
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span>V3.1 / COMMUNITIES</span>
            <span className="metric-icon cyan">
              <Blocks size={18} />
            </span>
          </div>
          <strong>{v3 ? formatCount(v3.communities.length) : "—"}</strong>
          <p>
            Indexed communities
            {v3?.communities.length === 1000 ? " (first 1,000)" : ""}
          </p>
          <div className="metric-bottom">
            <span className="small-dot ok" />{" "}
            {v3 ? v3.communities.filter((item) => item.active).length : "—"}{" "}
            active
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span>V3.1 / EXECUTION</span>
            <span className="metric-icon pink">
              <ShieldCheck size={18} />
            </span>
          </div>
          <strong>
            {v3 ? formatCount(v3.communityExecutionPlans.length) : "—"}
          </strong>
          <p>Recent execution plans</p>
          <div className="metric-bottom">
            <Sparkles size={14} /> Supporter reviewed
          </div>
        </div>
      </section>

      <div className="analytics-grid">
        <section className="surface-panel analytics-panel">
          <SectionHeader
            eyebrow="CAPITAL LANDSCAPE"
            title="Requested funding"
            description="Five largest minimum funding requirements in the 20 recently loaded ideas. Bar length compares requests, not money raised."
            action={
              <Link href="/explore?dataset=v2-ideas" className="subtle-link">
                Explore ideas <ChevronRight size={15} />
              </Link>
            }
          />
          {capitalTargets.length ? (
            <div className="capital-chart">
              {capitalTargets.map((idea) => {
                const target = BigInt(idea.minimumNetFunding);
                const percent = target
                  ? Number((target * 10_000n) / largestTarget) / 100
                  : 0;
                return (
                  <div className="capital-row" key={idea.id}>
                    <div>
                      <strong title={idea.title}>{idea.title}</strong>
                      <span>{formatAmount(idea.minimumNetFunding)} USDC</span>
                    </div>
                    <div
                      className="capital-track"
                      role="img"
                      aria-label={`${idea.title}: ${formatAmount(idea.minimumNetFunding)} USDC requested, ${percent}% of the largest request`}
                    >
                      <span
                        style={{ width: `${percent}%` }}
                        title={`${idea.title}: ${formatAmount(idea.minimumNetFunding)} USDC`}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="capital-scale">
                <span>0</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100% of largest request</span>
              </div>
            </div>
          ) : (
            <EmptyPanel
              title="No funding targets yet"
              description="Idea thresholds appear when ideas are indexed."
            />
          )}
        </section>
        <section className="surface-panel analytics-panel">
          <SectionHeader
            eyebrow="RECENT INDEXED WRITES"
            title="Recent creation activity"
            description={`UTC daily counts from the latest ${v2?.ideas.length ?? 0} ideas and ${v3?.communityProposals.length ?? 0} proposals loaded here. This is a sample, not all onchain events.`}
            action={
              <Link href="/explore" className="subtle-link">
                Full index <ChevronRight size={15} />
              </Link>
            }
          />
          <div className="activity-legend">
            <span>
              <i className="ideas" /> Ideas
            </span>
            <span>
              <i className="proposals" /> Proposals
            </span>
          </div>
          <div className="activity-chart">
            {recentDays.map((day) => (
              <div
                className="activity-day"
                key={day.key}
                title={`${day.key}: ${day.ideas} ideas, ${day.proposals} proposals`}
                role="img"
                aria-label={`${day.key}: ${day.ideas} ideas and ${day.proposals} proposals in the loaded sample`}
              >
                <div className="activity-columns">
                  <span
                    className="ideas"
                    style={{ height: `${(day.ideas / peakDay) * 100}%` }}
                  />
                  <span
                    className="proposals"
                    style={{ height: `${(day.proposals / peakDay) * 100}%` }}
                  />
                </div>
                <small>{day.label}</small>
                <span className="activity-value">
                  {day.ideas + day.proposals}
                </span>
              </div>
            ))}
          </div>
          <p className="chart-note">
            Each bar is a record count for that UTC day. Empty bars mean no
            records in this sample, not necessarily zero activity onchain.
          </p>
        </section>
      </div>

      <section className="surface-panel protocol-map">
        <SectionHeader
          eyebrow="SYSTEM COVERAGE"
          title="Follow the full lifecycle"
          description="Jump from a high-level signal to the underlying indexed records."
          action={
            <Link href="/explore" className="subtle-link">
              All 28 collections <ChevronRight size={15} />
            </Link>
          }
        />
        <div className="protocol-map-grid">
          {[
            {
              number: "01",
              title: "Funding & ideas",
              detail: `${formatCount(v2?.protocolStats?.totalIdeas)} ideas published`,
              href: "/explore?dataset=v2-ideas",
            },
            {
              number: "02",
              title: "Votes & pledges",
              detail: `${formatCount(v2?.protocolStats?.totalRounds)} rounds indexed`,
              href: "/explore?dataset=v2-pledges",
            },
            {
              number: "03",
              title: "Grant execution",
              detail: `${formatCount(v2?.grantPayouts.length)} recent payouts`,
              href: "/explore?dataset=v2-grants",
            },
            {
              number: "04",
              title: "Community votes",
              detail: `${formatCount(v3?.communityProposals.length)} recent proposals`,
              href: "/explore?dataset=v3-proposals",
            },
            {
              number: "05",
              title: "Milestone reviews",
              detail: `${formatCount(v3?.communityMilestoneReviews.length)} recent reviews`,
              href: "/explore?dataset=v3-milestones",
            },
            {
              number: "06",
              title: "Treasury & validation",
              detail: `${formatCount(v3?.communityWithdrawals.length)} recent withdrawals`,
              href: "/explore?dataset=v3-withdrawals",
            },
          ].map((item) => (
            <Link
              href={item.href}
              className="protocol-map-item"
              key={item.number}
            >
              <span>{item.number}</span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </div>
      </section>

      <div className="overview-grid">
        <section className="surface-panel">
          <SectionHeader
            eyebrow="LIVE INDEXERS"
            title="Network pulse"
            description="Latest blocks reported by Arc and both BERT subgraphs."
            action={
              <Link href="/deployments" className="subtle-link">
                View deployments <ChevronRight size={15} />
              </Link>
            }
          />
          <div className="source-list">
            {(
              [
                {
                  key: "rpc",
                  label: "Arc Testnet RPC",
                  sub: "Canonical chain head",
                  icon: Network,
                },
                {
                  key: "v2",
                  label: "Funding indexer",
                  sub: "V2.3 · Graph Studio",
                  icon: CircleDollarSign,
                },
                {
                  key: "v3",
                  label: "Community indexer",
                  sub: "V3.1 · Graph Studio",
                  icon: Blocks,
                },
              ] as const
            ).map(({ key, label, sub, icon: Icon }) => {
              const source = health?.[key];
              const lag =
                key !== "rpc" &&
                health?.rpc.block != null &&
                source?.block != null
                  ? Math.max(0, health.rpc.block - source.block)
                  : null;
              return (
                <div className="source-row" key={key}>
                  <span className="source-icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </div>
                  <div className="source-right">
                    <StateBadge
                      label={
                        source
                          ? source.ok
                            ? "Connected"
                            : "Unavailable"
                          : "Checking"
                      }
                      tone={source?.ok ? "success" : "warning"}
                    />
                    <span>
                      Block {formatCount(source?.block)}
                      {lag !== null && <i> · {formatCount(lag)} behind</i>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="surface-panel activity-panel">
          <SectionHeader
            eyebrow="LATEST V3.1"
            title="Community activity"
            description="Recent proposals from the Community Layer."
            action={
              <Link href="/communities" className="subtle-link">
                See all <ChevronRight size={15} />
              </Link>
            }
          />
          {loading ? (
            <LoadingPanel />
          ) : summary?.v3.error ? (
            <ErrorPanel
              title="Community indexer unavailable"
              detail={summary.v3.error}
            />
          ) : latestProposals.length ? (
            <div className="timeline">
              {latestProposals.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{item.community.name}</strong>
                    <p>
                      Proposal #{item.proposalId} · {item.status}
                    </p>
                    <small title={formatDate(item.updatedAt)}>
                      {relativeTime(item.updatedAt)}
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No proposals yet"
              description="Community activity will appear here after proposals are indexed."
            />
          )}
        </section>
      </div>

      <section className="surface-panel idea-panel">
        <SectionHeader
          eyebrow="FUNDING LAYER"
          title="Latest ideas"
          description="Explore proposals recorded by the V2.3 indexer."
          action={
            <Link href="/funding" className="subtle-link">
              Explore funding <ChevronRight size={15} />
            </Link>
          }
        />
        {loading ? (
          <LoadingPanel />
        ) : summary?.v2.error ? (
          <ErrorPanel
            title="Funding indexer unavailable"
            detail={summary.v2.error}
          />
        ) : latestIdeas.length ? (
          <div className="idea-tiles">
            {latestIdeas.map((idea, index) => (
              <div className="idea-tile" key={idea.id}>
                <span className="tile-number">0{index + 1}</span>
                <strong>{idea.title}</strong>
                <p>
                  Idea #{idea.id} · {formatCount(idea.totalVotes)} votes
                </p>
                <span className="idea-min">
                  MINIMUM <Amount value={idea.minimumNetFunding} />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel
            title="No ideas indexed"
            description="Create an idea in the dApp to see it here."
          />
        )}
      </section>

      <section className="cta-strip">
        <div>
          <Eyebrow>BUILT FOR OPEN VERIFICATION</Eyebrow>
          <h2>
            Don&apos;t just watch.
            <br />
            Ask the data.
          </h2>
          <p>
            Use templates or write your own GraphQL query across both versions.
          </p>
        </div>
        <Link href="/console">
          Launch Query Studio <ArrowUpRight size={18} />
        </Link>
        <div className="strip-code" aria-hidden="true">
          {
            "{\n  communities(first: 10) {\n    name\n    active\n    treasury\n  }\n}"
          }
        </div>
      </section>
      <Link href="/explore" className="coverage-link">
        <span className="coverage-link-icon">
          <Database size={20} />
        </span>
        <span>
          <strong>Go deeper into the protocol</strong>
          <small>
            Browse all 28 indexed V2.3 and V3.1 collections with filters,
            pagination and export.
          </small>
        </span>
        <ArrowRight size={19} />
      </Link>
      <div className="page-end-link">
        <a href={protocol.links.docs} target="_blank" rel="noreferrer">
          How BERT works <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  );
}
