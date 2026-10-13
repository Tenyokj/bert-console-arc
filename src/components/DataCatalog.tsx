"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  ChevronRight,
  Copy,
  Database,
  FileSearch,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  datasetById,
  datasets,
  type Dataset,
  type DatasetColumn,
} from "@/lib/datasets";
import { copyText } from "@/lib/clipboard";
import {
  compactAddress,
  formatAmount,
  formatCount,
  formatDate,
} from "@/lib/format";
import { protocol } from "@/lib/protocol";
import {
  Address,
  EmptyPanel,
  ErrorPanel,
  Eyebrow,
  LoadingPanel,
  StateBadge,
} from "@/components/ui";

type RecordsResponse = {
  dataset: string;
  page: number;
  pageSize: number;
  records: Record<string, unknown>[];
  hasMore: boolean;
  block: number | null;
  hasIndexingErrors: boolean;
  query: string;
};

function getValue(record: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") return null;
    return (value as Record<string, unknown>)[part];
  }, record);
}

function printable(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ValueCell({
  value,
  column,
  record,
}: {
  value: unknown;
  column: DatasetColumn;
  record?: Record<string, unknown>;
}) {
  if (column.kind === "proposalMode")
    return <StateBadge label={value === 1 ? "Slate" : "Binary"} tone="info" />;
  if (
    record?.mode === 1 &&
    (column.key === "yesVotes" || column.key === "noVotes")
  )
    return (
      <span
        className="muted"
        title="Slate votes are assigned to candidates, not YES or NO"
      >
        Not applicable
      </span>
    );
  if (column.key === "settled" && record?.mode === 1)
    return (
      <span
        className="muted"
        title="This field tracks binary settlement; see the slate round status"
      >
        See slate round
      </span>
    );
  if (
    column.key === "executionAmount" &&
    record?.mode === 1 &&
    record.status !== "WonRound"
  )
    return (
      <span
        className="muted"
        title="Only the winning slate proposal receives an execution budget at settlement"
      >
        No execution budget
      </span>
    );
  if (column.key === "executionAmount" && record?.mode === 0 && !record.settled)
    return <span className="muted">Pending vote</span>;
  if (value === null || value === undefined || value === "")
    return <span className="muted">—</span>;
  const text = printable(value);
  if (column.kind === "address") return <Address value={text} />;
  if (column.kind === "tx") {
    return (
      <a
        className="ledger-tx"
        href={`${protocol.links.explorer}/tx/${text}`}
        target="_blank"
        rel="noreferrer"
        title={text}
      >
        {compactAddress(text, 9, 6)} <ArrowUpRight size={13} />
      </a>
    );
  }
  if (column.kind === "amount")
    return (
      <span className="ledger-amount">
        {formatAmount(text)} <small>USDC</small>
      </span>
    );
  if (column.kind === "count")
    return <span className="ledger-number">{formatCount(text)}</span>;
  if (column.kind === "date")
    return (
      <span className="ledger-date" title={formatDate(text)}>
        {formatDate(text)}
      </span>
    );
  if (column.kind === "boolean")
    return (
      <StateBadge
        label={value ? "Yes" : "No"}
        tone={value ? "success" : "neutral"}
      />
    );
  if (column.kind === "status")
    return (
      <StateBadge
        label={text}
        tone={
          /active|approved|executed|settled|finalized/i.test(text)
            ? "success"
            : "info"
        }
      />
    );
  return (
    <span className="ledger-text" title={text}>
      {text}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    const ok = await copyText(value);
    setState(ok ? "copied" : "failed");
    window.setTimeout(() => setState("idle"), 1700);
  };
  return (
    <button
      className="ledger-tool"
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={
        state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Copy failed"
            : `Copy ${label}`
      }
    >
      {state === "copied" ? <Check size={15} /> : <Copy size={15} />}
      <span>
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Failed"
            : `Copy ${label}`}
      </span>
    </button>
  );
}

