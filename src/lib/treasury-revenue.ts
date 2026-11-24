import {
  type Abi,
  type Address,
  type PublicClient,
  getAddress,
  isAddress,
  parseAbi,
  toFunctionSelector,
  zeroAddress,
} from "viem";

export const revenuePoolAbi = parseAbi([
  "function usdc() view returns(address)",
  "function roles() view returns(address)",
  "function isPaused() view returns(bool)",
  "function totalPoolBalance() view returns(uint256)",
  "function protocolReserve() view returns(uint256)",
  "function getTreasuryAccounting() view returns(uint256 actual,uint256 accounted,uint256 reserve,uint256 revenue,uint256 otherFunds,uint256 surplus,uint256 shortfall)",
  "function revenueTreasury() view returns(address)",
  "function revenueShareBps() view returns(uint256)",
  "function scheduledRevenueTreasury() view returns(address)",
  "function scheduledRevenueShareBps() view returns(uint256)",
  "function revenuePolicyReadyAt() view returns(uint256)",
  "function REVENUE_POLICY_DELAY() view returns(uint256)",
  "function pendingRevenueByTreasury(address) view returns(uint256)",
  "function fundingRoundRevenue(uint256) view returns(address treasury,uint256 shareBps,uint256 accrued,uint256 eligibleFee,uint256 totalFee)",
  "function scheduleRevenuePolicy(address treasury,uint256 shareBps)",
  "function cancelRevenuePolicy()",
  "function executeRevenuePolicy()",
]);
export const revenueTreasuryAbi = parseAbi([
  "function fundingPool() view returns(address)",
  "function usdc() view returns(address)",
  "function payeeCount() view returns(uint256)",
  "function payeeAt(uint256) view returns(address)",
  "function shares(address) view returns(uint256)",
  "function released(address) view returns(uint256)",
  "function releasable(address) view returns(uint256)",
  "function totalReleased() view returns(uint256)",
  "function collect(uint256 amount)",
  "function release(address payee)",
]);
const tokenAbi = parseAbi([
  "function balanceOf(address) view returns(uint256)",
  "function decimals() view returns(uint8)",
]);
const implementationSlot =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export type RevenueReceiver = {
  address: Address;
  pending: string;
  balance: string;
  totalReleased: string;
  payees: {
    address: Address;
    shareBps: string;
    released: string;
    releasable: string;
  }[];
};
export type TreasurySnapshot = {
  pool: Address;
  token: Address;
  roles: Address;
  chainId: number;
  block: string;
  timestamp: string;
  mode: "legacy" | "v2.4";
  paused: boolean;
  actual: string;
  accounted: string;
  reserve: string;
  revenue: string | null;
  otherFunds: string;
  surplus: string;
  shortfall: string;
  policy: {
    treasury: Address;
    shareBps: string;
    scheduledTreasury: Address;
    scheduledShareBps: string;
    readyAt: string;
    delay: string;
  } | null;
  round: {
    id: string;
    treasury: Address;
    shareBps: string;
    accrued: string;
    eligibleFee: string;
    totalFee: string;
  } | null;
  receivers: RevenueReceiver[];
};
function uint(value: unknown): bigint {
  if (typeof value !== "bigint" || value < 0n)
    throw new Error("Invalid unsigned contract amount");
  return value;
}
function address(value: unknown): Address {
  if (typeof value !== "string" || !isAddress(value))
    throw new Error("Invalid contract address");
  return getAddress(value);
}
function tuple(value: unknown, length: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length !== length)
    throw new Error("Invalid accounting tuple");
  return value;
}
function check(ok: boolean, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function policyReady(snapshot: TreasurySnapshot) {
  return (
    snapshot.mode === "v2.4" &&
    !!snapshot.policy &&
    BigInt(snapshot.policy.readyAt) > 0n &&
    BigInt(snapshot.timestamp) >= BigInt(snapshot.policy.readyAt)
  );
}
export async function readTreasurySnapshot(
  client: PublicClient,
  pool: Address,
  expectedChainId: number,
  roundId?: bigint,
): Promise<TreasurySnapshot> {
  check((await client.getChainId()) === expectedChainId, "RPC chain mismatch");
  check(isAddress(pool) && pool !== zeroAddress, "FundingPool address missing");
  if (roundId !== undefined)
    check(roundId > 0n && roundId < 2n ** 256n, "Invalid round ID");
  const block = await client.getBlock();
  check(
    block.number !== null && !!block.hash,
    "Latest mined block unavailable",
  );
  const blockNumber = block.number;
  const read = (
    at: Address,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = [],
  ) =>
    client.readContract({ address: at, abi, functionName, args, blockNumber });
  const poolRead = (name: string, args: readonly unknown[] = []) =>
    read(pool, revenuePoolAbi, name, args);
  const [tokenRaw, rolesRaw, paused, totalRaw, reserveRaw, slot] =
    await Promise.all([
      poolRead("usdc"),
      poolRead("roles"),
      poolRead("isPaused"),
      poolRead("totalPoolBalance"),
      poolRead("protocolReserve"),
      client.getStorageAt({
        address: pool,
        slot: implementationSlot,
        blockNumber,
      }),
    ]);
  const token = address(tokenRaw);
  const roles = address(rolesRaw);
  const accounted = uint(totalRaw);
  const reserve = uint(reserveRaw);
  check(
    typeof paused === "boolean" && reserve <= accounted,
    "Invalid base pool accounting",
  );
  check(
    !!slot && /^0x[0-9a-fA-F]{64}$/.test(slot),
    "Implementation slot read failed",
  );
  const implementation = address(`0x${slot.slice(-40)}`);
  const runtime = await client.getCode({
    address: implementation === zeroAddress ? pool : implementation,
    blockNumber,
  });
  check(
    !!runtime && runtime !== "0x",
    "FundingPool implementation has no code",
  );
  // A dispatch hint, not code verification. A detected new getter must decode successfully.
  const modern = runtime
    .toLowerCase()
    .includes(toFunctionSelector("getTreasuryAccounting()").slice(2));
  const [actualRaw, decimals] = await Promise.all([
    read(token, tokenAbi, "balanceOf", [pool]),
    read(token, tokenAbi, "decimals"),
  ]);
  check(decimals === 6, "Expected 6-decimal USDC; refusing misleading amounts");
  const actual = uint(actualRaw);
  const snapshot: TreasurySnapshot = {
    pool,
    token,
    roles,
    chainId: expectedChainId,
    block: String(blockNumber),
    timestamp: String(block.timestamp),
    mode: modern ? "v2.4" : "legacy",
    paused: paused as boolean,
    actual: String(actual),
    accounted: String(accounted),
    reserve: String(reserve),
    revenue: null,
    otherFunds: String(accounted - reserve),
    surplus: String(actual > accounted ? actual - accounted : 0n),
    shortfall: String(actual < accounted ? accounted - actual : 0n),
    policy: null,
    round: null,
    receivers: [],
  };
  if (modern) {
    const accounting = tuple(await poolRead("getTreasuryAccounting"), 7).map(
      uint,
    );
    const [a, c, r, earned, other, surplus, shortfall] = accounting;
    check(
      a === actual &&
        c === accounted &&
        r === reserve &&
        r + earned + other === c &&
        String(surplus) === snapshot.surplus &&
        String(shortfall) === snapshot.shortfall,
      "Accounting getter disagrees with pinned custody",
    );
    snapshot.revenue = String(earned);
    snapshot.otherFunds = String(other);
    const values = await Promise.all(
      [
        "revenueTreasury",
        "revenueShareBps",
        "scheduledRevenueTreasury",
        "scheduledRevenueShareBps",
        "revenuePolicyReadyAt",
        "REVENUE_POLICY_DELAY",
      ].map((name) => poolRead(name)),
    );
    const [
      treasury,
      shareBps,
      scheduledTreasury,
      scheduledShareBps,
      readyAt,
      delay,
    ] = [
      address(values[0]),
      uint(values[1]),
      address(values[2]),
      uint(values[3]),
      uint(values[4]),
      uint(values[5]),
    ] as const;
    check(
      shareBps <= 10000n &&
        scheduledShareBps <= 10000n &&
        (treasury === zeroAddress) === (shareBps === 0n) &&
        (scheduledTreasury === zeroAddress) === (scheduledShareBps === 0n),
      "Invalid revenue policy",
    );
    snapshot.policy = {
      treasury,
      shareBps: String(shareBps),
      scheduledTreasury,
      scheduledShareBps: String(scheduledShareBps),
      readyAt: String(readyAt),
      delay: String(delay),
    };
    if (roundId !== undefined) {
      const round = tuple(await poolRead("fundingRoundRevenue", [roundId]), 5);
      check(
        uint(round[1]) <= 10000n && uint(round[3]) <= uint(round[4]),
        "Invalid round revenue snapshot",
      );
      snapshot.round = {
        id: String(roundId),
        treasury: address(round[0]),
        shareBps: String(round[1]),
        accrued: String(round[2]),
        eligibleFee: String(round[3]),
        totalFee: String(round[4]),
      };
    }
    const receivers = [
      ...new Set([
        treasury,
        scheduledTreasury,
        snapshot.round?.treasury ?? zeroAddress,
      ]),
    ].filter((value) => value !== zeroAddress);
    for (const receiver of receivers) {
      const tr = (name: string, args: readonly unknown[] = []) =>
        read(receiver, revenueTreasuryAbi, name, args);
      const [boundPool, boundToken, countRaw, pending, balance, totalReleased] =
        await Promise.all([
          tr("fundingPool"),
          tr("usdc"),
          tr("payeeCount"),
          poolRead("pendingRevenueByTreasury", [receiver]),
          read(token, tokenAbi, "balanceOf", [receiver]),
          tr("totalReleased"),
        ]);
      check(
        address(boundPool) === getAddress(pool) &&
          address(boundToken) === token,
        "Treasury pool/token mismatch",
      );
      const count = uint(countRaw);
      check(
        count > 0n && count <= 16n,
        "Treasury payee count outside supported bound",
      );
      const payees: RevenueReceiver["payees"] = [];
      for (let index = 0n; index < count; index++) {
        const payee = address(await tr("payeeAt", [index]));
        check(
          payee !== zeroAddress && !payees.some((p) => p.address === payee),
          "Invalid/duplicate payee",
        );
        const [shares, released, releasable] = await Promise.all([
          tr("shares", [payee]),
          tr("released", [payee]),
          tr("releasable", [payee]),
        ]);
        check(uint(shares) > 0n, "Zero payee share");
        payees.push({
          address: payee,
          shareBps: String(shares),
          released: String(uint(released)),
          releasable: String(uint(releasable)),
        });
      }
      check(
        payees.reduce((sum, p) => sum + BigInt(p.shareBps), 0n) === 10000n,
        "Payee shares do not sum to 100%",
      );
      check(
        payees.reduce((sum, p) => sum + BigInt(p.released), 0n) ===
          uint(totalReleased) &&
          payees.reduce((sum, p) => sum + BigInt(p.releasable), 0n) <=
            uint(balance),
        "Treasury beneficiary ledger disagrees with balances",
      );
      snapshot.receivers.push({
        address: receiver,
        pending: String(uint(pending)),
        balance: String(uint(balance)),
        totalReleased: String(uint(totalReleased)),
        payees,
      });
    }
    check(
      snapshot.receivers.reduce(
        (sum, receiver) => sum + BigInt(receiver.pending),
        0n,
      ) <= earned,
      "Receiver credits exceed total pending revenue",
    );
  }
  check(
    (await client.getBlock({ blockNumber })).hash === block.hash,
    "Snapshot block changed; refresh required",
  );
  return snapshot;
}
