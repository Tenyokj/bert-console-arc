# Dependency Security Update - 2026-10-24

## Scope

- Next.js and eslint-config-next: resolved 16.4.0 -> pinned 16.4.3.
- Resolved sharp: 0.35.5. React, protocol addresses, RPC and subgraph configuration are unchanged.
- Install used `npm install --ignore-scripts --no-fund`, not `npm audit fix --force`.

Relevant Next.js advisories include [image optimization RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
and [typed-array cache RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr).

## Verification

- `npm audit`: 1 critical before, 0 vulnerabilities after.
- `npm run lint` and `npm run build`: passed on Next.js 16.4.3.
- `BERT_CONSOLE_URL=http://127.0.0.1:3411 npm run smoke`: passed against the local
  production server, including desktop/mobile layout, live indexed data, navigation,
  GraphQL queries, exports, copy controls and the existing mocked pagination case.
- The smoke test selects a winning proposal's row rather than assuming proposal
  ID 2 is unique across Communities, and compares its displayed weight with its round.
- No on-chain transaction was submitted. This is not full protocol E2E or an audit.

## Release

Merge into `arc-console-migration` and deploy that commit on Vercel. The currently
published Console is not patched merely by changing these local files.
Repeat the read-only smoke check against the deployed URL. Zero npm findings is
a dated dependency result, not proof that the application has no security defects.