function downloadCsv(dataset: Dataset, records: Record<string, unknown>[]) {
  const columns = dataset.columns;
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = [columns.map((column) => escape(column.label)).join(",")];
  for (const record of records) {
    lines.push(
      columns
        .map((column) => escape(printable(getValue(record, column.key))))
        .join(","),
    );
  }
  const url = URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `bert-${dataset.id}-${Date.now()}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function RecordDrawer({
  record,
  dataset,
  onClose,
}: {
  record: Record<string, unknown>;
  dataset: Dataset;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 240);
  };
  return (
    <div
      className={`ledger-drawer-backdrop ${closing ? "is-closing" : ""}`}
      onClick={dismiss}
    >
      <aside
        className="ledger-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Record inspector"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ledger-drawer-head">
          <div>
            <Eyebrow>RECORD INSPECTOR</Eyebrow>
            <h2>{dataset.label}</h2>
          </div>
          <button
            className="icon-button"
            onClick={dismiss}
            aria-label="Close record inspector"
          >
            <X size={18} />
          </button>
        </div>
        <p>
          Indexed on Arc Testnet. Values below are taken from the selected
          subgraph record.
        </p>
        <div className="ledger-drawer-tools">
          <CopyButton value={JSON.stringify(record, null, 2)} label="JSON" />
        </div>
        <div className="ledger-fields">
          {[
            {
              key: "id",
              label: "Record ID",
              kind: "text",
              select: "id",
            } as DatasetColumn,
            ...dataset.columns.filter((column) => column.key !== "id"),
          ].map((column) => {
            const value = getValue(record, column.key);
            return (
              <div className="ledger-field" key={column.key}>
                <span>{column.label}</span>
                <div>
                  <ValueCell value={value} column={column} record={record} />
                  {value !== null &&
                    value !== undefined &&
                    column.kind !== "address" &&
                    column.kind !== "tx" && (
                      <CopyButton
                        value={printable(value)}
                        label={column.label.toLowerCase()}
                      />
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function DatasetViewer({
  dataset,
  page,
  setPage,
}: {
  dataset: Dataset;
  page: number;
  setPage: (page: number) => void;
}) {
  const [response, setResponse] = useState<RecordsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(
    null,
  );
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/records?dataset=${dataset.id}&page=${page}${reload ? "&fresh=1" : ""}`,
      { signal: controller.signal },
    )
      .then(async (result) => {
        const data = await result.json();
        if (!result.ok) throw new Error(data.error ?? `HTTP ${result.status}`);
        return data as RecordsResponse;
      })
      .then(setResponse)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Request failed");
      });
    return () => controller.abort();
  }, [dataset.id, page, reload]);

  const records = response?.records ?? [];
  const filtered = records.filter((record) =>
    JSON.stringify(record).toLowerCase().includes(search.toLowerCase()),
  );
  const refresh = () => {
    setResponse(null);
    setError(null);
    setReload((value) => value + 1);
  };

  return (
    <section className="ledger-main surface-panel">
      <div className="ledger-dataset-head">
        <div>
          <Eyebrow>
            {dataset.source === "v2"
              ? "FUNDING LAYER · V2.3"
              : "COMMUNITY LAYER · V3.1"}
          </Eyebrow>
          <h2>
            {dataset.label}
            <span>.</span>
          </h2>
          <p>{dataset.description}</p>
        </div>
        <div className="ledger-head-stat">
          <span>INDEXED BLOCK</span>
          <strong>{formatCount(response?.block)}</strong>
        </div>
      </div>
      <div className="ledger-toolbar">
        <label className="ledger-search">
          <Search size={16} />
          <input
            aria-label="Search current page"
            placeholder="Search this page..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <span className="ledger-scope">
          <Filter size={13} /> Search applies to this page
        </span>
        <button
          className="ledger-tool"
          onClick={refresh}
          title="Fetch fresh indexed data"
        >
          <RefreshCw size={15} /> Refresh
        </button>
        <button
          className="ledger-tool"
          onClick={() => downloadCsv(dataset, filtered)}
          disabled={!filtered.length}
          title="Export visible rows only"
        >
          <ArrowDownToLine size={15} /> CSV
        </button>
      </div>
      {response?.hasIndexingErrors && (
        <div className="inline-alert">
          The indexer reports indexing errors. Verify records against Arc
          explorer.
        </div>
      )}
      {error ? (
        <ErrorPanel title="Could not read this dataset" detail={error} />
      ) : !response ? (
        <LoadingPanel
          text={`Loading ${dataset.label.toLowerCase()} from the indexer...`}
        />
      ) : filtered.length ? (
        <div className="ledger-table-scroll">
          <table className="ledger-table">
            <thead>
              <tr>
                {dataset.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>INSPECT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <tr key={printable(record.id) || index}>
                  {dataset.columns.map((column) => (
                    <td key={column.key}>
                      <ValueCell
                        value={getValue(record, column.key)}
                        column={column}
                        record={record}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className="ledger-inspect"
                      onClick={() => setSelected(record)}
                      aria-label={`Inspect record ${printable(record.id)}`}
                    >
                      <FileSearch size={16} />
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyPanel
          title={
            records.length
              ? "No matches on this page"
              : "No records indexed yet"
          }
          description={
            records.length
              ? "Clear the search or move to another page."
              : "This is a real empty result. Once the corresponding onchain action happens, records will appear here."
          }
        />
      )}
      <div className="ledger-bottom">
        <div>
          <strong>{filtered.length}</strong> visible · Page {page + 1} ·{" "}
          {response ? `Indexed to #${formatCount(response.block)}` : "Loading"}
        </div>
        <div className="ledger-bottom-actions">
          {response && <CopyButton value={response.query} label="GraphQL" />}
          <Link href={`/console?dataset=${dataset.id}`} className="ledger-tool">
            <Braces size={15} /> Query in Studio <ArrowUpRight size={13} />
          </Link>
          <button onClick={() => setPage(page - 1)} disabled={page === 0}>
            <ArrowLeft size={15} /> Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!response?.hasMore || page >= 199}
          >
            Next <ArrowRight size={15} />
          </button>
        </div>
      </div>
      {selected && (
        <RecordDrawer
          record={selected}
          dataset={dataset}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

export function DataCatalog() {
  const [selectedId, setSelectedId] = useState("v3-communities");
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    datasetById.get("v3-communities")?.group ?? null,
  );

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("dataset");
    if (!id || !datasetById.has(id)) return;
    const timeout = window.setTimeout(() => {
      setSelectedId(id);
      setExpandedGroup(datasetById.get(id)?.group ?? null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);
  const dataset =
    datasets.find((item) => item.id === selectedId) ?? datasets[0];
  const source = dataset.source;
  const available = datasets.filter(
    (item) =>
      item.source === source &&
      `${item.label} ${item.description} ${item.group}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  const groups = [...new Set(available.map((item) => item.group))];
  const select = (id: string) => {
    setSelectedId(id);
    setExpandedGroup(datasetById.get(id)?.group ?? null);
    setPage(0);
    setFilter("");
    window.history.replaceState(null, "", `/explore?dataset=${id}`);
  };

  return (
    <div className="page-enter ledger-page">
      <div className="ledger-hero">
        <div>
          <Eyebrow>THE COMPLETE INDEX</Eyebrow>
          <h1>
            Explore every layer<span>.</span>
          </h1>
          <p>
            Follow the full BERT event and state model, from funding pledges to
            community execution and validator decisions. Every row is indexed
            from Arc Testnet.
          </p>
        </div>
        <div className="ledger-hero-count">
          <Database size={29} />
          <strong>{datasets.length}</strong>
          <span>DATA COLLECTIONS</span>
        </div>
      </div>
      <div className="ledger-highlights">
        <div>
          <span>FUNDING · V2.3</span>
          <strong>
            {datasets.filter((item) => item.source === "v2").length}
          </strong>
          <small>collections</small>
        </div>
        <div>
          <span>COMMUNITY · V3.1</span>
          <strong>
            {datasets.filter((item) => item.source === "v3").length}
          </strong>
          <small>collections</small>
        </div>
        <div>
          <span>QUERY MODE</span>
          <strong>Live</strong>
          <small>read only</small>
        </div>
      </div>
      <div className="ledger-layout">
        <aside className="ledger-sidebar surface-panel">
          <div className="ledger-sidebar-top">
            <span>DATA CATALOG</span>
            <small>{datasets.length} indexed collections</small>
          </div>
          <div className="ledger-source-tabs">
            <button
              className={source === "v3" ? "active" : ""}
              onClick={() => select("v3-communities")}
            >
              V3.1 <span>Community</span>
            </button>
            <button
              className={source === "v2" ? "active" : ""}
              onClick={() => select("v2-ideas")}
            >
              V2.3 <span>Funding</span>
            </button>
          </div>
          <label className="ledger-sidebar-search">
            <Search size={15} />
            <input
              aria-label="Filter collections"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Find a collection..."
            />
          </label>
          <div className="ledger-menu">
            {groups.map((group) => (
              <div key={group}>
                <button
                  type="button"
                  className="ledger-group-toggle"
                  aria-expanded={!!filter || expandedGroup === group}
                  onClick={() => {
                    if (filter) setFilter("");
                    setExpandedGroup(
                      filter ? group : expandedGroup === group ? null : group,
                    );
                  }}
                >
                  <span>{group}</span>
                  <span>
                    {available.filter((item) => item.group === group).length}{" "}
                    <ChevronRight size={13} />
                  </span>
                </button>
                {(filter || expandedGroup === group) &&
                  available
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <button
                        key={item.id}
                        className={item.id === selectedId ? "active" : ""}
                        onClick={() => select(item.id)}
                      >
                        <span>{item.label}</span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
              </div>
            ))}
            {!available.length && (
              <p className="ledger-no-match">
                No collections match that search.
              </p>
            )}
          </div>
        </aside>
        <DatasetViewer
          key={`${dataset.id}-${page}`}
          dataset={dataset}
          page={page}
          setPage={setPage}
        />
      </div>
      <p className="ledger-disclaimer">
        Showing 25 records per page, ordered by the collection&apos;s latest
        indexed field. Search and CSV export apply to the current page; use
        Query Studio for custom filters and complete history.
      </p>
    </div>
  );
}
