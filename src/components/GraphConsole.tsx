"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import Link from "next/link";
import { parse, print } from "graphql";
import {
  ArrowRight,
  Braces,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  Download,
  FileJson2,
  History,
  Layers3,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
  Terminal,
  Trash2,
} from "lucide-react";
import type { DataSource } from "@/lib/protocol";
import { useProtocol } from "@/components/ProtocolProvider";
import { Eyebrow } from "@/components/ui";
import { queryPresets } from "@/lib/queryPresets";
import { copyText } from "@/lib/clipboard";
import { buildDatasetQuery, datasetById } from "@/lib/datasets";

type HistoryItem = {
  id: string;
  source: DataSource;
  query: string;
  variables: string;
  at: number;
  duration: number;
  ok: boolean;
};
const STORAGE_KEY = "bert-console-history-v1";
const initialPreset = queryPresets[0];

function ResultTable({ data }: { data: unknown }) {
  const [selectedKey, setSelectedKey] = useState("");
  const [page, setPage] = useState(0);
  if (!data || typeof data !== "object")
    return <div className="response-empty">No structured data to show.</div>;
  const entries = Object.entries(data as Record<string, unknown>);
  const collections = entries.filter(
    ([key, value]) => key !== "_meta" && value && typeof value === "object",
  );
  const selectedEntry =
    collections.find(([key]) => key === selectedKey) ?? collections[0];
  if (!selectedEntry)
    return (
      <div className="response-empty">
        This response has no list. Switch to JSON view.
      </div>
    );
  const values = Array.isArray(selectedEntry[1])
    ? selectedEntry[1]
    : [selectedEntry[1]];
  const rows = values.filter(
    (row): row is Record<string, unknown> =>
      !!row && typeof row === "object" && !Array.isArray(row),
  );
  if (!rows.length)
    return (
      <div className="response-empty">
        The <code>{selectedEntry[0]}</code> result is empty.
      </div>
    );
  const columns = Object.keys(rows[0]);
  const pageSize = 20;
  const lastPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  return (
    <div className="result-table-wrap">
      {collections.length > 1 && (
        <div className="result-collections" aria-label="Result collections">
          {collections.map(([key, value]) => (
            <button
              key={key}
              className={selectedEntry[0] === key ? "active" : ""}
              aria-pressed={selectedEntry[0] === key}
              onClick={() => {
                setSelectedKey(key);
                setPage(0);
              }}
            >
              {key}
              <span>{Array.isArray(value) ? value.length : 1}</span>
            </button>
          ))}
        </div>
      )}
      <div className="result-table-heading">
        <strong>{selectedEntry[0]}</strong>
        <span>
          {rows.length} returned rows · showing{" "}
          {Math.min(pageSize, rows.length)} per page
        </span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((row, index) => (
              <tr key={currentPage * pageSize + index}>
                {columns.map((column) => (
                  <td key={column}>
                    {typeof row[column] === "object" && row[column] !== null
                      ? JSON.stringify(row[column])
                      : String(row[column] ?? "null")}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      <div className="table-pagination">
        <span>
          {rows.length
            ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, rows.length)}`
            : "0"}{" "}
          of {rows.length} returned rows
        </span>
        <div>
          <button
            type="button"
            aria-label="Previous result page"
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
            aria-label="Next result page"
            disabled={currentPage >= lastPage}
            onClick={() => setPage(currentPage + 1)}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function GraphConsole() {
  const { health } = useProtocol();
  const [source, setSource] = useState<DataSource>(initialPreset.source);
  const [query, setQuery] = useState(initialPreset.query);
  const [variables, setVariables] = useState("{}");
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [view, setView] = useState<"json" | "table">("json");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [copiedTool, setCopiedTool] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem(STORAGE_KEY) ?? "[]",
        );
        if (Array.isArray(saved)) setHistory(saved.slice(0, 12));
      } catch {
        /* Storage may be disabled or contain stale data. */
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("dataset");
    const dataset = id ? datasetById.get(id) : null;
    if (!dataset) return;
    const timeout = window.setTimeout(() => {
      setSource(dataset.source);
      setQuery(buildDatasetQuery(dataset));
      setVariables("{}");
      setView("json");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const saveHistory = (item: HistoryItem) => {
    const updated = [item, ...history].slice(0, 12);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      /* Storage may be disabled. */
    }
  };

  const selectPreset = (id: string) => {
    const preset = queryPresets.find((item) => item.id === id);
    if (!preset) return;
    setSource(preset.source);
    setQuery(preset.query);
    setVariables("{}");
    setError(null);
    setResult(null);
    setResultText("");
    setDuration(null);
    setView("json");
  };

  const run = async (event?: FormEvent) => {
    event?.preventDefault();
    if (running) return;
    let parsedVariables: Record<string, unknown>;
    try {
      parse(query);
      const value: unknown = JSON.parse(variables);
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Variables must be a JSON object.");
      parsedVariables = value as Record<string, unknown>;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid query");
      return;
    }
    setRunning(true);
    setError(null);
    const started = performance.now();
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, query, variables: parsedVariables }),
      });
      const body: unknown = await response.json();
      const elapsed = Math.round(performance.now() - started);
      setDuration(elapsed);
      setResult(body);
      setResultText(JSON.stringify(body, null, 2));
      const graphErrors =
        body && typeof body === "object" && "errors" in body
          ? (body as { errors?: { message: string }[] }).errors
          : null;
      const requestError =
        body && typeof body === "object" && "error" in body
          ? String((body as { error: unknown }).error)
          : null;
      if (!response.ok || graphErrors?.length || requestError)
        setError(
          graphErrors?.[0]?.message ??
            requestError ??
            `Request failed: HTTP ${response.status}`,
        );
      saveHistory({
        id: `${Date.now()}`,
        source,
        query,
        variables,
        at: Date.now(),
        duration: elapsed,
        ok: response.ok && !graphErrors?.length && !requestError,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setRunning(false);
    }
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void run();
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      setQuery(query.slice(0, start) + "  " + query.slice(end));
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  const formatQuery = () => {
    try {
      setQuery(print(parse(query)).trim());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid query");
    }
  };
  const copyResult = async () => {
    if (!resultText) return;
    const success = await copyText(resultText);
    setCopied(success);
    setCopyError(!success);
    window.setTimeout(() => {
      setCopied(false);
      setCopyError(false);
    }, 1800);
  };
  const downloadResult = () => {
    if (!resultText) return;
    const url = URL.createObjectURL(
      new Blob([resultText], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `bert-${source}-query-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Storage may be disabled. */
    }
  };
  const copyTool = async (name: string, value: string) => {
    const success = await copyText(value);
    setCopiedTool(success ? name : "error");
    window.setTimeout(() => setCopiedTool(null), 1800);
  };
  const copyCurl = () => {
    try {
      const body = JSON.stringify({
        source,
        query,
        variables: JSON.parse(variables || "{}"),
      });
      const escaped = body.replaceAll("'", "'\\''");
      void copyTool(
        "curl",
        `curl -X POST '${window.location.origin}/api/graphql' -H 'content-type: application/json' --data '${escaped}'`,
      );
    } catch {
      setError("Fix the JSON variables before copying a cURL command.");
    }
  };

  return (
    <div className="page-enter studio-page">
      <div className="studio-heading">
        <div>
          <Eyebrow>THE DATA IS YOURS TO EXPLORE</Eyebrow>
          <h1>
            Query Studio<span>.</span>
          </h1>
          <p>
            Inspect BERT&apos;s indexed protocol state directly. Build queries,
            compare versions and export results.
          </p>
        </div>
        <div className="studio-heading-art">
          <Terminal size={40} />
          <span>GRAPHQL / READ ONLY</span>
        </div>
      </div>
      <div className="studio-command-bar">
        <span className="studio-command-prompt">$</span>
        <span className="studio-command-method">POST</span>
        <code>/api/graphql</code>
        <span className="studio-command-source">
          {source === "v3" ? "V3.1 Community" : "V2.3 Funding"}
        </span>
        <div>
          <button
            onClick={() => void copyTool("query", query)}
            title="Copy current GraphQL query"
            aria-label="Copy current GraphQL query"
          >
            {copiedTool === "query" ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copiedTool === "query" ? "Copied" : "Query"}
          </button>
          <button
            onClick={copyCurl}
            title="Copy a runnable cURL command"
            aria-label="Copy a runnable cURL command"
          >
            {copiedTool === "curl" ? (
              <Check size={14} />
            ) : (
              <Terminal size={14} />
            )}{" "}
            {copiedTool === "curl" ? "Copied" : "cURL"}
          </button>
          {copiedTool === "error" && (
            <span className="studio-copy-error">Copy failed</span>
          )}
        </div>
      </div>
      <div className="studio-layout">
        <aside className="studio-sidebar">
          <div className="studio-sidebar-title">
            <Layers3 size={16} />
            <span>EXPLORER</span>
          </div>
          <Link href="/explore" className="studio-schema-link">
            <Layers3 size={15} /> Browse all 28 collections{" "}
            <ExternalLink size={13} />
          </Link>
          <div className="studio-sidebar-section">
            <small>DATA SOURCES</small>
            <button
              className={
                source === "v3" ? "source-option active" : "source-option"
              }
              onClick={() => selectPreset("v3-communities")}
            >
              <span className="source-option-icon violet">
                <Braces size={16} />
              </span>
              <span>
                V3.1 Community<small>Community Layer</small>
              </span>
              <i className={health?.v3.ok ? "small-dot ok" : "small-dot"} />
            </button>
            <button
              className={
                source === "v2" ? "source-option active" : "source-option"
              }
              onClick={() => selectPreset("v2-stats")}
            >
              <span className="source-option-icon blue">
                <Code2 size={16} />
              </span>
              <span>
                V2.3 Funding<small>Funding Layer</small>
              </span>
              <i className={health?.v2.ok ? "small-dot ok" : "small-dot"} />
            </button>
          </div>
          <div className="studio-sidebar-section preset-section">
            <small>STARTER QUERIES</small>
            {queryPresets
              .filter((item) => item.source === source)
              .map((preset) => (
                <button
                  key={preset.id}
                  className="preset-option"
                  onClick={() => selectPreset(preset.id)}
                >
                  <span>{preset.label}</span>
                  <small>{preset.description}</small>
                  <ArrowRight size={13} />
                </button>
              ))}
          </div>
          <button
            className="history-trigger"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History size={16} /> Query history <span>{history.length}</span>
            <ChevronDown size={14} />
          </button>
          {historyOpen && (
            <div className="history-list">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSource(item.source);
                    setQuery(item.query);
                    setVariables(item.variables);
                    setHistoryOpen(false);
                    setError(null);
                    setResult(null);
                    setResultText("");
                    setDuration(null);
                    setView("json");
                  }}
                >
                  <span className={item.ok ? "small-dot ok" : "small-dot"} />
                  {item.source.toUpperCase()} ·{" "}
                  {new Date(item.at).toLocaleTimeString()}
                  <small>{item.duration}ms</small>
                </button>
              ))}
              {history.length > 0 && (
                <button className="clear-history" onClick={clearHistory}>
                  <Trash2 size={13} /> Clear history
                </button>
              )}
              {history.length === 0 && <p>No queries yet.</p>}
            </div>
          )}
        </aside>
        <div className="studio-main">
          <form className="editor-card" onSubmit={run}>
            <div className="editor-toolbar">
              <div className="editor-tab">
                <span className="editor-tab-dot" />
                <FileJson2 size={15} /> query.graphql{" "}
                <span className="unsaved-dot" />
              </div>
              <div className="editor-actions">
                <span className="editor-source-label">
                  {source === "v3" ? "V3.1" : "V2.3"}
                </span>
                <button
                  type="button"
                  onClick={formatQuery}
                  title="Format GraphQL"
                >
                  <Sparkles size={14} /> Format
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(
                      queryPresets.find((item) => item.source === source)
                        ?.query ?? "",
                    );
                    setVariables("{}");
                  }}
                  title="Reset query"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
            <div className="code-editor">
              <div className="line-numbers" aria-hidden="true">
                {query.split("\n").map((_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onEditorKeyDown}
                spellCheck={false}
                aria-label="GraphQL query editor"
              />
            </div>
            <div className="variables-bar">
              <button
                type="button"
                onClick={() => setVariablesOpen(!variablesOpen)}
              >
                <Braces size={15} /> QUERY VARIABLES{" "}
                <ChevronDown
                  size={14}
                  className={variablesOpen ? "rotate" : ""}
                />
              </button>
              <span>JSON OBJECT</span>
            </div>
            {variablesOpen && (
              <textarea
                className="variables-editor"
                value={variables}
                onChange={(event) => setVariables(event.target.value)}
                spellCheck={false}
                aria-label="GraphQL variables JSON"
              />
            )}
            <div className="editor-footer">
              <span>⌘ / Ctrl + Enter to run · Tab to indent</span>
              <button
                className="run-button"
                disabled={running || !query.trim()}
                type="submit"
              >
                {running ? (
                  <>
                    <span className="spinning">
                      <RotateCcw size={15} />
                    </span>{" "}
                    Running
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" /> Run query
                  </>
                )}
              </button>
            </div>
          </form>
          <div className="response-card">
            <div className="response-toolbar">
              <div className="response-title">
                <span className="response-pulse" /> RESPONSE{" "}
                {duration !== null && <small>{duration} ms</small>}
              </div>
              <div className="response-actions">
                <button
                  className={view === "json" ? "active" : ""}
                  onClick={() => setView("json")}
                >
                  <Braces size={14} /> JSON
                </button>
                <button
                  className={view === "table" ? "active" : ""}
                  onClick={() => setView("table")}
                >
                  <Table2 size={14} /> Table
                </button>
                <i />
                <button
                  onClick={copyResult}
                  disabled={!resultText}
                  title={
                    copied
                      ? "Copied"
                      : copyError
                        ? "Copy failed"
                        : "Copy response"
                  }
                  aria-label={copied ? "Response copied" : "Copy response"}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <button
                  onClick={downloadResult}
                  disabled={!resultText}
                  title="Download JSON"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>
            {error && <div className="query-error">{error}</div>}
            {result === null ? (
              <div className="response-welcome">
                <span>
                  <Terminal size={30} />
                </span>
                <h3>Your response will appear here</h3>
                <p>
                  Select a starter query or write your own, then press Run
                  query.
                </p>
                <div>
                  <Clock3 size={14} /> Results are fetched live from Graph
                  Studio
                </div>
              </div>
            ) : view === "table" ? (
              <ResultTable data={(result as { data?: unknown }).data} />
            ) : (
              <pre className="response-code">
                <code>{resultText}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
      <div className="studio-footer-note">
        <span>Read only · Arc Testnet · No wallet connection</span>
        <span>
          Responses may lag behind the latest chain block while indexing catches
          up.
        </span>
      </div>
    </div>
  );
}
