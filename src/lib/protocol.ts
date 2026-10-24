export const monitoredProxies = [
  {
    label: "V3.2 CommunityFactory",
    address: "0xf793786BCecfbfE35a22E36180032b32BD5208Ba",
    group: "V3.2",
    pausable: false,
  },
  {
    label: "V3.1 CommunityFactory",
    address: "0xe16Cd61a21feA97393e6eEE3A7F7A26828021dD0",
    group: "V3.1",
    pausable: false,
  },
  {
    label: "V2 FundingPool",
    address: "0x5eDdccd772a9E0F079cC6646b529C20e3D46e585",
    group: "V2.3",
    pausable: true,
  },
  {
    label: "V2 VotingSystem",
    address: "0xD008fC96902A9680FF77305881Ad6C6C075e7a68",
    group: "V2.3",
    pausable: true,
  },
  {
    label: "V2 IdeaRegistry",
    address: "0xE6563acfdc194Ba3861EfD928Bd8B1B33a5D29d5",
    group: "V2.3",
    pausable: false,
  },
  {
    label: "V2 GrantManager",
    address: "0xA110baB4562d59d8bb7eDA4a05E53F40c678ccB2",
    group: "V2.3",
    pausable: true,
  },
  {
    label: "RolesRegistry",
    address: "0xf15c6213666EB4c09f594567DEf1345E2899BCC7",
    group: "Shared",
    pausable: false,
  },
  {
    label: "PoP Verifier",
    address: "0xb8E2CB14F99E1a17C3Eee5863272A7F6dAF3C62b",
    group: "Shared",
    pausable: false,
  },
  {
    label: "VoterProgression",
    address: "0xF6EB65957bb5e363FCD6B84AAdf76E41Ba754E14",
    group: "V2.3",
    pausable: false,
  },
  {
    label: "ReputationSystem",
    address: "0x3594C46983460733F6470f7b61De2f3bB2918a81",
    group: "V2.3",
    pausable: false,
  },
] as const;

export const protocol = {
  network: "Arc Testnet",
  chainId: 5_042_002,
  rpcUrl: process.env.BERT_ARC_RPC_URL ?? "https://arc-testnet.drpc.org",
  subgraphs: {
    v2:
      process.env.BERT_V2_SUBGRAPH_URL ??
      "https://api.studio.thegraph.com/query/1742046/bert-arc-testnet/v0.3.0",
    v3:
      process.env.BERT_V3_SUBGRAPH_URL ??
      "https://api.studio.thegraph.com/query/1742046/bert-v-3-1-arc-testnet/v3.2.0",
  },
  links: {
    explorer: "https://testnet.arcscan.app",
    dapp: "https://bertdao.vercel.app",
    docs: "https://bertdao-docs.vercel.app",
    core: "https://github.com/Tenyokj/bert-core-arc",
    consoleSource: "https://github.com/Tenyokj/bert-console-arc",
    graphV2: "https://thegraph.com/studio/subgraph/bert-arc-testnet",
    graphV3: "https://thegraph.com/studio/subgraph/bert-v-3-1-arc-testnet",
  },
  contracts: [
    ...monitoredProxies,
    {
      label: "V3.2 TreasuryDeployer",
      address: "0x374D742CC904edC4Dc09Bfd6BC941519969C1adf",
      group: "V3.2",
    },
    {
      label: "V3.2 MembershipModuleDeployer",
      address: "0x5196CC82fc05e6b4623c381a944a8D24b02984dd",
      group: "V3.2",
    },
    {
      label: "V3.2 ProposalModuleDeployer",
      address: "0x5286B45c3DA60F7341F3f0147163c6B42FeD01a3",
      group: "V3.2",
    },
    {
      label: "V3.2 VotingModuleDeployer",
      address: "0x9D6cef8dEC24ffea29ed1319ebc4E0d729DCe25F",
      group: "V3.2",
    },
    {
      label: "V3.2 MilestoneModuleDeployer",
      address: "0xB1D4A3d54a0E7bC1CCA66F973A08b25F99FD37bf",
      group: "V3.2",
    },
    {
      label: "V3.2 AdminActions library",
      address: "0x4755E0bc1CB4ffB958595d40A55d1F63862bC815",
      group: "V3.2",
    },
    {
      label: "Arc native USDC",
      address: "0x3600000000000000000000000000000000000000",
      group: "Shared",
    },
    {
      label: "V3.1 TreasuryDeployer",
      address: "0x009F80F6Eab73806655B10E2A5f42Ed3F2A9125b",
      group: "V3.1",
    },
    {
      label: "V3.1 MembershipModuleDeployer",
      address: "0x1bC3fe5821B88d4Dcf5253Ee860D21eCEe235010",
      group: "V3.1",
    },
    {
      label: "V3.1 ProposalModuleDeployer",
      address: "0xe7421a97D168825E048E29eb70196918d71c5a7D",
      group: "V3.1",
    },
    {
      label: "V3.1 VotingModuleDeployer",
      address: "0xb3f60c1dB662b1d62F9Aa7652F95B62D819FfA6d",
      group: "V3.1",
    },
    {
      label: "V3.1 MilestoneModuleDeployer",
      address: "0xdb7846846011792cf9c70391078a0399E8a91569",
      group: "V3.1",
    },
    {
      label: "V3.1 AdminActions library",
      address: "0x889A087A90cf711D86B208681ea8AfE668479303",
      group: "V3.1",
    },
    {
      label: "V3.0 LegacyFactory",
      address: "0x811fFb3B53d43e608Ee4dF854aa1BdC471F37589",
      group: "Legacy",
    },
  ],
} as const;

export type DataSource = "v2" | "v3";
