![LOGO](/public/bert-console-banner.png)

# BERT Console

**V0.1.0 Beta · Arc Testnet · read-only**

- Console: [bertdao-console.vercel.app](https://bertdao-console.vercel.app)
- Source: [bert-console-arc](https://github.com/Tenyokj/bert-console-arc)
- Protocol dApp: [bertdao.vercel.app](https://bertdao.vercel.app)
- Developer docs: [BERT Console guide](https://bertdao-docs.vercel.app/#bert-console)

Public, read-only observability interface for BERT on Arc Testnet. It uses the existing V2.3 and V3.1 Graph Studio subgraphs plus an Arc RPC endpoint. It does not connect a wallet or submit transactions.

## Features

- Overview with protocol treasury, rounds, communities, recent proposals, funding-target and seven-day activity charts, a lifecycle map and indexer progress. The funding bars compare requested minimums from the latest 20 ideas; they do not show money raised. The activity bars count records from the loaded recent sample by UTC day, not all onchain events.
- V2.3 explorer for ideas, rounds, milestone requests and grant payouts.
- V3.1 explorer for communities, proposals, slate rounds, execution plans, reviews, members and withdrawals. Community details include Hub, Treasury and creator addresses.
- Full data explorer for 28 indexed collections across both versions, including votes, pledges, refunds, validation, treasury actions and module sources. Each collection has on-demand pages of 25, current-page search, record inspection, address/transaction links, CSV export and a prefilled Query Studio link.
- Deployment directory with canonical proxy/contract addresses and current implementation addresses read from EIP-1967 slots, explorer links and pause status for operational V2 proxies.
- Query Studio with starter queries, GraphQL formatting, JSON variables, `Ctrl/Command + Enter`, multi-collection table/JSON responses (20 rows per table page), copyable query and cURL, result export and local query history.
- Live source health with Arc head block and indexed blocks. Data refreshes every three minutes while the tab is visible; the refresh button requests fresh data immediately.

The overview deliberately labels limited lists as recent samples. The `Members` tab counts at most 40 latest membership records across **all** communities, not the protocol-wide number of unique members or the total for one community. The Funding, Communities and Deployments tables show six loaded records per page. Data Explorer requests indexed lists in server-side pages of 25; its search and CSV export apply to the current page. Use Query Studio for custom filters and full historical analysis.

In V3.1, `Binary yes/no` applies only to binary proposals. Slate votes are allocated to candidates: the Slate rounds tab shows total stake across candidates, the winning candidate's stake and the execution budget after settlement. Before settlement, budget is pending. The current subgraph exposes individual slate votes in Data Explorer; it does not provide an aggregate weight for every non-winning candidate in the proposal summary. The Communities tab loads only the latest 16 slate rounds, so use Data Explorer for older rounds.

## Data boundaries

The console is an indexed read model, not a block explorer, wallet, transaction relayer, security audit or real-time alerting service. A subgraph can lag the chain, and dashboard cards are labelled as recent samples when they are not all-time totals. Verify balances, permissions, settlement and transaction outcomes against contract state and receipts. All displayed assets are Arc Testnet assets without monetary value.

The current Graph Studio **development** URLs are limited to 3,000 queries per day. The shared dashboard uses short caches, but custom Query Studio requests are uncached and count individually. This beta is for testnet exploration, not high-volume public API traffic. There is no paid Graph plan or secret API key in this repository.

## Architecture

| Route | Purpose |
| --- | --- |
| `/api/summary` | Recent V2.3/V3.1 dashboard data with a shared cache. |
| `/api/health` | Arc RPC and both indexer head blocks. |
| `/api/records` | Paginated Graph collections for Data Explorer. |
| `/api/contracts` | Read-only proxy implementation and pause checks. |
| `/api/graphql` | Bounded, read-only GraphQL queries from Query Studio. |

UI routes are `/`, `/funding`, `/communities`, `/explore`, `/deployments` and `/console`. Source URLs and contract addresses are in `src/lib/protocol.ts`; page metadata, sitemap and robots point to `https://bertdao-console.vercel.app`.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The environment file is optional because safe public defaults are included.
You can also open the LAN URL printed by Next.js (for example, `http://192.168.0.105:3000`). The dev server automatically permits this machine's current local IPv4 addresses so its client scripts and live data work from other devices on the same network.

```bash
npm run lint
npm run build
npm run format:check
npm run smoke # run after starting the dev server in another terminal
```

The browser smoke test uses local Google Chrome on macOS by default. On other systems, set `BERT_CHROME_PATH` to a Chromium executable and optionally `BERT_CONSOLE_URL` to the running site URL. It covers desktop/mobile navigation, tables, Query Studio, exports and the Retina WebGL hero; it does not replace review of every indexed contract flow.

## Vercel

Import [bert-console-arc](https://github.com/Tenyokj/bert-console-arc) as a separate Next.js Vercel project with repository root as the Root Directory. Deploy the `arc-console-migration` branch after making it the repository's default and Vercel's Production Branch. The intended production address is `https://bertdao-console.vercel.app`; Vercel must confirm the assigned domain before announcing it as live. The three values in `.env.example` can be overridden in Production and Preview settings. They are public endpoint URLs, not keys.

After deployment, check `/`, `/communities`, `/explore`, `/console`, `/api/health`, `/robots.txt` and `/sitemap.xml` on the production domain. Confirm both indexers are online and a known Arc Testnet round has the expected amounts. Do not put deployment keys or wallet secrets in Vercel variables for this read-only project.

The dashboard uses short shared caches and a three-minute refresh cycle to respect Graph Studio's development endpoint limits. The on-demand explorer is cached for 60 seconds; live proxy state is cached for 120 seconds. For high public traffic, move the two indexers to production endpoints or add a dedicated cache before promoting this interface as a high-frequency monitoring service.

## Sources

- Arc Testnet RPC: `https://arc-testnet.drpc.org`
- V2.3: `https://api.studio.thegraph.com/query/1742046/bert-arc-testnet/v0.3.0`
- V3.1: `https://api.studio.thegraph.com/query/1742046/bert-v-3-1-arc-testnet/v3.1.0`
- Contract address references: [BERT Core deployment record](https://github.com/Tenyokj/bert-core-arc/blob/arc-usdc-migration/deployments/arc-testnet-v3.json)

This is testnet information and may lag behind the chain while the subgraphs index new blocks.

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution workflow and [SECURITY.md](./SECURITY.md) for private vulnerability reporting. BERT Console is licensed under [GPL-3.0](./LICENSE), like the other BERT repositories.
