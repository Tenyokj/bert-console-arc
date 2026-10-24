# Contributing to BERT Console

BERT Console V0.1.0 Beta is a public read-only Arc Testnet tool. We welcome frontend, accessibility, QA, indexing and security contributions. It must never gain wallet-signing or fund-moving behavior without a separate design and security review.

## Before a pull request

1. Open an issue or describe the behavior and expected data source in your PR. For a display bug, include the route, chain block, subgraph block and relevant entity ID without sharing secrets.
2. Keep V2.3 and V3.2 entity namespaces separate. Label sample counts and indexer lag honestly; contract state and receipts remain authoritative for decisions.
3. Run `npm install`, `npm run format:check`, `npm run lint` and `npm run build`. With the app running locally, run `npm run smoke`. If you change a query, compare at least one result with the Graph Studio Playground or the deployed contract.
4. Include desktop and mobile screenshots for visual changes. Preserve reduced-motion and static-WebGL fallbacks.
5. Open a pull request against `arc-console-migration`. Do not push directly to the default branch.

Never commit `.env.local`, API/deploy keys, wallet private keys, PoP signer material or personally identifying test data. Use only public Arc Testnet endpoints in examples. Report vulnerabilities privately as described in [SECURITY.md](./SECURITY.md), not in public issues.
