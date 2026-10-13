"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Inbox,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";
import { protocol } from "@/lib/protocol";
import { compactAddress, formatAmount } from "@/lib/format";
import { copyText } from "@/lib/clipboard";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}
export function StateBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  return (
    <span className={`state-badge ${tone}`}>
      <i />
      {label}
    </span>
  );
}
export function LoadingPanel({
  text = "Reading indexed protocol state...",
}: {
  text?: string;
}) {
  return (
    <div className="state-panel">
      <LoaderCircle size={22} className="spinning" />
      <p>{text}</p>
    </div>
  );
}
export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="state-panel">
      <Inbox size={24} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
export function ErrorPanel({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="state-panel error-panel">
      <AlertCircle size={24} />
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}
export function Amount({
  value,
  prefix = "",
}: {
  value: string | number | null | undefined;
  prefix?: string;
}) {
  return (
    <span className="amount">
      {prefix}
      {formatAmount(value)} <small>USDC</small>
    </span>
  );
}
export function Address({
  value,
  showExternal = true,
}: {
  value: string | null | undefined;
  showExternal?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  if (!value) return <span className="muted">—</span>;
  const copy = async () => {
    const success = await copyText(value);
    setCopied(success);
    setCopyFailed(!success);
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1800);
  };
  return (
    <span className="address">
      <code title={value}>{compactAddress(value)}</code>
      <button
        onClick={copy}
        aria-label={copied ? "Address copied" : `Copy address ${value}`}
        title={copied ? "Copied" : copyFailed ? "Copy failed" : "Copy address"}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      {showExternal && (
        <a
          href={`${protocol.links.explorer}/address/${value}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${value} in explorer`}
          title="Open in explorer"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </span>
  );
}
export function ExternalTextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="text-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
