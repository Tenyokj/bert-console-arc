import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { toFunctionSelector, zeroAddress } from "viem";

const source = readFileSync(new URL("../src/lib/treasury-revenue.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function("exports", "require", js)(api, createRequire(import.meta.url));
const pool = "0x1111111111111111111111111111111111111111";
const token = "0x2222222222222222222222222222222222222222";
const receiver = "0x3333333333333333333333333333333333333333";
const payee = "0x4444444444444444444444444444444444444444";
function fixture(modern = true) {
  const calls = [];
  let headers = 0;
  const values = {
    usdc: token, roles: pool, isPaused: false, totalPoolBalance: 1000n, protocolReserve: 100n,
    balanceOf: 1000n, decimals: 6, getTreasuryAccounting: [1000n, 1000n, 100n, 20n, 880n, 0n, 0n],
    revenueTreasury: receiver, revenueShareBps: 4000n, scheduledRevenueTreasury: zeroAddress,
    scheduledRevenueShareBps: 0n, revenuePolicyReadyAt: 0n, REVENUE_POLICY_DELAY: 172800n,
    fundingPool: pool, payeeCount: 1n, payeeAt: payee, shares: 10000n, released: 5n,
    releasable: 10n, totalReleased: 5n, pendingRevenueByTreasury: 20n,
    fundingRoundRevenue: [receiver, 4000n, 4n, 10n, 50n],
  };
  const client = {
    getChainId: async () => 5042002,
    getBlock: async () => { headers++; return { number: 99n, hash: "0x1234", timestamp: 200n }; },
    getStorageAt: async () => `0x${"0".repeat(64)}`,
    getCode: async () => modern ? toFunctionSelector("getTreasuryAccounting()") : "0x60006000",
    readContract: async (request) => {
      calls.push(request);
      if (request.functionName === "balanceOf" && request.args[0] === receiver) return 10n;
      if (!(request.functionName in values)) throw new Error("Unexpected method");
      const value = values[request.functionName];
      if (value instanceof Error) throw value;
      return value;
    },
  };
  return { client, values, calls, headers: () => headers };
}
test("legacy accounting never invents zero revenue or reads unsupported methods", async () => {
  const f = fixture(false); const s = await api.readTreasurySnapshot(f.client, pool, 5042002);
  assert.equal(s.mode, "legacy"); assert.equal(s.revenue, null); assert.equal(s.otherFunds, "900");
  assert.equal(s.policy, null); assert.equal(s.receivers.length, 0);
  assert(!f.calls.some((c) => c.functionName === "getTreasuryAccounting"));
  assert(f.calls.every((c) => c.blockNumber === 99n));
});
test("new accounting decodes exact amounts, fixed payees and old round snapshots", async () => {
  const f = fixture(); const s = await api.readTreasurySnapshot(f.client, pool, 5042002, 7n);
  assert.equal(s.revenue, "20"); assert.equal(s.otherFunds, "880"); assert.equal(s.round.id, "7");
  assert.equal(s.receivers[0].payees[0].releasable, "10"); assert.equal(f.headers(), 2);
  assert.equal(api.policyReady(s), false);
  s.policy.readyAt = "200"; assert.equal(api.policyReady(s), true);
  s.policy.readyAt = "201"; assert.equal(api.policyReady(s), false);
});
test("RPC failures and malformed modern tuples are not treated as legacy zero balances", async () => {
  const f = fixture(); f.values.getTreasuryAccounting = new Error("RPC offline");
  await assert.rejects(api.readTreasurySnapshot(f.client, pool, 5042002), /RPC offline/);
  f.values.getTreasuryAccounting = [0n];
  await assert.rejects(api.readTreasurySnapshot(f.client, pool, 5042002), /Invalid accounting tuple/);
  f.values.getTreasuryAccounting = [1000n, 1000n, 100n, 20n, 900n, 0n, 0n];
  await assert.rejects(api.readTreasurySnapshot(f.client, pool, 5042002), /disagrees/);
});
test("rejects mismatched Treasury bindings, excessive payee counts and invalid split", async () => {
  for (const [field, value] of [["fundingPool", receiver], ["payeeCount", 17n], ["shares", 9999n]]) {
    const f = fixture(); f.values[field] = value;
    await assert.rejects(api.readTreasurySnapshot(f.client, pool, 5042002));
  }
});
test("rejects wrong chain, unsupported token decimals and a changed pinned block", async () => {
  const f = fixture(); await assert.rejects(api.readTreasurySnapshot(f.client, pool, 31337), /chain mismatch/);
  f.values.decimals = 18;
  await assert.rejects(api.readTreasurySnapshot(f.client, pool, 5042002), /6-decimal/);
  const g = fixture(); let n = 0;
  g.client.getBlock = async () => ({ number: 99n, timestamp: 200n, hash: ++n === 1 ? "0x1234" : "0x5678" });
  await assert.rejects(api.readTreasurySnapshot(g.client, pool, 5042002), /block changed/);
});
test("zero current/scheduled policies can still discover a historical round Treasury", async () => {
  const f = fixture(); f.values.revenueTreasury = zeroAddress; f.values.revenueShareBps = 0n;
  const s = await api.readTreasurySnapshot(f.client, pool, 5042002, 7n);
  assert.equal(s.receivers[0].address, receiver);
  assert.equal(s.round.shareBps, "4000");
  await assert.rejects(api.readTreasurySnapshot(f.client, pool, 5042002, 0n), /Invalid round/);
});

