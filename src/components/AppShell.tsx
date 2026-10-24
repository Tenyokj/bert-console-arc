"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  CircleHelp,
  Code2,
  Command,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { protocol } from "@/lib/protocol";
import { formatCount } from "@/lib/format";
import { useProtocol } from "@/components/ProtocolProvider";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/funding", label: "V2.3 Funding", icon: Wallet },
  { href: "/communities", label: "V3.2 Communities", icon: Boxes },
  { href: "/explore", label: "Data Explorer", icon: Database },
  { href: "/deployments", label: "Deployments", icon: ShieldCheck },
  { href: "/console", label: "Query Studio", icon: Code2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { health, summary, refreshing, refresh } = useProtocol();
  const online = !!health && health.rpc.ok && health.v2.ok && health.v3.ok;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSidebarCollapsed(
        window.localStorage.getItem("bert-console-sidebar") === "collapsed",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      window.localStorage.setItem(
        "bert-console-sidebar",
        current ? "expanded" : "collapsed",
      );
      return !current;
    });
  };

  useEffect(() => {
    const openStudio = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/console");
      }
    };
    window.addEventListener("keydown", openStudio);
    return () => window.removeEventListener("keydown", openStudio);
  }, [router]);

  return (
    <div className={`app-frame ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <button
        className={`mobile-scrim ${menuOpen ? "is-open" : ""}`}
        aria-label="Close menu"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="side-brand">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            aria-label="BERT Console home"
          >
            <span className="brand-icon">
              <Image
                src="/bert-logo.png"
                alt=""
                width={38}
                height={38}
                priority
              />
            </span>
            <span className="brand-wordmark">
              <strong>BERT</strong>
              <small>PROTOCOL CONSOLE</small>
            </span>
          </Link>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="side-network">
          <span className="network-pulse" />
          <div className="side-network-copy">
            <strong>ARC TESTNET</strong>
            <small>Chain ID {protocol.chainId.toLocaleString()}</small>
          </div>
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={
            sidebarCollapsed ? "Expand navigation" : "Collapse navigation"
          }
          title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={17} />
          ) : (
            <PanelLeftClose size={17} />
          )}
          <span>{sidebarCollapsed ? "Expand" : "Collapse sidebar"}</span>
        </button>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Console navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={`side-nav-link ${pathname === item.href ? "active" : ""}`}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                aria-label={item.label}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.href === "/console" && <small>⌘ K</small>}
              </Link>
            );
          })}
        </nav>
        <div className="side-label resources-label">RESOURCES</div>
        <div className="side-nav resource-nav">
          <a
            href={protocol.links.dapp}
            target="_blank"
            rel="noreferrer"
            title="BERT dApp"
            aria-label="BERT dApp"
          >
            <Command size={17} /> <span>BERT dApp</span>{" "}
            <ArrowUpRight size={13} />
          </a>
          <a
            href={protocol.links.docs}
            target="_blank"
            rel="noreferrer"
            title="Documentation"
            aria-label="Documentation"
          >
            <BookOpen size={17} /> <span>Documentation</span>{" "}
            <ArrowUpRight size={13} />
          </a>
          <a
            href={protocol.links.consoleSource}
            target="_blank"
            rel="noreferrer"
            title="Console source on GitHub"
            aria-label="Console source on GitHub"
          >
            <GitBranch size={17} /> <span>Console source</span>{" "}
            <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="side-bottom">
          <div className="side-bottom-header">
            <Radio size={15} />
            <span>NETWORK MONITOR</span>
            <span className={online ? "small-dot ok" : "small-dot"} />
          </div>
          <div className="side-bottom-row">
            <span>RPC</span>
            <b>{health?.rpc.ok ? "Online" : health ? "Offline" : "Checking"}</b>
          </div>
          <div className="side-bottom-row">
            <span>V2 Indexer</span>
            <b>{health?.v2.ok ? "Online" : health ? "Offline" : "Checking"}</b>
          </div>
          <div className="side-bottom-row">
            <span>V3 Indexer</span>
            <b>{health?.v3.ok ? "Online" : health ? "Offline" : "Checking"}</b>
          </div>
        </div>
        <div className="side-credit">
          BERT CONSOLE <span>V0.1.0 BETA</span>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={21} />
            </button>
            <strong className="topbar-title">
              {nav.find((item) => item.href === pathname)?.label ?? "Overview"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-sync">
              <span className={online ? "small-dot ok" : "small-dot"} />
              {online
                ? "All systems operational"
                : health
                  ? "Source degraded"
                  : "Connecting"}
            </span>
            <button
              className="icon-button refresh-button"
              onClick={refresh}
              aria-label="Refresh protocol data"
              title="Refresh data"
            >
              <RefreshCw size={17} className={refreshing ? "spinning" : ""} />
            </button>
            <a
              className="topbar-docs"
              href={protocol.links.docs}
              target="_blank"
              rel="noreferrer"
            >
              <CircleHelp size={17} /> Help <ArrowUpRight size={13} />
            </a>
          </div>
        </header>
        <div className="content-wrap">{children}</div>
        <footer className="footer">
          <span>© 2026 BERT DAO · Open protocol data</span>
          <span>
            <Activity size={13} /> Arc Testnet block{" "}
            {formatCount(health?.rpc.block)} <i /> Indexed V3.2 block{" "}
            {formatCount(summary?.v3.data?._meta.block.number)}
          </span>
          <div>
            <a href={protocol.links.docs} target="_blank" rel="noreferrer">
              <FileText size={14} /> Docs
            </a>
            <a
              href={protocol.links.consoleSource}
              target="_blank"
              rel="noreferrer"
            >
              <GitBranch size={14} /> Source
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
