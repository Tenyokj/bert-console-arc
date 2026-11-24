"use client";

import { formatUnits } from "viem";
import "./treasury-readout.css";
import type { RevenueReceiver, TreasurySnapshot } from "@/lib/treasury-revenue";

const amount = (value: string | null) =>
  value === null
    ? "Not available on this deployment"
    : `${formatUnits(BigInt(value), 6)} USDC`;
const percent = (value: string) => `${Number(value) / 100}%`;
const when = (value: string) =>
  value === "0"
    ? "No scheduled change"
    : new Date(Number(value) * 1000).toLocaleString();

export function TreasuryReadout({
  snapshot: s,
  busy = false,
  onCollect,
  onRelease,
}: {
  snapshot: TreasurySnapshot;
  busy?: boolean;
  onCollect?: (receiver: RevenueReceiver) => void;
  onRelease?: (receiver: RevenueReceiver, payee: string) => void;
}) {
  const fields = [
    ["Actual USDC custody", s.actual],
    ["Recorded custody", s.accounted],
    ["Protocol reserve", s.reserve],
    ["Earned revenue awaiting collection", s.revenue],
    ["Other recorded funds", s.otherFunds],
    ["Unrecorded surplus", s.surplus],
    ["Custody shortfall", s.shortfall],
  ];
  return (
    <section className="revenue-panel" aria-label="Transparent treasury">
      <header>
        <p className="revenue-eyebrow">PINNED ONCHAIN ACCOUNTING</p>
        <h2>Transparent treasury</h2>
        <p>
          {s.mode === "v2.4"
            ? "V2.4 accounting detected"
            : "Legacy accounting: V2.4 revenue is not available on this deployment"}{" "}
          · Block {s.block} · Chain {s.chainId}
        </p>
        <code>{s.pool}</code>
      </header>
      {BigInt(s.shortfall) > 0n && (
        <p role="alert" className="revenue-warning">
          Custody shortfall detected. Do not treat recorded funds as available.
          Revenue collection is disabled.
        </p>
      )}
      <div className="revenue-grid">
        {fields.map(([label, value]) => (
          <article key={label}>
            <h3>{label}</h3>
            <strong>{amount(value)}</strong>
          </article>
        ))}
      </div>
      <p>
        Other recorded funds group bonds, pledges, grant/fee escrow and
        contributions; this is not a reconstructed historical category
        breakdown. Neither custody, reserve nor surplus is a team withdrawal
        allowance. Direct deposits create no investor shares or APY.
      </p>
      <p>
        Pool is {s.paused ? "paused: collection is unavailable" : "active"}.
        Already collected Treasury funds have a separate payout path.
      </p>
      {s.policy && (
        <div className="revenue-policy">
          <h3>Revenue settings for future rounds</h3>
          <p>
            Current Treasury: <code>{s.policy.treasury}</code> ·{" "}
            {percent(s.policy.shareBps)} of eligible earned success fees, not of
            pool custody.
          </p>
          <p>
            Scheduled Treasury: <code>{s.policy.scheduledTreasury}</code> ·{" "}
            {percent(s.policy.scheduledShareBps)} · Earliest activation:{" "}
            {when(s.policy.readyAt)}
          </p>
          <p>
            Onchain notice period: {Number(s.policy.delay) / 3600} hours.
            Existing rounds keep their own snapshots; activating settings does
            not rewrite them.
          </p>
        </div>
      )}
      {s.round && (
        <div className="revenue-policy">
          <h3>Round #{s.round.id} snapshot</h3>
          <p>
            Treasury: <code>{s.round.treasury}</code> · Share:{" "}
            {percent(s.round.shareBps)}
          </p>
          <p>
            Cumulative revenue accrued (including collected):{" "}
            {amount(s.round.accrued)} · Eligible fee base:{" "}
            {amount(s.round.eligibleFee)} · Total settlement fee:{" "}
            {amount(s.round.totalFee)}
          </p>
          <p>
            A zero snapshot can mean an old, revenue-disabled or unopened round;
            it does not prove that the round settled.
          </p>
        </div>
      )}
      {s.receivers.map((receiver) => (
        <article className="revenue-receiver" key={receiver.address}>
          <h3>Fixed-beneficiary Treasury</h3>
          <code>{receiver.address}</code>
          <p>
            Pending in FundingPool: {amount(receiver.pending)} · Held in
            Treasury: {amount(receiver.balance)} · Released:{" "}
            {amount(receiver.totalReleased)}
          </p>
          <p>
            Pool/token bindings and share totals were checked. These getters are
            not an independent bytecode audit. Direct Treasury donations follow
            the same beneficiary split and are not pool-earned revenue.
          </p>
          {onCollect && (
            <button
              type="button"
              disabled={
                busy ||
                s.paused ||
                BigInt(s.shortfall) > 0n ||
                receiver.pending === "0"
              }
              onClick={() => onCollect(receiver)}
            >
              Collect earned revenue to this Treasury
            </button>
          )}
          <div className="revenue-table">
            <table>
              <caption>
                Fixed beneficiaries ({receiver.payees.length}, maximum 16)
              </caption>
              <thead>
                <tr>
                  <th>Beneficiary</th>
                  <th>Fixed share</th>
                  <th>Paid</th>
                  <th>Payable now</th>
                  {onRelease && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {receiver.payees.map((payee) => (
                  <tr key={payee.address}>
                    <td>
                      <code>{payee.address}</code>
                    </td>
                    <td>{percent(payee.shareBps)}</td>
                    <td>{amount(payee.released)}</td>
                    <td>{amount(payee.releasable)}</td>
                    {onRelease && (
                      <td>
                        <button
                          type="button"
                          disabled={busy || payee.releasable === "0"}
                          onClick={() => onRelease(receiver, payee.address)}
                        >
                          Pay fixed beneficiary
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Anyone may relay collection or payment; funds go only to the bound
            Treasury or fixed beneficiary, never the caller by default. Issuer
            restrictions may prevent a payout.
          </p>
        </article>
      ))}
      {s.mode === "v2.4" && s.receivers.length === 0 && (
        <p>
          No nonzero Treasury in the current, scheduled or selected-round
          settings. Revenue may be disabled; inspect an older round to find its
          original Treasury.
        </p>
      )}
    </section>
  );
}
